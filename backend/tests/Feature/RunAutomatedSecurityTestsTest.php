<?php

namespace Tests\Feature;

use App\Models\LabSession;
use App\Models\PentestTarget;
use App\Models\User;
use App\Services\Security\LabSecurityTestService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class RunAutomatedSecurityTestsTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(): User
    {
        return User::create([
            'name' => 'Automated Scanner Tester',
            'email' => 'automated-scanner@example.com',
            'password' => 'password',
        ]);
    }

    private function createTarget(
        User $user,
        string $status = 'approved'
    ): PentestTarget {
        return PentestTarget::create([
            'user_id' => $user->id,
            'name' => 'Automated Test Target',
            'target_url' => 'http://127.0.0.1:8000',
            'target_type' => 'web_application',
            'authorization_status' => $status,
        ]);
    }

    private function createSession(
        User $user,
        PentestTarget $target,
        string $status = 'running',
        array $configuration = []
    ): LabSession {
        return LabSession::create([
            'user_id' => $user->id,
            'pentest_target_id' => $target->id,
            'name' => 'Automated Security Test',
            'status' => $status,
            'configuration' => $configuration,
            'started_at' => now(),
        ]);
    }

    private function successfulResult(int $findings = 0): array
    {
        return [
            'total_findings' => $findings,
            'severity_counts' => [
                'critical' => 0,
                'high' => 0,
                'medium' => $findings,
                'low' => 0,
                'info' => 0,
            ],
            'scanner_errors' => [],
        ];
    }

    protected function setUp(): void
    {
        parent::setUp();

        config(['cache.default' => 'array']);
    }

    public function test_command_rejects_nonexistent_session(): void
    {
        $service = $this->mock(LabSecurityTestService::class);
        $service->shouldNotReceive('execute');

        $this->artisan('chainshield:run-security-tests', [
            'session_id' => 99999,
        ])->assertFailed();
    }

    public function test_command_rejects_session_that_is_not_running(): void
    {
        $user = $this->createUser();
        $target = $this->createTarget($user);
        $session = $this->createSession(
            $user,
            $target,
            'pending'
        );

        $service = $this->mock(LabSecurityTestService::class);
        $service->shouldNotReceive('execute');

        $this->artisan('chainshield:run-security-tests', [
            'session_id' => $session->id,
        ])->assertFailed();
    }

    public function test_command_rejects_unapproved_target(): void
    {
        $user = $this->createUser();
        $target = $this->createTarget($user, 'pending');
        $session = $this->createSession($user, $target);

        $service = $this->mock(LabSecurityTestService::class);
        $service->shouldNotReceive('execute');

        $this->artisan('chainshield:run-security-tests', [
            'session_id' => $session->id,
        ])->assertFailed();
    }

    public function test_command_runs_default_scanners_successfully(): void
    {
        $user = $this->createUser();
        $target = $this->createTarget($user);
        $session = $this->createSession($user, $target);

        $service = $this->mock(LabSecurityTestService::class);

        $service->shouldReceive('execute')
            ->times(3)
            ->andReturn(
                $this->successfulResult(1),
                $this->successfulResult(0),
                $this->successfulResult(2)
            );

        $this->artisan('chainshield:run-security-tests', [
            'session_id' => $session->id,
        ])
            ->expectsOutput('Running scanner: sqli')
            ->expectsOutput('Running scanner: xss')
            ->expectsOutput('Running scanner: brute_force')
            ->expectsOutput('Automated security tests completed.')
            ->assertSuccessful();
    }

    public function test_command_runs_idor_when_configuration_exists(): void
    {
        $user = $this->createUser();
        $target = $this->createTarget($user);

        $session = $this->createSession(
            $user,
            $target,
            'running',
            [
                'scanners' => [
                    'idor' => [
                        'resource_path' => '/api/profile/1',
                        'owner_token' => 'owner-test-token',
                        'comparison_token' => 'comparison-test-token',
                    ],
                ],
            ]
        );

        $service = $this->mock(LabSecurityTestService::class);

        $service->shouldReceive('execute')
            ->times(4)
            ->andReturn(
                $this->successfulResult(),
                $this->successfulResult(),
                $this->successfulResult(),
                $this->successfulResult()
            );

        $this->artisan('chainshield:run-security-tests', [
            'session_id' => $session->id,
        ])
            ->expectsOutput('Running scanner: idor')
            ->assertSuccessful();
    }

    public function test_command_continues_when_one_scanner_fails(): void
    {
        $user = $this->createUser();
        $target = $this->createTarget($user);
        $session = $this->createSession($user, $target);

        $service = $this->mock(LabSecurityTestService::class);

        $service->shouldReceive('execute')
            ->times(3)
            ->andReturn(
                $this->successfulResult(),
                fn () => throw new \RuntimeException('Simulated scanner failure'),
                $this->successfulResult()
            );

        $this->artisan('chainshield:run-security-tests', [
            'session_id' => $session->id,
        ])->assertFailed();
    }
}
