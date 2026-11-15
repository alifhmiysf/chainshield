<?php

namespace App\Console\Commands;

use App\Services\Audit\AuditBatchService;
use Illuminate\Console\Command;
use Throwable;

class CreateAuditBatch extends Command
{
    protected $signature = 'chainshield:batch-audits';

    protected $description = 'Automatically create an audit batch from unbatched audit logs';

    public function handle(AuditBatchService $batchService): int
    {
        try {
            $this->info('Starting ChainShield audit batching...');

            $batch = $batchService->createBatch();

            if ($batch === null) {
                $this->comment('No new audit logs. No batch created.');

                return self::SUCCESS;
            }

            $this->info('Audit batch created successfully.');

            $this->table(
                ['Field', 'Value'],
                [
                    ['Batch Number', $batch->batch_number],
                    ['Merkle Root', $batch->merkle_root],
                    ['Total Records', $batch->total_records],
                    ['Start Sequence', $batch->start_sequence],
                    ['End Sequence', $batch->end_sequence],
                    ['Status', $batch->status],
                ]
            );

            return self::SUCCESS;

        } catch (Throwable $exception) {
            report($exception);

            $this->error('Audit batching failed: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
