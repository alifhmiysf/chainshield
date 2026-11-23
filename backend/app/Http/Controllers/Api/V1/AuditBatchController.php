<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditBatch;
use App\Services\Audit\AuditBatchService;
use Illuminate\Http\Request;
use Throwable;

class AuditBatchController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                'string',
                'in:pending,anchored,failed',
            ],
            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:50',
            ],
        ]);

        $batches = AuditBatch::query()
            ->with('blockchainTransactions')
            ->when(
                isset($validated['status']),
                fn ($query) => $query->where(
                    'status',
                    $validated['status']
                )
            )
            ->orderByDesc('batch_number')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'message' => 'Audit batches retrieved successfully.',
            'data' => $batches,
        ]);
    }

    public function show(AuditBatch $auditBatch)
    {
        $auditBatch->load('blockchainTransactions');

        return response()->json([
            'success' => true,
            'message' => 'Audit batch retrieved successfully.',
            'data' => $auditBatch,
        ]);
    }

    /**
     * Create a new batch from unbatched audit logs.
     */
    public function store(AuditBatchService $batchService)
    {
        try {
            $batch = $batchService->createBatch();

            if ($batch === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada audit log baru yang menunggu batch.',
                ], 409);
            }

            return response()->json([
                'success' => true,
                'message' => 'Audit batch berhasil dibuat.',
                'data' => $batch,
            ], 201);

        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat audit batch. Periksa log aplikasi.',
            ], 500);
        }
    }
}
