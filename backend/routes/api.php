<?php

// ==========================================
// IMPORT CONTROLLERS
// ==========================================

use App\Http\Controllers\Api\V1\AuditBatchController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BlockchainController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\LabSessionController;
use App\Http\Controllers\Api\V1\LabSessionExecutionController;
use App\Http\Controllers\Api\V1\LabTargetController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SecurityAlertController;
use App\Http\Controllers\Api\V1\SecurityEventController;
use App\Http\Controllers\Api\V1\SecurityFindingController;
use App\Http\Controllers\Api\V1\UserController;
use App\Models\Role;
use Illuminate\Support\Facades\Route;


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
        // DASHBOARD
        // Permission: dashboard.view
        // ==================================

        Route::middleware('permission:dashboard.view')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index']);
        });


        // ==================================
        // BLOCKCHAIN AUDIT BATCHES
        // Permission: blockchain.view
        // ==================================

        Route::middleware('permission:blockchain.view')->group(function () {
            Route::get('/blockchain/batches', [AuditBatchController::class, 'index']);
            Route::get('/blockchain/batches/{auditBatch}', [AuditBatchController::class, 'show']);
            Route::get('/blockchain/batches/{auditBatch}/verify', [BlockchainController::class, 'verify']);
        });


        // ==================================
        // BLOCKCHAIN ANCHORING
        // Permission: blockchain.anchor
        // ==================================

        Route::middleware('permission:blockchain.anchor')->group(function () {
    Route::post('/blockchain/batches', [AuditBatchController::class, 'store']);
    Route::post('/blockchain/batches/{auditBatch}/anchor', [BlockchainController::class, 'anchor']);
});


        // ==================================
        // SECURITY EVENTS
        // Permission: security-events.view
        // ==================================

        Route::middleware('permission:security-events.view')->group(function () {
            Route::get('/security/events', [SecurityEventController::class, 'index']);
            Route::get('/security/events/{securityEvent}', [SecurityEventController::class, 'show']);
        });


        // ==================================
        // SECURITY ALERTS
        // Permission: security-alerts.manage
        // ==================================

        Route::middleware('permission:security-alerts.manage')->group(function () {
            Route::get('/security/alerts', [SecurityAlertController::class, 'index']);
            Route::get('/security/alerts/{securityAlert}', [SecurityAlertController::class, 'show']);
            Route::patch('/security/alerts/{securityAlert}', [SecurityAlertController::class, 'update']);
        });


        // ==================================
        // LAB TARGET APPROVAL
        // Permission: lab.targets.approve
        // ==================================

        Route::middleware('permission:lab.targets.approve')->group(function () {
            Route::get('/lab/targets/pending', [LabTargetController::class, 'pending']);
            Route::patch('/lab/targets/{id}/approve', [LabTargetController::class, 'approve']);
            Route::patch('/lab/targets/{id}/reject', [LabTargetController::class, 'reject']);
        });


        // ==================================
        // LAB TARGET VIEW
        // Permission: lab.view
        // ==================================

        Route::middleware('permission:lab.view')->group(function () {
            Route::get('/lab/targets', [LabTargetController::class, 'index']);
            Route::get('/lab/targets/{id}', [LabTargetController::class, 'show']);

            Route::get('/lab/access-test', function () {
                return response()->json([
                    'success' => true,
                    'message' => 'You have permission to access the lab.',
                ]);
            });
        });


        // ======================================
        // LAB TARGET REGISTRATION
        // Permission: lab.sessions.manage
        // ======================================

        Route::middleware('permission:lab.sessions.manage')->group(function () {
            Route::post('/lab/targets', [LabTargetController::class, 'store']);
        });


        // ======================================
        // LAB SESSION VIEW
        // Permission: lab.view
        // ======================================

        Route::middleware('permission:lab.view')->group(function () {
            Route::get('/lab/sessions', [LabSessionController::class, 'index']);
            Route::get('/lab/sessions/{id}', [LabSessionController::class, 'show']);
        });


        // ======================================
        // LAB SESSION MANAGEMENT
        // Permission: lab.sessions.manage
        // ======================================

        Route::middleware('permission:lab.sessions.manage')->group(function () {
            Route::post('/lab/sessions', [LabSessionController::class, 'store']);
            Route::patch('/lab/sessions/{id}/start', [LabSessionController::class, 'start']);
            Route::patch('/lab/sessions/{id}/complete', [LabSessionController::class, 'complete']);
            Route::patch('/lab/sessions/{id}/cancel', [LabSessionController::class, 'cancel']);
        });


        // ======================================
        // LAB SESSION SCANNER EXECUTION
        // Permission: lab.execute
        // ======================================

        Route::middleware('permission:lab.execute')->group(function () {
            Route::post('/lab/sessions/{id}/execute', [LabSessionExecutionController::class, 'execute']);
        });


        // ======================================
        // SECURITY FINDING VIEW
        // Permission: lab.view
        // ======================================

        Route::middleware('permission:lab.view')->group(function () {
            Route::get('/lab/sessions/{sessionId}/findings', [SecurityFindingController::class, 'index']);
            Route::get('/lab/sessions/{sessionId}/findings/{findingId}', [SecurityFindingController::class, 'show']);
        });


        // ======================================
        // SECURITY FINDING MANAGEMENT
        // Permission: lab.sessions.manage
        // ======================================

        Route::middleware('permission:lab.sessions.manage')->group(function () {
            Route::post('/lab/sessions/{sessionId}/findings', [SecurityFindingController::class, 'store']);
            Route::put('/lab/sessions/{sessionId}/findings/{findingId}', [SecurityFindingController::class, 'update']);
            Route::patch('/lab/sessions/{sessionId}/findings/{findingId}/status', [SecurityFindingController::class, 'updateStatus']);
            Route::delete('/lab/sessions/{sessionId}/findings/{findingId}', [SecurityFindingController::class, 'destroy']);
        });


        // ======================================
        // AUDIT LOGS
        // Permission: audit-logs.view
        // ======================================

        Route::middleware('permission:audit-logs.view')->group(function () {
            Route::get('/audit/logs', [AuditLogController::class, 'index']);
            Route::get('/audit/logs/{auditLog}', [AuditLogController::class, 'show']);
        });


        // ======================================
        // AUDIT VERIFICATION
        // Permission: audit.verify
        // ======================================

        Route::middleware('permission:audit.verify')->group(function () {
            Route::get('/audit/verify', [AuditLogController::class, 'verify']);
        });


        // ======================================
        // REPORTING
        // Permission: reports.view
        // ======================================

        Route::middleware('permission:reports.view')->group(function () {
            Route::get('/reports/pdf', [ReportController::class, 'pdf']);
            Route::get('/reports/csv', [ReportController::class, 'csv']);
        });


        // ======================================
        // USER MANAGEMENT
        // Permission: users.manage
        // ======================================

        Route::middleware('permission:users.manage')->group(function () {

            Route::get('/users', [UserController::class, 'index']);

            Route::post('/users', [UserController::class, 'store']);

            Route::patch('/users/{user}/role', [UserController::class, 'updateRole']);

            Route::get('/users/roles', function () {
                return response()->json([
                    'success' => true,
                    'data' => Role::select('id', 'name', 'slug')
                        ->orderBy('name')
                        ->get(),
                ]);
            });

        });

    });

});
