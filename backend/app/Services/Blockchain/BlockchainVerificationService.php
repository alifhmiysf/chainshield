<?php

namespace App\Services\Blockchain;

use App\Models\AuditBatch;
use App\Models\AuditLog;
use App\Models\BlockchainTransaction;
use App\Services\Audit\MerkleTreeService;
use RuntimeException;
use Symfony\Component\Process\Process;

class BlockchainVerificationService
{
    public function __construct(
        private MerkleTreeService $merkleTree
    ) {}

    public function verify(AuditBatch $batch): array
    {
        // 1. Pastikan batch sudah pernah di-anchor.
        if ($batch->status !== 'anchored') {
            throw new RuntimeException(
                'Only anchored batches can be verified.'
            );
        }

        // 2. Ambil transaksi blockchain yang berhasil.
        $transaction = BlockchainTransaction::query()
            ->where('audit_batch_id', $batch->id)
            ->where('status', 'confirmed')
            ->whereNotNull('transaction_hash')
            ->whereNotNull('block_number')
            ->orderByDesc('id')
            ->first();

        if (!$transaction) {
            throw new RuntimeException(
                'Confirmed blockchain transaction not found.'
            );
        }

        // 3. Periksa konfigurasi transaksi.
        $chainId = (int) config('blockchain.chain_id');
        $contractAddress = config('blockchain.contract_address');
        $rpcUrl = config('blockchain.rpc_url');

        if (
            (int) $transaction->chain_id !== $chainId ||
            strtolower($transaction->contract_address) !== strtolower($contractAddress) ||
            $transaction->network !== config('blockchain.network')
        ) {
            throw new RuntimeException(
                'Blockchain transaction configuration mismatch.'
            );
        }

        if (
            empty($rpcUrl) ||
            empty($contractAddress) ||
            empty($transaction->transaction_hash) ||
            empty($transaction->block_number)
        ) {
            throw new RuntimeException(
                'Blockchain verification configuration is incomplete.'
            );
        }

        // 4. Ambil audit logs berdasarkan rentang sequence batch.
        $logs = AuditLog::query()
            ->whereBetween('sequence', [
                $batch->start_sequence,
                $batch->end_sequence,
            ])
            ->orderBy('sequence')
            ->get();

        // 5. Validasi jumlah audit logs.
        if ($logs->count() !== (int) $batch->total_records) {
            throw new RuntimeException(
                'Audit log count does not match batch records.'
            );
        }

        if ($logs->isEmpty()) {
            throw new RuntimeException(
                'No audit logs found for this batch.'
            );
        }

        // 6. Hitung ulang Merkle Root.
        $hashes = $logs->pluck('payload_hash')->toArray();

        $calculatedRoot = $this->merkleTree->generateRoot($hashes);

        if ($calculatedRoot === null) {
            throw new RuntimeException(
                'Unable to recalculate Merkle Root.'
            );
        }

        // 7. Cocokkan Merkle Root dengan database.
        if (!hash_equals(
            strtolower($batch->merkle_root),
            strtolower($calculatedRoot)
        )) {
            throw new RuntimeException(
                'Database Merkle Root integrity check failed.'
            );
        }

        // 8. Tentukan lokasi project blockchain.
        $blockchainPath = dirname(base_path())
            . DIRECTORY_SEPARATOR . 'blockchain';

        $scriptPath = $blockchainPath
            . DIRECTORY_SEPARATOR . 'scripts'
            . DIRECTORY_SEPARATOR . 'laravel-bridge'
            . DIRECTORY_SEPARATOR . 'verify.mjs';

        if (!is_file($scriptPath)) {
            throw new RuntimeException(
                'Blockchain verification script not found.'
            );
        }

        // 9. Siapkan konfigurasi OpenSSL khusus Node.js.
        $opensslConfigPath = base_path(
            'storage/app/node-openssl.cnf'
        );

        if (!is_file($opensslConfigPath)) {
            throw new RuntimeException(
                'Node.js OpenSSL configuration file not found.'
            );
        }

        // 10. Siapkan environment proses Node.js.
        $childEnvironment = getenv();

        $childEnvironment['OPENSSL_CONF'] = $opensslConfigPath;

        // 11. Jalankan verifier Node.js secara read-only.
        $process = new Process(
            [
                'C:\\Program Files\\nodejs\\node.exe',
                $scriptPath,
                $rpcUrl,
                (string) $chainId,
                $contractAddress,
                (string) $batch->batch_number,
                '0x' . $calculatedRoot,
                (string) $batch->total_records,
                $transaction->transaction_hash,
                (string) $transaction->block_number,
            ],
            $blockchainPath,
            $childEnvironment
        );

        $process->setTimeout(120);
        $process->run();

        // 12. Baca hasil verifikasi.
        $output = trim($process->getOutput());
        $errorOutput = trim($process->getErrorOutput());

        $result = json_decode($output, true);

        if (!is_array($result)) {
            throw new RuntimeException(
                'Invalid response from blockchain verification script. ' .
                'Exit code: ' . $process->getExitCode() .
                ' | JSON error: ' . json_last_error_msg() .
                ' | STDOUT: ' . substr($output, 0, 2000) .
                ' | STDERR: ' . substr($errorOutput, 0, 2000)
            );
        }

        if (
            !$process->isSuccessful() ||
            ($result['success'] ?? false) !== true
        ) {
            throw new RuntimeException(
                'Blockchain verification failed. ' .
                'Exit code: ' . $process->getExitCode() .
                ' | STDERR: ' . substr($errorOutput, 0, 2000)
            );
        }

        // 13. Kembalikan hasil verifikasi.
        return [
            'success' => true,
            'verified' => true,
            'database_integrity' => true,

            'blockchain_verification' => $result,

            'batch' => [
                'id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'merkle_root' => $batch->merkle_root,
                'total_records' => $batch->total_records,
                'status' => $batch->status,
            ],

            'transaction' => [
                'id' => $transaction->id,
                'transaction_hash' => $transaction->transaction_hash,
                'block_number' => $transaction->block_number,
                'status' => $transaction->status,
            ],
        ];
    }
}
