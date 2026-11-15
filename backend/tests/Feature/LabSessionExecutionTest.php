<?php

namespace Tests\Feature;

use App\Models\LabSession;
use App\Models\PentestTarget;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\Security\PythonSecurityRunnerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LabSessionExecutionTest extends TestCase
{
    use RefreshDatabase;

    private function createAuthorizedUser(): User
    {
        $user = User::create([
            'name' => 'Scanner Tester',
            'email' => 'scanner-test@example.com',
            'password' => 'password',
        ]);

        $role = Role::create([
            'name' => 'Penetration Tester',
            'slug' => 'penetration-tester',
        ]);

        $permission = Permission::create([
            'name' => 'Execute Lab Scanner',
            'slug' => 'lab.execute',
        ]);

        $role->permissions()->attach($permission->id);
        $user->roles()->attach($role->id);

        return $user;
    }

    private function createTarget(
        User $user,
        string $status = 'approved'
    ): PentestTarget {
        return PentestTarget::create([
            'user_id' => $user->id,
            'name' => 'Local Test Application',
            'target_url' => 'http://127.0.0.1:8000',
            'target_type' => 'web_application',
            'authorization_status' => $status,
        ]);
    }

    private function createSession(
        User $user,
        PentestTarget $target,
        string $status = 'running'
    ): LabSession {
        return LabSession::create([
            'user_id' => $user->id,
            'pentest_target_id' => $target->id,
            'name' => 'Scanner Execution Test',
            'status' => $status,
            'started_at' => now(),
        ]);
    }

    public function test_user_without_execute_permission_is_rejected(): void
    {
        $user = User::create([
            'name' => 'Unauthorized User',
            'email' => 'unauthorized@example.com',
            'password' => 'password',
        ]);

        $role = Role::create([
            'name' => 'Regular User',
            'slug' => 'regular-user',
        ]);

        $user->roles()->attach($role->id);

        $runner = $this->mock(PythonSecurityRunnerService::class);
        $runner->shouldNotReceive('execute');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/lab/sessions/1/execute', [
                'scanner_type' => 'sqli',
            ]);

        $response->assertForbidden();
    }

    public function test_user_cannot_execute_another_users_session(): void
    {
        $user = $this->createAuthorizedUser();

        $otherUser = User::create([
            'name' => 'Other User',
            'email' => 'other@example.com',
            'password' => 'password',
        ]);

        $target = $this->createTarget($otherUser);
        $session = $this->createSession($otherUser, $target);

        $runner = $this->mock(PythonSecurityRunnerService::class);
        $runner->shouldNotReceive('execute');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(
                "/api/v1/lab/sessions/{$session->id}/execute",
                ['scanner_type' => 'sqli']
            );

        $response->assertNotFound();
    }

    public function test_scanner_requires_running_session(): void
    {
        $user = $this->createAuthorizedUser();
        $target = $this->createTarget($user);
        $session = $this->createSession($user, $target, 'pending');

        $runner = $this->mock(PythonSecurityRunnerService::class);
        $runner->shouldNotReceive('execute');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(
                "/api/v1/lab/sessions/{$session->id}/execute",
                ['scanner_type' => 'sqli']
            );

        $response->assertStatus(409);
    }

    public function test_scanner_rejects_unapproved_target(): void
    {
        $user = $this->createAuthorizedUser();
        $target = $this->createTarget($user, 'pending');
        $session = $this->createSession($user, $target);

        $runner = $this->mock(PythonSecurityRunnerService::class);
        $runner->shouldNotReceive('execute');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(
                "/api/v1/lab/sessions/{$session->id}/execute",
                ['scanner_type' => 'sqli']
            );

        $response->assertStatus(422);
    }

    public function test_idor_scanner_requires_valid_distinct_tokens(): void
    {
        $user = $this->createAuthorizedUser();
        $target = $this->createTarget($user);
        $session = $this->createSession($user, $target);

        $runner = $this->mock(PythonSecurityRunnerService::class);
        $runner->shouldNotReceive('execute');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(
                "/api/v1/lab/sessions/{$session->id}/execute",
                [
                    'scanner_type' => 'idor',
                    'options' => [
                        'resource_path' => '/api/profile/1',
                        'owner_token' => 'same-test-token',
                        'comparison_token' => 'same-test-token',
                    ],
                ]
            );

        $response->assertStatus(422);
    }

    public function test_scanner_rejects_unknown_options(): void
{
    $user = $this->createAuthorizedUser();
    $target = $this->createTarget($user);
    $session = $this->createSession($user, $target);

    $runner = $this->mock(PythonSecurityRunnerService::class);
    $runner->shouldNotReceive('execute');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson(
            "/api/v1/lab/sessions/{$session->id}/execute",
            [
                'scanner_type' => 'sqli',
                'options' => [
                    'unexpected_option' => 'test-value',
                ],
            ]
        );

    $response->assertUnprocessable()
        ->assertJsonValidationErrors([
            'options.unexpected_option',
        ]);
}


