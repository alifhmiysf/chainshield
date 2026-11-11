<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditBatch;
use App\Services\Blockchain\BlockchainService;
use App\Services\Blockchain\BlockchainVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class BlockchainController extends Controller
{
    /**
     * Anchor an audit batch to the blockchain.
     */
    public function anchor(
        AuditBatch $auditBatch,
        BlockchainService $blockchainService
    ): JsonResponse {
        if ($auditBatch->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending audit batches can be anchored.',
            ], 409);
        }

        $latestTransaction = $auditBatch->blockchainTransactions()
            ->latest('id')
            ->first();

        if (
            $latestTransaction
            && in_array(
                $latestTransaction->status,
                ['pending', 'confirmed'],
                true
            )
        ) {
            return response()->json([
                'success' => false,
                'message' => 'This batch already has a pending or confirmed transaction.',
            ], 409);
        }

        try {
            $result = $blockchainService->anchor($auditBatch);

            return response()->json([
                'success' => true,
                'message' => 'Audit batch successfully anchored to blockchain.',
                'data' => $result,
            ], 201);

        } catch (Throwable $e) {
            Log::error('Blockchain anchoring failed.', [
                'audit_batch_id' => $auditBatch->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Blockchain anchoring failed.',
            ], 502);
        }
    }

    /**
     * Verify audit batch integrity against the blockchain.
     */
    public function verify(
        AuditBatch $auditBatch,
        BlockchainVerificationService $verificationService
    ): JsonResponse {
        try {
            $result = $verificationService->verify($auditBatch);

            return response()->json([
                'success' => true,
                'message' => 'Audit batch successfully verified against the blockchain.',
                'data' => $result,
            ], 200);

        } catch (Throwable $e) {
            Log::error('Blockchain verification failed.', [
                'audit_batch_id' => $auditBatch->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Blockchain verification failed. Please check the audit batch integrity and blockchain connection.',
            ], 422);
        }
    }
}
