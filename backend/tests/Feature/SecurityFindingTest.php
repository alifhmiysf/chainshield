<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\LabSession;
use App\Models\PentestTarget;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SecurityFinding;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityFindingTest extends TestCase
{
    use RefreshDatabase;

    private function createAuthorizedUser(): User
    {
        $user = User::create([
            'name' => 'Finding Tester',
            'email' => 'finding-test@example.com',
            'password' => 'password',
        ]);

        $role = Role::create([
            'name' => 'Penetration Tester',
            'slug' => 'penetration-tester',
        ]);

        foreach (['lab.view', 'lab.sessions.manage'] as $slug) {
            $permission = Permission::create([
                'name' => $slug,
                'slug' => $slug,
            ]);

            $role->permissions()->attach($permission->id);
        }

        $user->roles()->attach($role->id);

        return $user;
    }

    private function createSession(User $user, string $status = 'running'): LabSession
    {
        $target = PentestTarget::create([
            'user_id' => $user->id,
            'name' => 'Finding Test Target',
            'target_url' => 'http://127.0.0.1:8000',
            'target_type' => 'web_application',
            'authorization_status' => 'approved',
        ]);

        return LabSession::create([
            'user_id' => $user->id,
            'pentest_target_id' => $target->id,
            'name' => 'Finding Management Test',
            'status' => $status,
            'started_at' => now(),
        ]);
    }

    private function createFinding(LabSession $session, string $status = 'open'): SecurityFinding
    {
        return SecurityFinding::create([
            'lab_session_id' => $session->id,
            'title' => 'SQL Injection Test',
            'vulnerability_type' => 'sqli',
            'severity' => 'high',
            'description' => 'Test finding description',
            'affected_endpoint' => '/api/test',
            'evidence' => ['parameter' => 'id'],
            'recommendation' => 'Use parameterized queries',
            'cvss_score' => 8.1,
            'status' => $status,
        ]);
    }

    public function test_user_can_create_finding_and_record_audit_log(): void
    {
        $user = $this->createAuthorizedUser();
        $session = $this->createSession($user);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/lab/sessions/{$session->id}/findings", [
                'title' => 'SQL Injection',
                'vulnerability_type' => 'sqli',
                'severity' => 'high',
                'description' => 'Potential SQL injection',
                'affected_endpoint' => '/api/users',
                'recommendation' => 'Use prepared statements',
                'cvss_score' => 8.1,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'open');

        $this->assertDatabaseHas('security_findings', [
            'lab_session_id' => $session->id,
            'title' => 'SQL Injection',
            'status' => 'open',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'lab.finding.created',
            'entity_type' => 'security_finding',
        ]);
    }

    public function test_user_can_update_remediation_notes_and_evidence(): void
    {
        $user = $this->createAuthorizedUser();
        $session = $this->createSession($user);
        $finding = $this->createFinding($session);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/lab/sessions/{$session->id}/findings/{$finding->id}", [
                'remediation_notes' => 'Fixed using parameterized queries',
                'remediation_evidence' => [
                    'commit' => 'abc123',
                    'test' => 'passed',
                ],
            ])
            ->assertOk();

        $this->assertDatabaseHas('security_findings', [
            'id' => $finding->id,
            'remediation_notes' => 'Fixed using parameterized queries',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'lab.finding.updated',
            'entity_id' => (string) $finding->id,
        ]);
    }

    public function test_user_can_change_finding_status_and_record_audit_log(): void
    {
        $user = $this->createAuthorizedUser();
        $session = $this->createSession($user);
        $finding = $this->createFinding($session);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/lab/sessions/{$session->id}/findings/{$finding->id}/status", [
                'status' => 'in_progress',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress');

        $this->assertDatabaseHas('security_findings', [
            'id' => $finding->id,
            'status' => 'in_progress',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'lab.finding.status_changed',
            'entity_id' => (string) $finding->id,
        ]);
    }

    public function test_resolved_finding_can_be_reopened(): void
    {
        $user = $this->createAuthorizedUser();
        $session = $this->createSession($user);
        $finding = $this->createFinding($session, 'resolved');

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/lab/sessions/{$session->id}/findings/{$finding->id}/status", [
                'status' => 'in_progress',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress');

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'lab.finding.status_changed',
            'entity_id' => (string) $finding->id,
        ]);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $user = $this->createAuthorizedUser();
        $session = $this->createSession($user);
        $finding = $this->createFinding($session);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/lab/sessions/{$session->id}/findings/{$finding->id}/status", [
                'status' => 'resolved',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('security_findings', [
            'id' => $finding->id,
            'status' => 'open',
        ]);
    }

    public function test_user_cannot_access_another_users_finding(): void
    {
        $owner = $this->createAuthorizedUser();
        $otherUser = User::create([
            'name' => 'Other User',
            'email' => 'other-finding@example.com',
            'password' => 'password',
        ]);

        $session = $this->createSession($owner);
        $finding = $this->createFinding($session);

        $this->actingAs($otherUser, 'sanctum')
            ->getJson("/api/v1/lab/sessions/{$session->id}/findings/{$finding->id}")
            ->assertForbidden();
    }

    public function test_completed_session_finding_cannot_be_modified(): void
    {
        $user = $this->createAuthorizedUser();
        $session = $this->createSession($user, 'completed');
        $finding = $this->createFinding($session);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/lab/sessions/{$session->id}/findings/{$finding->id}/status", [
                'status' => 'in_progress',
            ])
            ->assertStatus(409);

        $this->assertDatabaseHas('security_findings', [
            'id' => $finding->id,
            'status' => 'open',
        ]);
    }
}

