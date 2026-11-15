<?php

namespace App\Services\Blockchain;

use App\Models\AuditBatch;
use RuntimeException;
use Symfony\Component\Process\Process;

class BlockchainRecoveryRunner
{
    public function run(
        AuditBatch $batch,
        ?string $transactionHash = null
    ): array {
        $blockchainPath = dirname(base_path())
            . DIRECTORY_SEPARATOR . 'blockchain';

        $scriptPath = $blockchainPath
            . DIRECTORY_SEPARATOR . 'scripts'
            . DIRECTORY_SEPARATOR . 'laravel-bridge'
            . DIRECTORY_SEPARATOR . 'recover.mjs';

        if (! file_exists($scriptPath)) {
            throw new RuntimeException('Recovery script not found.');
        }

        $arguments = [
            'node',
            $scriptPath,
            (string) $batch->batch_number,
            $batch->merkle_root,
            (string) $batch->total_records,
        ];

        if ($transactionHash) {
            $arguments[] = $transactionHash;
        }

        $process = new Process($arguments, $blockchainPath);
        $process->setTimeout(120);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException(
                trim($process->getErrorOutput() ?: $process->getOutput())
            );
        }

        $result = json_decode(trim($process->getOutput()), true);

        if (! is_array($result)) {
            throw new RuntimeException('Invalid recovery JSON response.');
        }

        return $result;
    }
}
