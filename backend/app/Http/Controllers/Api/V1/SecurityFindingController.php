<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LabSession;
use App\Models\SecurityFinding;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SecurityFindingController extends Controller
{
    /**
     * Menampilkan seluruh temuan dalam sesi milik pengguna.
     */
    public function index(
        Request $request,
        int $sessionId
    ): JsonResponse {
        $session = LabSession::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($sessionId);

        $findings = $session->findings()
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Daftar security finding berhasil diambil.',
            'data' => $findings,
        ]);
    }

    /**
     * Membuat temuan kerentanan baru.
     */
    public function store(
        Request $request,
        int $sessionId,
        AuditLogService $auditLog
    ): JsonResponse {
        $session = LabSession::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'running')
            ->findOrFail($sessionId);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'vulnerability_type' => ['required', 'string', 'max:100'],
            'severity' => [
                'required',
                Rule::in(['critical', 'high', 'medium', 'low', 'info']),
            ],
            'description' => ['required', 'string'],
            'affected_endpoint' => ['nullable', 'string', 'max:2048'],
            'evidence' => ['nullable', 'array'],
            'recommendation' => ['nullable', 'string'],
            'cvss_score' => [
                'nullable',
                'numeric',
                'between:0,10',
                'decimal:0,1',
            ],
        ]);

        $finding = DB::transaction(function () use (
            $session,
            $validated,
            $request,
            $auditLog
        ) {
            $finding = $session->findings()->create(array_merge(
                $validated,
                ['status' => 'open']
            ));

            $auditLog->record(
                action: 'lab.finding.created',
                payload: [
                    'finding_id' => $finding->id,
                    'session_id' => $session->id,
                    'title' => $finding->title,
                    'vulnerability_type' => $finding->vulnerability_type,
                    'severity' => $finding->severity,
                    'cvss_score' => $finding->cvss_score,
                    'status' => $finding->status,
                ],
                actor: $request->user(),
                entityType: 'security_finding',
                entityId: (string) $finding->id
            );

            return $finding;
        });

        return response()->json([
            'success' => true,
            'message' => 'Security finding berhasil dibuat.',
            'data' => $finding,
        ], 201);
    }

    /**
     * Menampilkan detail satu temuan.
     */
    public function show(
        Request $request,
        int $sessionId,
        int $findingId
    ): JsonResponse {
        $finding = SecurityFinding::query()
            ->where('lab_session_id', $sessionId)
            ->whereHas('labSession', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->findOrFail($findingId);

        return response()->json([
            'success' => true,
            'message' => 'Detail security finding berhasil diambil.',
            'data' => $finding,
        ]);
    }

    /**
     * Memperbarui detail dan informasi remediation.
     */
    public function update(
        Request $request,
        int $sessionId,
        int $findingId,
        AuditLogService $auditLog
    ): JsonResponse {
        $finding = $this->findOwnedFinding(
            $request,
            $sessionId,
            $findingId
        );

        if (in_array(
            $finding->labSession->status,
            ['completed', 'cancelled'],
            true
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Temuan pada sesi yang sudah selesai atau dibatalkan tidak dapat diubah.',
            ], 409);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'vulnerability_type' => ['sometimes', 'required', 'string', 'max:100'],
            'severity' => [
                'sometimes',
                'required',
                Rule::in(['critical', 'high', 'medium', 'low', 'info']),
            ],
            'description' => ['sometimes', 'required', 'string'],
            'affected_endpoint' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'evidence' => ['sometimes', 'nullable', 'array'],
            'recommendation' => ['sometimes', 'nullable', 'string'],
            'cvss_score' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:0,10',
                'decimal:0,1',
            ],
            'remediation_notes' => ['sometimes', 'nullable', 'string'],
            'remediation_evidence' => ['sometimes', 'nullable', 'array'],
        ]);

        DB::transaction(function () use (
            $finding,
            $validated,
            $request,
            $auditLog
        ) {
            $previousValues = $finding->only(array_keys($validated));

            $finding->update($validated);

            $auditLog->record(
                action: 'lab.finding.updated',
                payload: [
                    'finding_id' => $finding->id,
                    'session_id' => $finding->lab_session_id,
                    'previous_values' => $previousValues,
                    'updated_fields' => array_keys($validated),
                ],
                actor: $request->user(),
                entityType: 'security_finding',
                entityId: (string) $finding->id
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Security finding berhasil diperbarui.',
            'data' => $finding->fresh(),
        ]);
    }

    /**
     * Mengubah status penanganan temuan.
     */
    public function updateStatus(
        Request $request,
        int $sessionId,
        int $findingId,
        AuditLogService $auditLog
    ): JsonResponse {
        $finding = $this->findOwnedFinding(
            $request,
            $sessionId,
            $findingId
        );

        if (in_array(
            $finding->labSession->status,
            ['completed', 'cancelled'],
            true
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Status temuan pada sesi yang sudah selesai atau dibatalkan tidak dapat diubah.',
            ], 409);
        }

        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in([
                    'open',
                    'in_progress',
                    'resolved',
                    'false_positive',
                ]),
            ],
        ]);

        $previousStatus = $finding->status;
        $newStatus = $validated['status'];

        if ($previousStatus === $newStatus) {
            return response()->json([
                'success' => true,
                'message' => 'Status security finding tidak mengalami perubahan.',
                'data' => $finding,
            ]);
        }

        $allowedTransitions = [
            'open' => ['in_progress', 'false_positive'],
            'in_progress' => [
                'open',
                'resolved',
                'false_positive',
            ],
            'resolved' => ['in_progress'],
            'false_positive' => ['open'],
        ];

        if (!in_array(
            $newStatus,
            $allowedTransitions[$previousStatus] ?? [],
            true
        )) {
            return response()->json([
                'success' => false,
                'message' => "Transisi status dari {$previousStatus} ke {$newStatus} tidak diizinkan.",
            ], 422);
        }

        DB::transaction(function () use (
            $finding,
            $previousStatus,
            $newStatus,
            $request,
            $auditLog
        ) {
            $finding->update([
                'status' => $newStatus,
            ]);

            $auditLog->record(
                action: 'lab.finding.status_changed',
                payload: [
                    'finding_id' => $finding->id,
                    'session_id' => $finding->lab_session_id,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                ],
                actor: $request->user(),
                entityType: 'security_finding',
                entityId: (string) $finding->id
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Status security finding berhasil diperbarui.',
            'data' => $finding->fresh(),
        ]);
    }

    /**
     * Menghapus temuan.
     */
    public function destroy(
        Request $request,
        int $sessionId,
        int $findingId,
        AuditLogService $auditLog
    ): JsonResponse {
        $finding = $this->findOwnedFinding(
            $request,
            $sessionId,
            $findingId
        );

        if (in_array(
            $finding->labSession->status,
            ['completed', 'cancelled'],
            true
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Temuan pada sesi yang sudah selesai atau dibatalkan tidak dapat dihapus.',
            ], 409);
        }

        DB::transaction(function () use (
            $finding,
            $request,
            $auditLog
        ) {
            $payload = [
                'finding_id' => $finding->id,
                'session_id' => $finding->lab_session_id,
                'title' => $finding->title,
                'vulnerability_type' => $finding->vulnerability_type,
                'severity' => $finding->severity,
            ];

            $findingId = $finding->id;

            $finding->delete();

            $auditLog->record(
                action: 'lab.finding.deleted',
                payload: $payload,
                actor: $request->user(),
                entityType: 'security_finding',
                entityId: (string) $findingId
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Security finding berhasil dihapus.',
        ]);
    }

    /**
     * Memastikan temuan berada pada sesi milik pengguna.
     */
    private function findOwnedFinding(
        Request $request,
        int $sessionId,
        int $findingId
    ): SecurityFinding {
        return SecurityFinding::query()
            ->with('labSession:id,user_id,status')
            ->where('lab_session_id', $sessionId)
            ->whereHas('labSession', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->findOrFail($findingId);
    }
}
