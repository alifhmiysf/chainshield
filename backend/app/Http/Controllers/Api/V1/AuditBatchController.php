<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditBatch;
use Illuminate\Http\Request;

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
        return response()->json([
            'success' => true,
            'message' => 'Audit batch retrieved successfully.',
            'data' => $auditBatch,
        ]);
    }
}
