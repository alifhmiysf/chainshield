<?php

namespace App\Console\Commands;

use App\Services\Blockchain\BlockchainRecoveryService;
use Illuminate\Console\Command;
use Throwable;

class RecoverBlockchainTransactions extends Command
{
    protected $signature = 'chainshield:recover-transactions';

    protected $description = 'Recover and reconcile blockchain transactions';

    public function handle(
        BlockchainRecoveryService $recoveryService
    ): int {
        try {
            $this->info('Starting blockchain transaction recovery...');

            $summary = $recoveryService->recover();

            $this->table(
                ['Metric', 'Count'],
                [
                    ['Checked', $summary['checked']],
                    ['Confirmed', $summary['confirmed']],
                    ['Skipped', $summary['skipped'] ?? 0],
                    ['Not Ready', $summary['not_ready']],
                    ['Conflicts', $summary['conflicts']],
                    ['Errors', $summary['errors']],
                ]
            );

            $this->info('Blockchain recovery completed.');

            return $summary['errors'] > 0
                ? self::FAILURE
                : self::SUCCESS;

        } catch (Throwable $e) {
            report($e);

            $this->error(
                'Blockchain recovery failed: '.$e->getMessage()
            );

            return self::FAILURE;
        }
    }
}
