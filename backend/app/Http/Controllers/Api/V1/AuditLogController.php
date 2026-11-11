<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\Audit\AuditVerificationService;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'action' => ['sometimes', 'string', 'max:100'],
            'actor_id' => ['sometimes', 'integer', 'exists:users,id'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $logs = AuditLog::query()
            ->with('actor:id,name,email')
            ->when(
                isset($validated['action']),
                fn ($query) => $query->where(
                    'action',
                    $validated['action']
                )
            )
            ->when(
                isset($validated['actor_id']),
                fn ($query) => $query->where(
                    'actor_id',
                    $validated['actor_id']
                )
            )
            ->orderByDesc('sequence')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'message' => 'Audit logs retrieved successfully.',
            'data' => $logs,
        ]);
    }

    public function show(AuditLog $auditLog)
    {
        $auditLog->load('actor:id,name,email');

        return response()->json([
            'success' => true,
            'message' => 'Audit log retrieved successfully.',
            'data' => $auditLog,
        ]);
    }

    public function verify(AuditVerificationService $verifier)
    {
        $result = $verifier->verify();

        return response()->json([
            'success' => true,
            'message' => $result['valid']
                ? 'Audit log integrity verified successfully.'
                : 'Audit log integrity verification failed.',
            'data' => $result,
        ]);
    }
}
