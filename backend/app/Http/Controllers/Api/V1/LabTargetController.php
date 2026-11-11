<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PentestTarget;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LabTargetController extends Controller
{
    /**
     * Menampilkan daftar target milik user yang sedang login.
     */
    public function index(Request $request): JsonResponse
    {
        $targets = PentestTarget::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Daftar target berhasil diambil.',
            'data' => $targets,
        ]);
    }

    /**
     * Mendaftarkan target pentest baru.
     */
    public function store(
        Request $request,
        AuditLogService $auditLog
    ): JsonResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'target_url' => ['required', 'url', 'max:2048'],
            'target_type' => [
                'nullable',
                'string',
                'in:web_application,api,network',
                'max:50',
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'authorization_proof' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        $actor = $request->user();

        $target = DB::transaction(function () use (
            $validated,
            $actor,
            $auditLog
        ) {
            $target = PentestTarget::create([
                'user_id' => $actor->id,
                'name' => $validated['name'],
                'target_url' => $validated['target_url'],
                'target_type' => $validated['target_type'] ?? 'web_application',
                'description' => $validated['description'] ?? null,
                'authorization_proof' => $validated['authorization_proof'],
                'authorization_status' => 'pending',
            ]);

            $auditLog->record(
                action: 'lab.target.registered',
                payload: [
                    'target_id' => $target->id,
                    'name' => $target->name,
                    'target_url' => $target->target_url,
                    'target_type' => $target->target_type,
                    'owner_user_id' => $target->user_id,
                    'authorization_status' => $target->authorization_status,
                ],
                actor: $actor,
                entityType: 'pentest_target',
                entityId: (string) $target->id
            );

            return $target;
        });

        return response()->json([
            'success' => true,
            'message' => 'Target berhasil didaftarkan dan menunggu persetujuan.',
            'data' => $target,
        ], 201);
    }

    /**
     * Menampilkan detail target milik user yang sedang login.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $target = PentestTarget::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail target berhasil diambil.',
            'data' => $target,
        ]);
    }

    /**
     * Menampilkan antrean target yang menunggu persetujuan.
     */
    public function pending(): JsonResponse
    {
        $targets = PentestTarget::query()
            ->with('user:id,name,email')
            ->where('authorization_status', 'pending')
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Daftar target yang menunggu persetujuan berhasil diambil.',
            'data' => $targets,
        ]);
    }

    /**
     * Menyetujui target pentest.
     */
    public function approve(
        Request $request,
        int $id,
        AuditLogService $auditLog
    ): JsonResponse {
        $result = DB::transaction(function () use (
            $request,
            $id,
            $auditLog
        ) {
            $actor = $request->user();

            $target = PentestTarget::query()
                ->lockForUpdate()
                ->findOrFail($id);

            // Mencegah pemilik target menyetujui targetnya sendiri.
            if ($target->user_id === $actor->id) {
                return [
                    'status' => 403,
                    'success' => false,
                    'message' => 'Anda tidak dapat menyetujui target yang Anda daftarkan sendiri.',
                ];
            }

            // Hanya target pending yang dapat disetujui.
            if ($target->authorization_status !== 'pending') {
                return [
                    'status' => 409,
                    'success' => false,
                    'message' => 'Target tidak dapat disetujui karena statusnya bukan pending.',
                ];
            }

            // Pastikan bukti otorisasi tersedia.
            if (empty($target->authorization_proof)) {
                return [
                    'status' => 422,
                    'success' => false,
                    'message' => 'Target tidak memiliki bukti otorisasi.',
                ];
            }

            $target->update([
                'authorization_status' => 'approved',
                'approved_by' => $actor->id,
                'authorized_at' => now(),
            ]);

            $auditLog->record(
                action: 'lab.target.approved',
                payload: [
                    'target_id' => $target->id,
                    'name' => $target->name,
                    'target_url' => $target->target_url,
                    'target_type' => $target->target_type,
                    'owner_user_id' => $target->user_id,
                    'authorization_status' => 'approved',
                    'reviewed_by' => $actor->id,
                ],
                actor: $actor,
                entityType: 'pentest_target',
                entityId: (string) $target->id
            );

            return [
                'status' => 200,
                'success' => true,
                'message' => 'Target berhasil disetujui.',
                'data' => $target->fresh(),
            ];
        });

        return response()->json($result, $result['status']);
    }

    /**
     * Menolak target pentest.
     */
    public function reject(
        Request $request,
        int $id,
        AuditLogService $auditLog
    ): JsonResponse {
        $result = DB::transaction(function () use (
            $request,
            $id,
            $auditLog
        ) {
            $actor = $request->user();

            $target = PentestTarget::query()
                ->lockForUpdate()
                ->findOrFail($id);

            // Mencegah pemilik target menolak targetnya sendiri.
            if ($target->user_id === $actor->id) {
                return [
                    'status' => 403,
                    'success' => false,
                    'message' => 'Anda tidak dapat menolak target yang Anda daftarkan sendiri.',
                ];
            }

            // Hanya target pending yang dapat ditolak.
            if ($target->authorization_status !== 'pending') {
                return [
                    'status' => 409,
                    'success' => false,
                    'message' => 'Target tidak dapat ditolak karena statusnya bukan pending.',
                ];
            }

            $target->update([
                'authorization_status' => 'rejected',
                'approved_by' => $actor->id,
                'authorized_at' => null,
            ]);

            $auditLog->record(
                action: 'lab.target.rejected',
                payload: [
                    'target_id' => $target->id,
                    'name' => $target->name,
                    'target_url' => $target->target_url,
                    'target_type' => $target->target_type,
                    'owner_user_id' => $target->user_id,
                    'authorization_status' => 'rejected',
                    'reviewed_by' => $actor->id,
                ],
                actor: $actor,
                entityType: 'pentest_target',
                entityId: (string) $target->id
            );

            return [
                'status' => 200,
                'success' => true,
                'message' => 'Target berhasil ditolak.',
                'data' => $target->fresh(),
            ];
        });

        return response()->json($result, $result['status']);
    }
}
