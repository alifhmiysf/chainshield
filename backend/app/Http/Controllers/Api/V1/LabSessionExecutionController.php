<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LabSession;
use App\Models\PentestTarget;
use App\Services\Security\LabSecurityTestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Throwable;

class LabSessionExecutionController extends Controller
{
    /**
     * Execute a security scanner on an approved lab session.
     *
     * Scanner execution and finding persistence are handled
     * by LabSecurityTestService, shared with the Artisan command.
     */
    public function execute(
        Request $request,
        int $id,
        LabSecurityTestService $securityTest
    ): JsonResponse {
        // Validate incoming request.
        $validated = $request->validate([
            'scanner_type' => [
                'required',
                'string',
                Rule::in([
                    'sqli',
                    'xss',
                    'idor',
                    'brute_force',
                ]),
            ],
            'options' => [
                'sometimes',
                'array',
            ],
        ]);

        $scannerType = $validated['scanner_type'];
        $options = $validated['options'] ?? [];
	// Reject options that are not supported by the selected scanner.
$allowedOptions = [
    'sqli' => [],
    'xss' => [],
    'brute_force' => [],
    'idor' => [
        'resource_path',
        'owner_token',
        'comparison_token',
    ],
];

$unknownOptions = array_diff(
    array_keys($options),
    $allowedOptions[$scannerType]
);

if ($unknownOptions !== []) {
    $errors = [];

    foreach ($unknownOptions as $option) {
        $errors["options.{$option}"][] =
            'Parameter tidak dikenal untuk jenis scanner ini.';
    }

    return response()->json([
        'message' => 'The given data was invalid.',
        'errors' => $errors,
    ], 422);
}

        // IDOR configuration must contain distinct authorization tokens.
        if ($scannerType === 'idor') {
            $optionValidator = validator($options, [
                'resource_path' => [
                    'required',
                    'string',
                    'max:2048',
                    'regex:/^\/(?!\/)/',
                ],
                'owner_token' => [
                    'required',
                    'string',
                    'min:1',
                    'max:4096',
                ],
                'comparison_token' => [
                    'required',
                    'string',
                    'min:1',
                    'max:4096',
                    'different:owner_token',
                ],
            ]);

            if ($optionValidator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Konfigurasi IDOR tidak valid.',
                    'errors' => $optionValidator->errors(),
                ], 422);
            }
        }

        $actor = $request->user();

        // Only the session owner can execute its scanners.
        $session = LabSession::query()
            ->where('user_id', $actor->id)
            ->findOrFail($id);

        if ($session->status !== 'running') {
            return response()->json([
                'success' => false,
                'message' => 'Scanner hanya dapat dijalankan pada sesi berstatus running.',
            ], 409);
        }

        // Target must belong to the same user and be approved.
        $target = PentestTarget::query()
            ->whereKey($session->pentest_target_id)
            ->where('user_id', $actor->id)
            ->where('authorization_status', 'approved')
            ->first();

        if (!$target) {
            return response()->json([
                'success' => false,
                'message' => 'Target tidak ditemukan atau tidak lagi disetujui.',
            ], 422);
        }

        // Validate scanner timeout configuration.
        $timeout = (int) config('chainshield.timeout', 120);

        if ($timeout < 1 || $timeout > 600) {
            return response()->json([
                'success' => false,
                'message' => 'Konfigurasi timeout scanner tidak valid.',
            ], 500);
        }

        // Use the same lock key as the Artisan command.
        $lock = Cache::lock(
            "chainshield:lab-session:{$session->id}:execute",
            $timeout + 30
        );

        if (!$lock->get()) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi ini sedang menjalankan scanner lain.',
            ], 409);
        }

        try {
            // Shared service handles runner execution, report validation,
            // finding persistence, and audit logging.
            $result = $securityTest->execute(
                session: $session,
                scannerType: $scannerType,
                options: $options
            );

            return response()->json([
                'success' => true,
                'message' => 'Security scanner berhasil dijalankan.',
                'data' => $result,
            ]);

        } catch (Throwable $error) {
            report($error);

            return response()->json([
                'success' => false,
                'message' => 'Eksekusi scanner gagal. Periksa konfigurasi runner dan log aplikasi.',
            ], 502);

        } finally {
            $lock->release();
        }
    }
}
