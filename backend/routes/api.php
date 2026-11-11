
<?php

// ==========================================
// IMPORT CONTROLLERS
// ==========================================

use App\Http\Controllers\Api\V1\AuditBatchController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BlockchainController;
use App\Http\Controllers\Api\V1\LabSessionController;
use App\Http\Controllers\Api\V1\LabSessionExecutionController;
use App\Http\Controllers\Api\V1\LabTargetController;
use App\Http\Controllers\Api\V1\SecurityAlertController;
use App\Http\Controllers\Api\V1\SecurityEventController;
use App\Http\Controllers\Api\V1\SecurityFindingController;
use Illuminate\Support\Facades\Route;
use Symfony\Component\Process\Process;


// ==========================================
// PUBLIC ROUTES
// ==========================================

Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'application' => 'ChainShield',
        'message' => 'ChainShield API is running.',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString(),
    ]);
});


// ==========================================
// API VERSION 1
// Prefix: /api/v1
// ==========================================

Route::prefix('v1')->group(function () {

    // ======================================
    // AUTHENTICATION - PUBLIC
    // ======================================

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);


    // ======================================
    // PROTECTED ROUTES
    // Requires: Sanctum Authentication
    // ======================================

    Route::middleware('auth:sanctum')->group(function () {

        // ==================================
        // AUTHENTICATED USER
        // ==================================

        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);


        // ==================================
        // TEMPORARY SEPOLIA DIAGNOSTICS
        // Permission: blockchain.view
        // ==================================

        Route::get('/diagnostics/sepolia-key', function () {

            $key = getenv('SEPOLIA_PRIVATE_KEY');

            return response()->json([
                'getenv_present' => is_string($key) && $key !== '',
                'getenv_format_valid' => is_string($key)
                    && preg_match('/^0x[a-fA-F0-9]{64}$/', $key) === 1,
                'env_present' => !empty($_ENV['SEPOLIA_PRIVATE_KEY']),
                'server_present' => !empty($_SERVER['SEPOLIA_PRIVATE_KEY']),
            ]);

        })->middleware('permission:blockchain.view');


        // ==================================
        // TEMPORARY NODE.JS PRECHECK
        // Permission: blockchain.view
        // Tidak mengirim transaksi.
        // ==================================

        Route::get('/diagnostics/node-key', function () {

            $nodeEnvironment = getenv();

            $privateKey = getenv('SEPOLIA_PRIVATE_KEY');

            if (!is_string($privateKey) || $privateKey === '') {
                return response()->json([
                    'process_successful' => false,
                    'error_output' => 'SEPOLIA_PRIVATE_KEY is unavailable.',
                ], 500);
            }

            $nodeEnvironment['SEPOLIA_PRIVATE_KEY'] = $privateKey;
            $nodeEnvironment['CHAINSHIELD_PRECHECK'] = '1';

            $blockchainPath = dirname(base_path())
                . DIRECTORY_SEPARATOR . 'blockchain';

            $scriptPath = $blockchainPath
                . DIRECTORY_SEPARATOR . 'scripts'
                . DIRECTORY_SEPARATOR . 'laravel-bridge'
                . DIRECTORY_SEPARATOR . 'anchor.mjs';

            if (!file_exists($scriptPath)) {
                return response()->json([
                    'process_successful' => false,
                    'error_output' => 'Blockchain bridge script not found.',
                ], 500);
            }

            $process = new Process(
                [
                    'node',
                    $scriptPath,
                    '3',
                    '60046320373b8bf7432bdb7555b5bd667b0ab9027a8b80d3a6ec86a5a72d0922',
                    '1',
                ],
                $blockchainPath,
                $nodeEnvironment
            );

            $process->setTimeout(120);
            $process->run();

            return response()->json([
                'process_successful' => $process->isSuccessful(),
                'output' => trim($process->getOutput()),
                'error_output' => trim($process->getErrorOutput()),
                'exit_code' => $process->getExitCode(),
            ]);

        })->middleware('permission:blockchain.view');


        // ==================================
        // BLOCKCHAIN AUDIT BATCHES
        // Permission: blockchain.view
        // ==================================

        Route::middleware('permission:blockchain.view')->group(function () {

            Route::get(
                '/blockchain/batches',
                [AuditBatchController::class, 'index']
            );

            Route::get(
                '/blockchain/batches/{auditBatch}',
                [AuditBatchController::class, 'show']
            );

            Route::get(
                '/blockchain/batches/{auditBatch}/verify',
                [BlockchainController::class, 'verify']
            );

        });


        // ==================================
        // BLOCKCHAIN ANCHORING
        // Permission: blockchain.anchor
        // ==================================

        Route::middleware('permission:blockchain.anchor')->group(function () {

            Route::post(
                '/blockchain/batches/{auditBatch}/anchor',
                [BlockchainController::class, 'anchor']
            );

        });


        // ==================================
        // SECURITY EVENTS
        // Permission: security-events.view
        // ==================================

        Route::middleware('permission:security-events.view')->group(function () {

            Route::get(
                '/security/events',
                [SecurityEventController::class, 'index']
            );

            Route::get(
                '/security/events/{securityEvent}',
                [SecurityEventController::class, 'show']
            );

        });


        // ==================================
        // SECURITY ALERTS
        // Permission: security-alerts.manage
        // ==================================

        Route::middleware('permission:security-alerts.manage')->group(function () {

            Route::get(
                '/security/alerts',
                [SecurityAlertController::class, 'index']
            );

            Route::get(
                '/security/alerts/{securityAlert}',
                [SecurityAlertController::class, 'show']
            );

            Route::patch(
                '/security/alerts/{securityAlert}',
                [SecurityAlertController::class, 'update']
            );

        });


        // ==================================
        // PENETRATION TESTING LAB
        // ==================================


        // ==================================
        // LAB TARGET APPROVAL
        // Permission: lab.targets.approve
        // ==================================

        Route::middleware('permission:lab.targets.approve')->group(function () {

            Route::get(
                '/lab/targets/pending',
                [LabTargetController::class, 'pending']
            );

            Route::patch(
                '/lab/targets/{id}/approve',
                [LabTargetController::class, 'approve']
            );

            Route::patch(
                '/lab/targets/{id}/reject',
                [LabTargetController::class, 'reject']
            );

        });


        // ==================================
        // LAB TARGET VIEW
        // Permission: lab.view
        // ==================================

        Route::middleware('permission:lab.view')->group(function () {

            Route::get(
                '/lab/targets',
                [LabTargetController::class, 'index']
            );

            Route::get(
                '/lab/targets/{id}',
                [LabTargetController::class, 'show']
            );

            Route::get('/lab/access-test', function () {
                return response()->json([
                    'success' => true,
                    'message' => 'You have permission to access the lab.',
                ]);
            });

        });


        // ==================================
        // LAB TARGET REGISTRATION
        // Permission: lab.sessions.manage
        // ==================================

        Route::middleware('permission:lab.sessions.manage')->group(function () {

            Route::post(
                '/lab/targets',
                [LabTargetController::class, 'store']
            );

        });


        // ==================================
        // LAB SESSION VIEW
        // Permission: lab.view
        // ==================================

        Route::middleware('permission:lab.view')->group(function () {

            Route::get(
                '/lab/sessions',
                [LabSessionController::class, 'index']
            );

            Route::get(
                '/lab/sessions/{id}',
                [LabSessionController::class, 'show']
            );

        });


        // ==================================
        // LAB SESSION MANAGEMENT
        // Permission: lab.sessions.manage
        // ==================================

        Route::middleware('permission:lab.sessions.manage')->group(function () {

            Route::post(
                '/lab/sessions',
                [LabSessionController::class, 'store']
            );

            Route::patch(
                '/lab/sessions/{id}/start',
                [LabSessionController::class, 'start']
            );

            Route::patch(
                '/lab/sessions/{id}/complete',
                [LabSessionController::class, 'complete']
            );

            Route::patch(
                '/lab/sessions/{id}/cancel',
                [LabSessionController::class, 'cancel']
            );

        });


        // ==================================
        // LAB SESSION SCANNER EXECUTION
        // Permission: lab.execute
        // ==================================

        Route::middleware('permission:lab.execute')->group(function () {

            Route::post(
                '/lab/sessions/{id}/execute',
                [LabSessionExecutionController::class, 'execute']
            );

        });

        // ==================================
        // SECURITY FINDING VIEW
        // Permission: lab.view
        // ==================================

        Route::middleware('permission:lab.view')->group(function () {

            Route::get(
                '/lab/sessions/{sessionId}/findings',
                [SecurityFindingController::class, 'index']
            );

            Route::get(
                '/lab/sessions/{sessionId}/findings/{findingId}',
                [SecurityFindingController::class, 'show']
            );

        });


        // ==================================
        // SECURITY FINDING MANAGEMENT
        // Permission: lab.sessions.manage
        // ==================================

        Route::middleware('permission:lab.sessions.manage')->group(function () {

            Route::post(
                '/lab/sessions/{sessionId}/findings',
                [SecurityFindingController::class, 'store']
            );

            Route::put(
                '/lab/sessions/{sessionId}/findings/{findingId}',
                [SecurityFindingController::class, 'update']
            );

            Route::patch(
                '/lab/sessions/{sessionId}/findings/{findingId}/status',
                [SecurityFindingController::class, 'updateStatus']
            );

            Route::delete(
                '/lab/sessions/{sessionId}/findings/{findingId}',
                [SecurityFindingController::class, 'destroy']
            );

        });


        // ==================================
        // AUDIT LOGS
        // Permission: audit-logs.view
        // ==================================

        Route::middleware('permission:audit-logs.view')->group(function () {

            Route::get(
                '/audit/logs',
                [AuditLogController::class, 'index']
            );

            Route::get(
                '/audit/logs/{auditLog}',
                [AuditLogController::class, 'show']
            );

        });


        // ==================================
        // AUDIT VERIFICATION
        // Permission: audit.verify
        // ==================================

        Route::middleware('permission:audit.verify')->group(function () {

            Route::get(
                '/audit/verify',
                [AuditLogController::class, 'verify']
            );

        });

    });

});
