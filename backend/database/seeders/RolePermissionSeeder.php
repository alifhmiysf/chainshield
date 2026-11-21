<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // 1. CREATE ROLES
        // ==========================================

        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Memiliki seluruh akses pada sistem ChainShield.',
            ],
            [
                'name' => 'Security Analyst',
                'slug' => 'security-analyst',
                'description' => 'Memantau event keamanan dan menangani alert.',
            ],
            [
                'name' => 'Penetration Tester',
                'slug' => 'penetration-tester',
                'description' => 'Menjalankan pengujian keamanan pada lab terkontrol.',
            ],
            [
                'name' => 'Auditor',
                'slug' => 'auditor',
                'description' => 'Memeriksa audit log dan bukti integritas blockchain.',
            ],
            [
                'name' => 'User',
                'slug' => 'user',
                'description' => 'Pengguna biasa dengan akses terbatas.',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['slug' => $role['slug']],
                $role
            );
        }


        // ==========================================
        // 2. CREATE PERMISSIONS
        // ==========================================

        $permissions = [
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view'],

            ['name' => 'View Security Events', 'slug' => 'security-events.view'],

            ['name' => 'Manage Security Alerts', 'slug' => 'security-alerts.manage'],

            ['name' => 'View Lab', 'slug' => 'lab.view'],

            ['name' => 'Manage Lab Sessions', 'slug' => 'lab.sessions.manage'],

            ['name' => 'Approve Pentest Targets', 'slug' => 'lab.targets.approve'],

            ['name' => 'Execute Lab Scenarios', 'slug' => 'lab.execute'],

            ['name' => 'View Audit Logs', 'slug' => 'audit-logs.view'],

            ['name' => 'Verify Audit Integrity', 'slug' => 'audit.verify'],

            ['name' => 'View Blockchain Records', 'slug' => 'blockchain.view'],
            ['name' => 'Anchor Audit Batches', 'slug' => 'blockchain.anchor'],
            ['name' => 'View Reports', 'slug' => 'reports.view'],

            ['name' => 'Manage Users', 'slug' => 'users.manage'],

            ['name' => 'Manage Roles', 'slug' => 'roles.manage'],

            ['name' => 'Manage Permissions', 'slug' => 'permissions.manage'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }


        // ==========================================
        // 3. ASSIGN PERMISSIONS TO ROLES
        // ==========================================

        $rolePermissions = [

            // Super Admin mendapatkan seluruh permission.
            'super-admin' => '*',

            // Security Analyst.
            'security-analyst' => [
                'dashboard.view',
                'security-events.view',
                'security-alerts.manage',
                'audit-logs.view',
                'reports.view',
            ],

            // Penetration Tester.
            'penetration-tester' => [
                'dashboard.view',
                'lab.view',
                'lab.sessions.manage',
                'lab.execute',
                'reports.view',
            ],

            // Auditor.
            'auditor' => [
                'dashboard.view',
                'audit-logs.view',
                'audit.verify',
                'blockchain.view',
                'reports.view',
            ],

            // User biasa.
            'user' => [
                'dashboard.view',
            ],
        ];

        foreach ($rolePermissions as $roleSlug => $permissionSlugs) {

            $role = Role::where('slug', $roleSlug)->firstOrFail();

            if ($permissionSlugs === '*') {

                $permissionIds = Permission::pluck('id')->all();

            } else {

                $permissionIds = Permission::whereIn(
                    'slug',
                    $permissionSlugs
                )->pluck('id')->all();

            }

            $role->permissions()->sync($permissionIds);
        }


        // ==========================================
        // 4. ASSIGN SUPER ADMIN TO INITIAL ACCOUNT
        // ==========================================

        $admin = User::where(
            'email',
            'admin@chainshield.local'
        )->first();

        if ($admin) {

            $superAdminRole = Role::where(
                'slug',
                'super-admin'
            )->firstOrFail();

            $admin->roles()->syncWithoutDetaching([
                $superAdminRole->id,
            ]);

            $this->command->info(
                'Super Admin role assigned to admin@chainshield.local'
            );

        } else {

            $this->command->warn(
                'Initial admin account was not found. Super Admin role was not assigned.'
            );

        }


        // ==========================================
        // 5. COMPLETION MESSAGE
        // ==========================================

        $this->command->info(
            'ChainShield roles and permissions seeded successfully.'
        );
    }
}
