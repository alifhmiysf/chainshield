<?php

namespace App\Console\Commands;

use App\Models\LabSession;
use App\Services\Security\LabSecurityTestService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Throwable;

class RunAutomatedSecurityTests extends Command
{
    protected $signature = 'chainshield:run-security-tests {session_id}';

    protected $description = 'Run automated security scanners for an approved lab session';

    public function handle(LabSecurityTestService $securityTest): int
    {
        $sessionId = (int) $this->argument('session_id');

        $session = LabSession::with(['user', 'target'])
            ->find($sessionId);

        if (!$session) {
            $this->error('Lab session tidak ditemukan.');

            return self::FAILURE;
        }

        if ($session->status !== 'running') {
            $this->error('Lab session harus berstatus running.');

            return self::FAILURE;
        }

        if (
            !$session->target ||
            $session->target->authorization_status !== 'approved' ||
            (int) $session->target->user_id !== (int) $session->user_id
        ) {
            $this->error('Target tidak ditemukan atau belum disetujui.');

            return self::FAILURE;
        }

        $timeout = (int) config('chainshield.timeout', 120);

        if ($timeout < 1 || $timeout > 600) {
            $this->error('Konfigurasi timeout scanner tidak valid.');

            return self::FAILURE;
        }

        $lock = Cache::lock(
            "chainshield:lab-session:{$session->id}:execute",
            ($timeout * 4) + 30
        );

        if (!$lock->get()) {
            $this->error('Sesi sedang menjalankan scanner lain.');

            return self::FAILURE;
        }

        $scanners = [
            'sqli',
            'xss',
            'brute_force',
        ];

        $configuration = $session->configuration ?? [];
        $idorOptions = $configuration['scanners']['idor'] ?? null;

        if (
            is_array($idorOptions) &&
            $idorOptions !== []
        ) {
            $scanners[] = 'idor';
        }

        $summary = [
            'success' => 0,
            'failed' => 0,
            'findings' => 0,
        ];

        try {
            $this->info(
                "Starting automated security tests for session #{$session->id}"
            );

            foreach ($scanners as $scannerType) {
                $this->newLine();
                $this->info("Running scanner: {$scannerType}");

                try {
                    $result = $securityTest->execute(
                        session: $session,
                        scannerType: $scannerType,
                        options: $scannerType === 'idor'
                            ? $idorOptions
                            : []
                    );

                    $summary['success']++;
                    $summary['findings'] += $result['total_findings'];

                    $this->table(
                        ['Metric', 'Value'],
                        [
                            ['Scanner', $scannerType],
                            ['Findings', $result['total_findings']],
                            ['Critical', $result['severity_counts']['critical']],
                            ['High', $result['severity_counts']['high']],
                            ['Medium', $result['severity_counts']['medium']],
                            ['Low', $result['severity_counts']['low']],
                            ['Info', $result['severity_counts']['info']],
                            ['Scanner Errors', count($result['scanner_errors'])],
                        ]
                    );

                    if (count($result['scanner_errors']) > 0) {
                        $this->warn(
                            'Scanner selesai tetapi menghasilkan error.'
                        );
                    }
                } catch (Throwable $exception) {
                    report($exception);

                    $summary['failed']++;

                    $this->error(
                        "Scanner {$scannerType} gagal. Periksa application log untuk detail."
                    );
                }
            }

            $this->newLine();
            $this->info('Automated security tests completed.');

            $this->table(
                ['Metric', 'Count'],
                [
                    ['Total Scanners', count($scanners)],
                    ['Successful', $summary['success']],
                    ['Failed', $summary['failed']],
                    ['Total Findings', $summary['findings']],
                ]
            );

            return $summary['failed'] > 0
                ? self::FAILURE
                : self::SUCCESS;
        } finally {
            $lock->release();
        }
    }
}
