<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithPermissions(
        array $permissions,
        string $roleSlug = 'dashboard-tester'
    ): User {
        $user = User::create([
            'name' => 'Dashboard Tester',
            'email' => $roleSlug . '@example.com',
            'password' => 'password',
        ]);

        $role = Role::create([
            'name' => 'Dashboard Tester',
            'slug' => $roleSlug,
        ]);

        foreach ($permissions as $slug) {
            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => ucfirst(str_replace('.', ' ', $slug))]
            );

            $role->permissions()->attach($permission->id);
        }

        $user->roles()->attach($role->id);

        return $user;
    }

    public function test_unauthenticated_user_cannot_access_dashboard(): void
    {
        $response = $this->getJson('/api/v1/dashboard');

        $response->assertUnauthorized();
    }

    public function test_user_without_dashboard_permission_is_rejected(): void
    {
        $user = $this->createUserWithPermissions(
            ['audit-logs.view']
        );

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard');

        $response->assertForbidden();
    }

    public function test_super_admin_can_access_all_dashboard_statistics(): void
    {
        $user = $this->createUserWithPermissions(
            [],
            'super-admin'
        );

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'stats' => [
                        'audit_logs' => [
                            'total',
                        ],
                        'recent_activities',
                        'blockchain' => [
                            'total_batches',
                            'anchored_batches',
                            'confirmed_transactions',
                            'failed_transactions',
                        ],
                        'security_events' => [
                            'total',
                            'critical',
                            'high',
                            'medium',
                            'low',
                        ],
                        'recent_security_events',
                        'security_alerts' => [
                            'total',
                            'open',
                            'investigating',
                            'resolved',
                            'false_positive',
                        ],
                        'lab_sessions' => [
                            'total',
                            'pending',
                            'running',
                            'completed',
                            'cancelled',
                        ],
                        'security_findings' => [
                            'total',
                            'open',
                            'in_progress',
                            'resolved',
                            'critical',
                            'high',
                        ],
                    ],
                    'generated_at',
                ],
            ]);
    }

    public function test_dashboard_only_returns_statistics_allowed_by_permissions(): void
    {
        $user = $this->createUserWithPermissions([
            'dashboard.view',
            'audit-logs.view',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'stats' => [
                        'audit_logs' => [
                            'total',
                        ],
                        'recent_activities',
                    ],
                ],
            ])
            ->assertJsonMissingPath('data.stats.blockchain')
            ->assertJsonMissingPath('data.stats.security_events')
            ->assertJsonMissingPath('data.stats.security_alerts')
            ->assertJsonMissingPath('data.stats.lab_sessions')
            ->assertJsonMissingPath('data.stats.security_findings');
    }

    public function test_user_with_only_dashboard_permission_receives_empty_statistics(): void
    {
        $user = $this->createUserWithPermissions([
            'dashboard.view',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.stats', []);
    }
}
