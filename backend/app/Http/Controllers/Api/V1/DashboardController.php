<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditBatch;
use App\Models\AuditLog;
use App\Models\BlockchainTransaction;
use App\Models\LabSession;
use App\Models\SecurityAlert;
use App\Models\SecurityEvent;
use App\Models\SecurityFinding;
use App\Services\Monitoring\SystemIntegrityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(
        Request $request,
        SystemIntegrityService $systemIntegrityService
    ): JsonResponse {
        $user = $request->user();

        $hasPermission = function (string $permission) use ($user): bool {
            if ($user->hasRole('super-admin')) {
                return true;
            }

            return $user->roles()
                ->whereHas('permissions', function ($query) use ($permission) {
                    $query->where('slug', $permission);
                })
                ->exists();
        };

        $stats = [];

        // System integrity monitoring
        // Available independently from audit log permissions.
        $stats['system_integrity'] = $systemIntegrityService->check();

        // Audit statistics
        if ($hasPermission('audit-logs.view')) {
            $stats['audit_logs'] = [
                'total' => AuditLog::count(),
            ];

            $stats['recent_activities'] = AuditLog::with('actor:id,name')
                ->latest('sequence')
                ->limit(5)
                ->get([
                    'id',
                    'sequence',
                    'actor_id',
                    'action',
                    'entity_type',
                    'entity_id',
                    'created_at',
                ]);
        }

        // Blockchain statistics
        if ($hasPermission('blockchain.view')) {
            $stats['blockchain'] = [
                'total_batches' => AuditBatch::count(),
                'anchored_batches' => AuditBatch::where('status', 'anchored')->count(),
                'confirmed_transactions' => BlockchainTransaction::where('status', 'confirmed')->count(),
                'failed_transactions' => BlockchainTransaction::where('status', 'failed')->count(),
            ];
        }

        // Security event statistics
        if ($hasPermission('security-events.view')) {
            $stats['security_events'] = [
                'total' => SecurityEvent::count(),
                'critical' => SecurityEvent::where('severity', 'critical')->count(),
                'high' => SecurityEvent::where('severity', 'high')->count(),
                'medium' => SecurityEvent::where('severity', 'medium')->count(),
                'low' => SecurityEvent::where('severity', 'low')->count(),
                'info' => SecurityEvent::where('severity', 'info')->count(),
            ];

            $stats['recent_security_events'] = SecurityEvent::latest('occurred_at')
                ->limit(5)
                ->get([
                    'id',
                    'event_type',
                    'severity',
                    'description',
                    'occurred_at',
                ]);
        }

        // Security alert statistics
        if ($hasPermission('security-alerts.manage')) {
            $stats['security_alerts'] = [
                'total' => SecurityAlert::count(),
                'open' => SecurityAlert::where('status', 'open')->count(),
                'investigating' => SecurityAlert::where('status', 'investigating')->count(),
                'resolved' => SecurityAlert::where('status', 'resolved')->count(),
                'false_positive' => SecurityAlert::where('status', 'false_positive')->count(),
            ];
        }

        // Lab statistics
        if ($hasPermission('lab.view')) {
            $stats['lab_sessions'] = [
                'total' => LabSession::count(),
                'pending' => LabSession::where('status', 'pending')->count(),
                'running' => LabSession::where('status', 'running')->count(),
                'completed' => LabSession::where('status', 'completed')->count(),
                'cancelled' => LabSession::where('status', 'cancelled')->count(),
            ];

            $stats['security_findings'] = [
                'total' => SecurityFinding::count(),
                'open' => SecurityFinding::where('status', 'open')->count(),
                'in_progress' => SecurityFinding::where('status', 'in_progress')->count(),
                'resolved' => SecurityFinding::where('status', 'resolved')->count(),
                'critical' => SecurityFinding::where('severity', 'critical')->count(),
                'high' => SecurityFinding::where('severity', 'high')->count(),
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Dashboard data retrieved successfully.',
            'data' => [
                'stats' => $stats,
                'generated_at' => now()->toISOString(),
            ],
        ]);
    }
}
