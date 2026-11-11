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
        // 1. Buat catatan transaksi dan cegah anchoring ganda.
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

        // Menandai apakah bridge sudah memberikan
        // bukti konfirmasi transaksi blockchain.
        $blockchainConfirmed = false;

        try {
            // 2. Tentukan lokasi script Node.js.
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

            // 3. Siapkan environment Node.js.
            $nodeEnvironment = getenv();

            $privateKey = getenv('SEPOLIA_PRIVATE_KEY');

            if (! is_string($privateKey) || $privateKey === '') {
                throw new RuntimeException(
                    'SEPOLIA_PRIVATE_KEY is unavailable in the Laravel process.'
                );
            }

            $nodeEnvironment['SEPOLIA_PRIVATE_KEY'] = $privateKey;

            // Pastikan semua mode diagnostik dinonaktifkan.
            unset(
                $nodeEnvironment['CHAINSHIELD_PRECHECK'],
                $nodeEnvironment['CHAINSHIELD_GAS_CHECK'],
                $nodeEnvironment['CHAINSHIELD_SIGN_CHECK']
            );

            // 4. Jalankan bridge dengan environment.
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
            $process->run();

            if (! $process->isSuccessful()) {
                throw new RuntimeException(
                    trim(
                        $process->getErrorOutput()
                        ?: $process->getOutput()
                    )
                );
            }

            // 5. Baca hasil Node.js.
            $result = json_decode(
                trim($process->getOutput()),
                true,
                512,
                JSON_THROW_ON_ERROR
            );

            // 6. Validasi konfirmasi blockchain.
            if (
                ($result['success'] ?? false) !== true
                || ($result['verified'] ?? false) !== true
                || ($result['status'] ?? null) !== 'confirmed'
                || (string) ($result['batch_id'] ?? '')
                    !== (string) $batch->batch_number
                || (string) ($result['chain_id'] ?? '')
                    !== (string) config('blockchain.chain_id')
                || strtolower($result['contract_address'] ?? '')
                    !== strtolower(config('blockchain.contract_address'))
                || ! preg_match(
                    '/^0x[a-fA-F0-9]{64}$/',
                    $result['transaction_hash'] ?? ''
                )
            ) {
                throw new RuntimeException(
                    'Blockchain returned an invalid confirmation response.'
                );
            }

            // Bridge telah memberikan bukti konfirmasi.
            $blockchainConfirmed = true;

            // 7. Simpan bukti transaksi ke database.
            DB::transaction(function () use (
                $transaction,
                $batch,
                $result
            ) {
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
            // 8. Jangan menandai transaksi failed jika bridge
            // sudah mengembalikan bukti konfirmasi.
            if (! $blockchainConfirmed) {
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
