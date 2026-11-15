<?php

namespace Tests\Feature;

use App\Models\AuditBatch;
use App\Models\BlockchainTransaction;
use App\Services\Blockchain\BlockchainRecoveryRunner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlockchainRecoveryServiceTest extends TestCase
{
    use RefreshDatabase;

    private function createTransaction(): array
    {
        $batch = AuditBatch::create([
            'batch_number' => 1,
            'merkle_root' => str_repeat('a', 64),
            'total_records' => 3,
            'start_sequence' => 1,
            'end_sequence' => 3,
            'status' => 'pending',
        ]);

        $transaction = BlockchainTransaction::create([
            'audit_batch_id' => $batch->id,
            'network' => 'sepolia',
            'chain_id' => 11155111,
            'contract_address' => '0xe9D974Bac52aa0F96E8AD9c254B8F47B69C105E4',
            'transaction_hash' => null,
            'status' => 'pending',
        ]);

        return [$batch, $transaction];
    }

    public function test_pending_transaction_is_recovered_as_confirmed(): void
    {
        [$batch, $transaction] = $this->createTransaction();

        $hash = '0x'.str_repeat('b', 64);

        $this->mock(BlockchainRecoveryRunner::class, function ($mock) use ($batch, $hash) {
            $mock->shouldReceive('run')
                ->once()
                ->withArgs(fn ($receivedBatch, $receivedHash) =>
                    $receivedBatch->id === $batch->id
                    && $receivedHash === null
                )
                ->andReturn([
                    'success' => true,
                    'state' => 'confirmed',
                    'transaction_hash' => $hash,
                    'block_number' => 123456,
                    'gas_used' => 450000,
                ]);
        });

        $summary = app(\App\Services\Blockchain\BlockchainRecoveryService::class)
            ->recover();

        $this->assertSame(1, $summary['checked']);
        $this->assertSame(1, $summary['confirmed']);
        $this->assertSame(0, $summary['errors']);

        $this->assertDatabaseHas('blockchain_transactions', [
            'id' => $transaction->id,
            'transaction_hash' => $hash,
            'block_number' => 123456,
            'gas_used' => 450000,
            'status' => 'confirmed',
            'error_message' => null,
        ]);

        $this->assertDatabaseHas('audit_batches', [
            'id' => $batch->id,
            'status' => 'anchored',
        ]);

        $this->assertNotNull($batch->fresh()->anchored_at);
    }

    public function test_transaction_stays_pending_when_batch_is_not_anchored(): void
    {
        [$batch, $transaction] = $this->createTransaction();

        $this->mock(BlockchainRecoveryRunner::class, function ($mock) use ($batch) {
            $mock->shouldReceive('run')
                ->once()
                ->andReturn([
                    'success' => true,
                    'state' => 'not_anchored',
                    'batch_id' => (string) $batch->batch_number,
                ]);
        });

        $summary = app(\App\Services\Blockchain\BlockchainRecoveryService::class)
            ->recover();

        $this->assertSame(1, $summary['not_ready']);

        $this->assertDatabaseHas('blockchain_transactions', [
            'id' => $transaction->id,
            'status' => 'pending',
            'transaction_hash' => null,
        ]);

        $this->assertDatabaseHas('audit_batches', [
            'id' => $batch->id,
            'status' => 'pending',
        ]);
    }

    public function test_conflicting_batch_is_marked_orphaned(): void
    {
        [, $transaction] = $this->createTransaction();

        $this->mock(BlockchainRecoveryRunner::class, function ($mock) {
            $mock->shouldReceive('run')
                ->once()
                ->andReturn([
                    'success' => true,
                    'state' => 'conflict',
                ]);
        });

        $summary = app(\App\Services\Blockchain\BlockchainRecoveryService::class)
            ->recover();

        $this->assertSame(1, $summary['conflicts']);

        $this->assertDatabaseHas('blockchain_transactions', [
            'id' => $transaction->id,
            'status' => 'orphaned',
        ]);
    }

    public function test_runner_error_does_not_confirm_transaction(): void
    {
        [, $transaction] = $this->createTransaction();

        $this->mock(BlockchainRecoveryRunner::class, function ($mock) {
            $mock->shouldReceive('run')
                ->once()
                ->andThrow(new \RuntimeException('RPC unavailable'));
        });

        $summary = app(\App\Services\Blockchain\BlockchainRecoveryService::class)
            ->recover();

        $this->assertSame(1, $summary['errors']);

        $this->assertDatabaseHas('blockchain_transactions', [
            'id' => $transaction->id,
            'status' => 'pending',
        ]);

        $this->assertStringContainsString(
            'RPC unavailable',
            $transaction->fresh()->error_message
        );
    }
}
