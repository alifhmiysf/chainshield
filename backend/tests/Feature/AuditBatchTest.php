<?php

namespace Tests\Feature;

use App\Models\AuditBatch;
use App\Services\Audit\AuditBatchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditBatchTest extends TestCase
{
    use RefreshDatabase;

    private function insertAuditLog(int $sequence, string $hash): void
    {
        DB::table('audit_logs')->insert([
            'sequence' => $sequence,
            'actor_id' => null,
            'action' => 'test.audit',
            'entity_type' => 'Test',
            'entity_id' => (string) $sequence,
            'payload' => json_encode([
                'sequence' => $sequence,
            ]),
            'payload_hash' => $hash,
            'previous_hash' => str_repeat('0', 64),
            'current_hash' => hash('sha256', 'record-'.$sequence),
            'created_at' => now(),
        ]);
    }

    public function test_it_creates_batch_from_unbatched_audit_logs(): void
    {
        $hashes = [
            str_repeat('a', 64),
            str_repeat('b', 64),
            str_repeat('c', 64),
        ];

        foreach ($hashes as $index => $hash) {
            $this->insertAuditLog($index + 1, $hash);
        }

        $batch = app(AuditBatchService::class)->createBatch();

        $expectedRoot = hash(
            'sha256',
            hash('sha256', $hashes[0].$hashes[1])
                .hash('sha256', $hashes[2].$hashes[2])
        );

        $this->assertNotNull($batch);
        $this->assertSame(1, $batch->batch_number);
        $this->assertSame(3, $batch->total_records);
        $this->assertSame(1, $batch->start_sequence);
        $this->assertSame(3, $batch->end_sequence);
        $this->assertSame($expectedRoot, $batch->merkle_root);
        $this->assertSame('pending', $batch->status);

        $this->assertDatabaseHas('audit_batches', [
            'batch_number' => 1,
            'total_records' => 3,
            'status' => 'pending',
        ]);
    }

    public function test_it_does_not_create_batch_when_there_are_no_audit_logs(): void
    {
        $batch = app(AuditBatchService::class)->createBatch();

        $this->assertNull($batch);
        $this->assertDatabaseCount('audit_batches', 0);
    }

    public function test_it_only_includes_logs_after_last_batch_sequence(): void
    {
        AuditBatch::create([
            'batch_number' => 1,
            'merkle_root' => str_repeat('a', 64),
            'total_records' => 2,
            'start_sequence' => 1,
            'end_sequence' => 2,
            'status' => 'pending',
        ]);

        $this->insertAuditLog(1, str_repeat('1', 64));
        $this->insertAuditLog(2, str_repeat('2', 64));
        $this->insertAuditLog(3, str_repeat('3', 64));
        $this->insertAuditLog(4, str_repeat('4', 64));

        $batch = app(AuditBatchService::class)->createBatch();

        $this->assertNotNull($batch);
        $this->assertSame(2, $batch->batch_number);
        $this->assertSame(2, $batch->total_records);
        $this->assertSame(3, $batch->start_sequence);
        $this->assertSame(4, $batch->end_sequence);
    }

    public function test_it_creates_sequential_batch_numbers(): void
    {
        AuditBatch::create([
            'batch_number' => 4,
            'merkle_root' => str_repeat('a', 64),
            'total_records' => 1,
            'start_sequence' => 1,
            'end_sequence' => 1,
            'status' => 'pending',
        ]);

        $this->insertAuditLog(2, str_repeat('b', 64));

        $batch = app(AuditBatchService::class)->createBatch();

        $this->assertNotNull($batch);
        $this->assertSame(5, $batch->batch_number);
    }
}
