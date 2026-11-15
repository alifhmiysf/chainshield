<?php

namespace Tests\Feature;

use App\Services\Blockchain\BlockchainRecoveryService;
use Mockery\MockInterface;
use Tests\TestCase;

class BlockchainRecoveryCommandTest extends TestCase
{
    public function test_recovery_command_processes_transactions_successfully(): void
    {
        $this->mock(
            BlockchainRecoveryService::class,
            function (MockInterface $mock) {
                $mock->shouldReceive('recover')
                    ->once()
                    ->andReturn([
                        'checked' => 3,
                        'confirmed' => 2,
                        'not_ready' => 1,
                        'conflicts' => 0,
                        'errors' => 0,
                    ]);
            }
        );

        $this->artisan('chainshield:recover-transactions')
            ->expectsOutput('Starting blockchain transaction recovery...')
            ->expectsOutput('Blockchain recovery completed.')
            ->assertExitCode(0);
    }

    public function test_recovery_command_returns_failure_when_recovery_has_errors(): void
    {
        $this->mock(
            BlockchainRecoveryService::class,
            function (MockInterface $mock) {
                $mock->shouldReceive('recover')
                    ->once()
                    ->andReturn([
                        'checked' => 2,
                        'confirmed' => 0,
                        'not_ready' => 1,
                        'conflicts' => 0,
                        'errors' => 1,
                    ]);
            }
        );

        $this->artisan('chainshield:recover-transactions')
            ->expectsOutput('Starting blockchain transaction recovery...')
            ->expectsOutput('Blockchain recovery completed.')
            ->assertExitCode(1);
    }
}