public function test_scan_result_is_rejected_when_session_target_changes_during_execution(): void
{
    $user = $this->createAuthorizedUser();

    $originalTarget = $this->createTarget($user);
    $replacementTarget = $this->createTarget($user);

    $session = $this->createSession($user, $originalTarget);

    $report = [
        'target_url' => 'http://127.0.0.1:8000',
        'scan_type' => 'sqli',
        'started_at' => now()->subSeconds(5)->toISOString(),
        'completed_at' => now()->toISOString(),
        'total_findings' => 0,
        'findings' => [],
        'errors' => [],
    ];

    $runner = $this->mock(PythonSecurityRunnerService::class);

    $runner->shouldReceive('execute')
        ->once()
        ->with('sqli', 'http://127.0.0.1:8000', [])
        ->andReturnUsing(function () use ($session, $replacementTarget, $report) {
            // Simulasikan perubahan target ketika scanner sedang berjalan.
            LabSession::whereKey($session->id)->update([
                'pentest_target_id' => $replacementTarget->id,
            ]);

            return $report;
        });

    $response = $this->actingAs($user, 'sanctum')
        ->postJson(
            "/api/v1/lab/sessions/{$session->id}/execute",
            ['scanner_type' => 'sqli']
        );

    $response->assertStatus(502);

    $this->assertDatabaseHas('lab_sessions', [
        'id' => $session->id,
        'pentest_target_id' => $replacementTarget->id,
    ]);

    $this->assertDatabaseMissing('security_findings', [
        'lab_session_id' => $session->id,
    ]);

    $this->assertDatabaseMissing('audit_logs', [
        'action' => 'lab.session.scan_executed',
        'entity_type' => 'lab_session',
        'entity_id' => (string) $session->id,
    ]);
}

    public function test_successful_scan_saves_findings_and_audit_log(): void
    {
        $user = $this->createAuthorizedUser();
        $target = $this->createTarget($user);
        $session = $this->createSession($user, $target);

        $startedAt = now()->subSeconds(5)->toISOString();
        $completedAt = now()->toISOString();

        $report = [
            'target_url' => 'http://127.0.0.1:8000',
            'scan_type' => 'sqli',
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
            'total_findings' => 1,
            'findings' => [
                [
                    'title' => 'Potential Database Error Disclosure',
                    'vulnerability_type' => 'SQL Injection',
                    'severity' => 'medium',
                    'description' => 'Simulated test finding.',
                    'affected_endpoint' => 'http://127.0.0.1:8000',
                    'evidence' => [
                        'detection_method' => 'test_mock',
                    ],
                    'recommendation' => 'Use parameterized queries.',
                    'cvss_score' => 5.3,
                ],
            ],
            'errors' => [],
        ];

        $runner = $this->mock(PythonSecurityRunnerService::class);

        $runner->shouldReceive('execute')
            ->once()
            ->with(
                'sqli',
                'http://127.0.0.1:8000',
                []
            )
            ->andReturn($report);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(
                "/api/v1/lab/sessions/{$session->id}/execute",
                ['scanner_type' => 'sqli']
            );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_findings', 1);

        $this->assertDatabaseHas('security_findings', [
            'lab_session_id' => $session->id,
            'title' => 'Potential Database Error Disclosure',
            'vulnerability_type' => 'SQL Injection',
            'status' => 'open',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'lab.session.scan_executed',
            'entity_type' => 'lab_session',
            'entity_id' => (string) $session->id,
        ]);

        $this->assertDatabaseHas('lab_sessions', [
            'id' => $session->id,
            'status' => 'running',
        ]);
    }
}
