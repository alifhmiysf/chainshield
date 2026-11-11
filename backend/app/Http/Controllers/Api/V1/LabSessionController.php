<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LabSession;
use App\Models\PentestTarget;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LabSessionController extends Controller
{
    /**
     * Menampilkan daftar sesi milik pengguna yang login.
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = LabSession::query()
            ->with('target:id,name,target_url,target_type')
            ->withCount('findings')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Daftar sesi pentest berhasil diambil.',
            'data' => $sessions,
        ]);
    }

    /**
     * Membuat sesi pentest baru.
     */
    public function store(
        Request $request,
        AuditLogService $auditLog
    ): JsonResponse {
        $validated = $request->validate([
            'pentest_target_id' => [
                'required',
                'integer',
                'exists:pentest_targets,id',
            ],
            'name' => [
                'required',
                'string',
                'max:150',
            ],
            'configuration' => [
                'nullable',
                'array',
            ],
        ]);

        $actor = $request->user();

        $target = PentestTarget::query()
            ->where('id', $validated['pentest_target_id'])
            ->where('user_id', $actor->id)
            ->where('authorization_status', 'approved')
            ->first();

        if (!$target) {
            return response()->json([
                'success' => false,
                'message' => 'Target tidak ditemukan, bukan milik Anda, atau belum disetujui.',
            ], 422);
        }

        $session = DB::transaction(function () use (
            $validated,
            $actor,
            $target,
            $auditLog
        ) {
            $session = LabSession::create([
                'pentest_target_id' => $target->id,
                'user_id' => $actor->id,
                'name' => $validated['name'],
                'status' => 'pending',
                'configuration' => $validated['configuration'] ?? null,
            ]);

            $auditLog->record(
                action: 'lab.session.created',
                payload: [
                    'session_id' => $session->id,
                    'target_id' => $target->id,
                    'session_name' => $session->name,
                    'status' => 'pending',
                    'owner_user_id' => $actor->id,
                ],
                actor: $actor,
                entityType: 'lab_session',
                entityId: (string) $session->id
            );

            return $session;
        });

        return response()->json([
            'success' => true,
            'message' => 'Sesi pentest berhasil dibuat.',
            'data' => $session->load([
            'target:id,name,target_url,target_type,authorization_status',
            ]),
        ], 201);
    }

    /**
     * Menampilkan detail sesi milik pengguna yang login.
     */
    public function show(
        Request $request,
        int $id
    ): JsonResponse {
        $session = LabSession::query()
            ->with([
                'target:id,name,target_url,target_type,authorization_status',
                'findings',
            ])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail sesi pentest berhasil diambil.',
            'data' => $session,
        ]);
    }

    /**
     * Memulai sesi pentest.
     */
    public function start(
        Request $request,
        int $id,
        AuditLogService $auditLog
    ): JsonResponse {
        return $this->transition(
            request: $request,
            id: $id,
            auditLog: $auditLog,
            allowedStatuses: ['pending'],
            newStatus: 'running',
            action: 'lab.session.started',
            message: 'Sesi pentest berhasil dimulai.',
            extraAttributes: [
                'started_at' => now(),
            ]
        );
    }

    /**
     * Menyelesaikan sesi pentest.
     */
    public function complete(
        Request $request,
        int $id,
        AuditLogService $auditLog
    ): JsonResponse {
        $validated = $request->validate([
            'summary' => [
                'nullable',
                'string',
                'max:10000',
            ],
        ]);

        return $this->transition(
            request: $request,
            id: $id,
            auditLog: $auditLog,
            allowedStatuses: ['running'],
            newStatus: 'completed',
            action: 'lab.session.completed',
            message: 'Sesi pentest berhasil diselesaikan.',
            extraAttributes: [
                'completed_at' => now(),
                'summary' => $validated['summary'] ?? null,
            ]
        );
    }

    /**
     * Membatalkan sesi pentest.
     */
    public function cancel(
        Request $request,
        int $id,
        AuditLogService $auditLog
    ): JsonResponse {
        return $this->transition(
            request: $request,
            id: $id,
            auditLog: $auditLog,
            allowedStatuses: ['pending', 'running'],
            newStatus: 'cancelled',
            action: 'lab.session.cancelled',
            message: 'Sesi pentest berhasil dibatalkan.',
            extraAttributes: [
                'completed_at' => now(),
            ]
        );
    }

    /**
     * Menangani perubahan status sesi secara terpusat.
     */
    private function transition(
        Request $request,
        int $id,
        AuditLogService $auditLog,
        array $allowedStatuses,
        string $newStatus,
        string $action,
        string $message,
        array $extraAttributes = []
    ): JsonResponse {
        $result = DB::transaction(function () use (
            $request,
            $id,
            $auditLog,
            $allowedStatuses,
            $newStatus,
            $action,
            $message,
            $extraAttributes
        ) {
            $actor = $request->user();

            $session = LabSession::query()
                ->where('user_id', $actor->id)
                ->lockForUpdate()
                ->findOrFail($id);

            if (!in_array($session->status, $allowedStatuses, true)) {
                return [
                    'status' => 409,
                    'success' => false,
                    'message' => 'Sesi tidak dapat diubah karena status saat ini tidak sesuai.',
                ];
            }

            if ($newStatus === 'running') {
                $target = PentestTarget::query()
                    ->where('id', $session->pentest_target_id)
                    ->where('user_id', $actor->id)
                    ->where('authorization_status', 'approved')
                    ->first();

                if (!$target) {
                    return [
                        'status' => 422,
                        'success' => false,
                        'message' => 'Target tidak lagi memiliki persetujuan untuk pengujian.',
                    ];
                }
            }

            // Simpan status sebelum perubahan untuk kebutuhan audit.
            $previousStatus = $session->status;

            $session->update(array_merge(
                ['status' => $newStatus],
                $extraAttributes
            ));

            $auditLog->record(
                action: $action,
                payload: [
                    'session_id' => $session->id,
                    'target_id' => $session->pentest_target_id,
                    'session_name' => $session->name,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                    'actor_user_id' => $actor->id,
                ],
                actor: $actor,
                entityType: 'lab_session',
                entityId: (string) $session->id
            );

            return [
                'status' => 200,
                'success' => true,
                'message' => $message,
                'data' => $session->fresh([
                    'target:id,name,target_url,target_type,authorization_status',
                    'findings',
                ]),
            ];
        });

        return response()->json($result, $result['status']);
    }
}
