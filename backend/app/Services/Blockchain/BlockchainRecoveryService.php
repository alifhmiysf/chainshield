<?php

namespace App\Services\Blockchain;

use App\Models\AuditBatch;
use App\Models\BlockchainTransaction;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class BlockchainRecoveryService
{
    private const NETWORK = 'sepolia';

    private const CHAIN_ID = 11155111;

    private const CONTRACT_ADDRESS =
        '0xe9d974bac52aa0f96e8ad9c254b8f47b69c105e4';

    public function __construct(
        private BlockchainRecoveryRunner $runner
    ) {}

    public function recover(): array
    {
        $transactions = BlockchainTransaction::query()
            ->whereIn('status', ['pending', 'failed', 'orphaned'])
            ->where('network', self::NETWORK)
            ->where('chain_id', self::CHAIN_ID)
            ->whereRaw(
                'LOWER(contract_address) = ?',
                [self::CONTRACT_ADDRESS]
            )
            ->with('auditBatch')
            ->orderBy('id')
            ->get();

        $summary = [
            'checked' => 0,
            'confirmed' => 0,
            'not_ready' => 0,
            'conflicts' => 0,
            'errors' => 0,
            'skipped' => 0,
        ];

        $processedBatches = [];

        foreach ($transactions as $transaction) {
            $summary['checked']++;

            $batchKey = implode(':', [
                $transaction->audit_batch_id,
                $transaction->network,
                $transaction->chain_id,
                strtolower($transaction->contract_address),
            ]);

            // Hindari recovery berulang untuk batch yang sama
            // dalam satu kali proses.
            if (isset($processedBatches[$batchKey])) {
                $summary['skipped']++;
                continue;
            }

            $processedBatches[$batchKey] = true;

            try {
                $result = $this->recoverTransaction($transaction);

                if ($result === 'confirmed') {
                    $summary['confirmed']++;
                } elseif ($result === 'conflict') {
                    $summary['conflicts']++;
                } elseif ($result === 'already_confirmed') {
                    $summary['skipped']++;
                } else {
                    $summary['not_ready']++;
                }
            } catch (Throwable $e) {
                report($e);

                $transaction->refresh();

                $transaction->update([
                    'error_message' => mb_substr(
                        'Recovery error: '.$e->getMessage(),
                        0,
                        2000
                    ),
                ]);

                $summary['errors']++;
            }
        }

        return $summary;
    }

    private function recoverTransaction(
        BlockchainTransaction $transaction
    ): string {
        $batch = $transaction->auditBatch;

        if (! $batch) {
            throw new RuntimeException(
                'Related audit batch was not found.'
            );
        }

        // Periksa apakah batch sudah memiliki transaksi
        // confirmed pada jaringan dan contract yang sama.
        $alreadyConfirmed = BlockchainTransaction::query()
            ->where('audit_batch_id', $batch->id)
            ->where('network', self::NETWORK)
            ->where('chain_id', self::CHAIN_ID)
            ->whereRaw(
                'LOWER(contract_address) = ?',
                [self::CONTRACT_ADDRESS]
            )
            ->where('status', 'confirmed')
            ->exists();

        if ($alreadyConfirmed) {
            return 'already_confirmed';
        }

        $result = $this->runner->run(
            $batch,
            $transaction->transaction_hash
        );

        if (! ($result['success'] ?? false)) {
            throw new RuntimeException(
                'Blockchain recovery was unsuccessful.'
            );
        }

        $state = $result['state'] ?? null;

        if ($state === 'not_anchored') {
            return 'not_ready';
        }

        if ($state === 'conflict') {
            $transaction->update([
                'status' => 'orphaned',
                'error_message' =>
                    'On-chain batch conflicts with local audit batch.',
            ]);

            return 'conflict';
        }

        if ($state === 'anchored_hash_unavailable') {
            $transaction->update([
                'error_message' =>
                    'Batch exists on-chain, but transaction hash could not be uniquely recovered.',
            ]);

            return 'not_ready';
        }

        if ($state !== 'confirmed') {
            throw new RuntimeException(
                'Unknown recovery state: '.(string) $state
            );
        }

        $hash = $result['transaction_hash'] ?? null;
        $blockNumber = $result['block_number'] ?? null;
        $gasUsed = $result['gas_used'] ?? null;

        if (
            ! is_string($hash)
            || ! preg_match('/^0x[a-fA-F0-9]{64}$/', $hash)
            || ! is_numeric($blockNumber)
            || ! is_numeric($gasUsed)
        ) {
            throw new RuntimeException(
                'Recovered blockchain confirmation data is invalid.'
            );
        }

        DB::transaction(function () use (
            $transaction,
            $batch,
            $hash,
            $blockNumber,
            $gasUsed
        ) {
            $lockedBatch = AuditBatch::query()
                ->lockForUpdate()
                ->findOrFail($batch->id);

            // Periksa ulang sebelum menyimpan untuk menghindari
            // duplikasi jika ada proses recovery bersamaan.
            $existingConfirmation = BlockchainTransaction::query()
                ->where('audit_batch_id', $lockedBatch->id)
                ->where('network', self::NETWORK)
                ->where('chain_id', self::CHAIN_ID)
                ->whereRaw(
                    'LOWER(contract_address) = ?',
                    [self::CONTRACT_ADDRESS]
                )
                ->where('status', 'confirmed')
                ->exists();

            if ($existingConfirmation) {
                return;
            }

            $transaction->update([
                'transaction_hash' => $hash,
                'block_number' => $blockNumber,
                'gas_used' => $gasUsed,
                'status' => 'confirmed',
                'error_message' => null,
                'confirmed_at' => now(),
            ]);

            $lockedBatch->update([
                'status' => 'anchored',
                'anchored_at' => $lockedBatch->anchored_at ?? now(),
            ]);
        });

        return 'confirmed';
    }
}
