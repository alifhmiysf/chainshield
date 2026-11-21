<?php

namespace App\Services\Blockchain;

use App\Models\AuditBatch;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Symfony\Component\Process\Process;
use Throwable;

class BlockchainService
{
    public function anchor(AuditBatch $batch): array
    {
        $transaction = DB::transaction(function () use ($batch) {
            $lockedBatch = AuditBatch::query()
                ->lockForUpdate()
                ->findOrFail($batch->id);

            if ($lockedBatch->status !== 'pending') {
                throw new RuntimeException(
                    'Only pending audit batches can be anchored.'
                );
            }

            $latest = $lockedBatch->blockchainTransactions()
                ->latest('id')
                ->first();

            if (
                $latest &&
                in_array($latest->status, ['pending', 'confirmed'], true)
            ) {
                throw new RuntimeException(
                    'This batch already has a pending or confirmed transaction.'
                );
            }

            return $lockedBatch->blockchainTransactions()->create([
                'network' => config('blockchain.network'),
                'chain_id' => config('blockchain.chain_id'),
                'contract_address' => config('blockchain.contract_address'),
                'status' => 'pending',
            ]);
        });

        try {
            $blockchainPath = dirname(base_path())
                . DIRECTORY_SEPARATOR . 'blockchain';

            $scriptPath = $blockchainPath
                . DIRECTORY_SEPARATOR . 'scripts'
                . DIRECTORY_SEPARATOR . 'laravel-bridge'
                . DIRECTORY_SEPARATOR . 'anchor.mjs';

            if (! file_exists($scriptPath)) {
                throw new RuntimeException(
                    'Blockchain bridge script not found.'
                );
            }

            $nodeEnvironment = getenv();
$privateKey = config('blockchain.private_key');

            if (! is_string($privateKey) || $privateKey === '') {
                throw new RuntimeException(
                    'SEPOLIA_PRIVATE_KEY is unavailable in Laravel process.'
                );
            }

            $nodeEnvironment['SEPOLIA_PRIVATE_KEY'] = $privateKey;
            $rpcUrl = config('blockchain.rpc_url');

if (! is_string($rpcUrl) || $rpcUrl === '') {
    throw new RuntimeException(
        'SEPOLIA_RPC_URL is unavailable in Laravel process.'
    );
}

$nodeEnvironment['SEPOLIA_RPC_URL'] = $rpcUrl;
            unset(
                $nodeEnvironment['CHAINSHIELD_PRECHECK'],
                $nodeEnvironment['CHAINSHIELD_GAS_CHECK'],
                $nodeEnvironment['CHAINSHIELD_SIGN_CHECK']
            );

            $process = new Process(
                [
                    'node',
                    $scriptPath,
                    (string) $batch->batch_number,
                    $batch->merkle_root,
                    (string) $batch->total_records,
                ],
                $blockchainPath,
                $nodeEnvironment
            );

            $process->setTimeout(120);

            $stdoutBuffer = '';
            $finalResult = null;

            $process->run(function ($type, $buffer) use (
                &$stdoutBuffer,
                &$finalResult,
                $transaction,
                $batch
            ) {
                if ($type !== Process::OUT) {
                    return;
                }

                $stdoutBuffer .= $buffer;

                while (($position = strpos($stdoutBuffer, "\n")) !== false) {
                    $line = trim(substr($stdoutBuffer, 0, $position));
                    $stdoutBuffer = substr($stdoutBuffer, $position + 1);

                    if ($line === '') {
                        continue;
                    }

                    $data = json_decode($line, true);

                    if (! is_array($data)) {
                        continue;
                    }

                    if (($data['event'] ?? null) === 'transaction_submitted') {
                        $hash = $data['transaction_hash'] ?? '';

                        if (
                            (string) ($data['batch_id'] ?? '') !==
                                (string) $batch->batch_number
                            || (string) ($data['chain_id'] ?? '') !==
                                (string) config('blockchain.chain_id')
                            || strtolower($data['contract_address'] ?? '') !==
                                strtolower(config('blockchain.contract_address'))
                            || ! preg_match('/^0x[a-fA-F0-9]{64}$/', $hash)
                        ) {
                            throw new RuntimeException(
                                'Invalid transaction submission event.'
                            );
                        }

                        // Simpan hash segera setelah broadcast.
                        $transaction->update([
                            'transaction_hash' => $hash,
                            'status' => 'pending',
                            'error_message' => null,
                        ]);
                    }

                    if (($data['success'] ?? false) === true) {
                        $finalResult = $data;
                    }
                }
            });

            // Tangani output terakhir jika tidak diakhiri newline.
            if (trim($stdoutBuffer) !== '') {
                $data = json_decode(trim($stdoutBuffer), true);

                if (is_array($data) && ($data['success'] ?? false) === true) {
                    $finalResult = $data;
                }
            }

            if (! $process->isSuccessful()) {
                throw new RuntimeException(
                    trim($process->getErrorOutput() ?: $process->getOutput())
                );
            }

            if (! is_array($finalResult)) {
                throw new RuntimeException(
                    'Blockchain did not return a valid confirmation.'
                );
            }

            $result = $finalResult;

            if (
                ($result['success'] ?? false) !== true
                || ($result['verified'] ?? false) !== true
                || ($result['status'] ?? null) !== 'confirmed'
                || (string) ($result['batch_id'] ?? '') !==
                    (string) $batch->batch_number
                || (string) ($result['chain_id'] ?? '') !==
                    (string) config('blockchain.chain_id')
                || strtolower($result['contract_address'] ?? '') !==
                    strtolower(config('blockchain.contract_address'))
                || ! preg_match(
                    '/^0x[a-fA-F0-9]{64}$/',
                    $result['transaction_hash'] ?? ''
                )
                || $transaction->fresh()->transaction_hash !==
                    $result['transaction_hash']
            ) {
                throw new RuntimeException(
                    'Blockchain returned an invalid confirmation response.'
                );
            }

            DB::transaction(function () use ($transaction, $batch, $result) {
                $lockedBatch = AuditBatch::query()
                    ->lockForUpdate()
                    ->findOrFail($batch->id);

                $transaction->update([
                    'transaction_hash' => $result['transaction_hash'],
                    'block_number' => $result['block_number'],
                    'gas_used' => $result['gas_used'],
                    'status' => 'confirmed',
                    'error_message' => null,
                    'confirmed_at' => now(),
                ]);

                $lockedBatch->update([
                    'status' => 'anchored',
                    'anchored_at' => now(),
                ]);
            });

            return $result;

        } catch (Throwable $e) {
            // Hash sudah tersimpan berarti transaksi mungkin sudah
            // berada di blockchain. Jangan langsung menandainya failed.
            $transaction->refresh();

            if ($transaction->transaction_hash) {
                $transaction->update([
                    'status' => 'pending',
                    'error_message' => mb_substr(
                        $e->getMessage(),
                        0,
                        2000
                    ),
                ]);
            } else {
                $transaction->update([
                    'status' => 'failed',
                    'error_message' => mb_substr(
                        $e->getMessage(),
                        0,
                        2000
                    ),
                ]);
            }

            throw $e;
        }
    }
}
