<?php

namespace App\Services\Monitoring;

use App\Services\Audit\AuditVerificationService;
use Illuminate\Support\Facades\DB;
use Throwable;

class SystemIntegrityService
{
    public function __construct(
        private readonly AuditVerificationService $auditVerificationService
    ) {
    }

    public function check(): array
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'audit_trail' => $this->checkAuditTrail(),
        ];

        $statuses = array_column($checks, 'status');

        $overallStatus = match (true) {
            in_array('unhealthy', $statuses, true) => 'unhealthy',
            in_array('warning', $statuses, true) => 'warning',
            default => 'healthy',
        };

        return [
            'status' => $overallStatus,
            'checks' => $checks,
            'checked_at' => now()->toISOString(),
        ];
    }

    private function checkDatabase(): array
    {
        $startedAt = microtime(true);

        try {
            DB::connection()->select('SELECT 1');

            return [
                'status' => 'healthy',
                'message' => 'Database connection is operational.',
                'response_time_ms' => $this->responseTime($startedAt),
            ];
        } catch (Throwable $exception) {
            report($exception);

            return [
                'status' => 'unhealthy',
                'message' => 'Database connection failed.',
                'response_time_ms' => $this->responseTime($startedAt),
            ];
        }
    }

    private function checkAuditTrail(): array
    {
        $startedAt = microtime(true);

        try {
            $result = $this->auditVerificationService->verify();

            return [
                'status' => $result['valid'] ? 'healthy' : 'unhealthy',
                'message' => $result['valid']
                    ? 'Audit trail integrity verified.'
                    : 'Audit trail integrity verification failed.',
                'checked_records' => $result['checked_records'],
                'error_count' => count($result['errors']),
                'response_time_ms' => $this->responseTime($startedAt),
            ];
        } catch (Throwable $exception) {
            report($exception);

            return [
                'status' => 'unhealthy',
                'message' => 'Audit trail verification could not be completed.',
                'response_time_ms' => $this->responseTime($startedAt),
            ];
        }
    }

    private function responseTime(float $startedAt): float
    {
        return round((microtime(true) - $startedAt) * 1000, 2);
    }
}
