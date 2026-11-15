<?php

namespace App\Services\Security;

use App\Models\LabSession;
use App\Models\PentestTarget;
use App\Services\Audit\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use RuntimeException;

class LabSecurityTestService
{
    public function __construct(
        private PythonSecurityRunnerService $runner,
        private AuditLogService $auditLog
    ) {}

    /**
     * Execute a security scanner for an approved lab session.
     */
    public function execute(
        LabSession $session,
        string $scannerType,
        array $options = []
    ): array {
        $actor = $session->user;

        $session->loadMissing('target');

        if (!$actor || $session->status !== 'running') {
            throw new RuntimeException(
                'Sesi tidak ditemukan atau tidak berstatus running.'
            );
        }

        $target = $session->target;

        if (
            !$target ||
            (int) $target->user_id !== (int) $actor->id ||
            $target->authorization_status !== 'approved'
        ) {
            throw new RuntimeException(
                'Target tidak ditemukan atau tidak lagi disetujui.'
            );
        }

        // Validate scanner type and allowed options.
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

        if (!isset($allowedOptions[$scannerType])) {
            throw new RuntimeException(
                'Jenis scanner tidak dikenal.'
            );
        }

        $unknownOptions = array_diff(
            array_keys($options),
            $allowedOptions[$scannerType]
        );

        if ($unknownOptions !== []) {
            throw new RuntimeException(
                'Parameter scanner tidak dikenal.'
            );
        }

        // IDOR requires two distinct authorization tokens.
        if ($scannerType === 'idor') {
            $validator = Validator::make($options, [
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

            if ($validator->fails()) {
                throw new RuntimeException(
                    'Konfigurasi IDOR tidak valid.'
                );
            }
        }

        // Validate scanner timeout configuration.
        $timeout = (int) config('chainshield.timeout', 120);

        if ($timeout < 1 || $timeout > 600) {
            throw new RuntimeException(
                'Konfigurasi timeout scanner tidak valid.'
            );
        }

        // Always use the approved target URL from the database.
        $report = $this->runner->execute(
            scannerType: $scannerType,
            targetUrl: $target->target_url,
            options: $options
        );

        // Validate and normalize the Python runner report.
        $report = $this->validateReport(
            $report,
            $scannerType,
            $target
        );

        // Persist findings and audit event atomically.
        return DB::transaction(function () use (
            $session,
            $actor,
            $target,
            $scannerType,
            $report
        ) {
            $lockedSession = LabSession::query()
                ->where('user_id', $actor->id)
                ->lockForUpdate()
                ->findOrFail($session->id);

            // Recheck session status and target assignment.
            if (
                $lockedSession->status !== 'running' ||
                (int) $lockedSession->pentest_target_id !== (int) $target->id
            ) {
                throw new RuntimeException(
                    'Status atau target sesi telah berubah. Hasil scan tidak disimpan.'
                );
            }

            // Recheck target ownership and approval.
            $approvedTarget = PentestTarget::query()
                ->whereKey($target->id)
                ->where('user_id', $actor->id)
                ->where('authorization_status', 'approved')
                ->lockForUpdate()
                ->first();

            if (!$approvedTarget) {
                throw new RuntimeException(
                    'Persetujuan target telah berubah. Hasil scan tidak disimpan.'
                );
            }

            $findingIds = [];

            $severityCounts = [
                'critical' => 0,
                'high' => 0,
                'medium' => 0,
                'low' => 0,
                'info' => 0,
            ];

            foreach ($report['findings'] as $findingData) {
                $finding = $lockedSession->findings()->create(
                    array_merge(
                        $findingData,
                        ['status' => 'open']
                    )
                );

                $findingIds[] = $finding->id;
                $severityCounts[$finding->severity]++;
            }

            // Never include IDOR authorization tokens in audit payload.
            $this->auditLog->record(
                action: 'lab.session.scan_executed',
                payload: [
                    'session_id' => $lockedSession->id,
                    'target_id' => $approvedTarget->id,
                    'scanner_type' => $scannerType,
                    'total_findings' => count($findingIds),
                    'finding_ids' => $findingIds,
                    'severity_counts' => $severityCounts,
                    'scanner_errors_count' => count($report['errors']),
                    'started_at' => $report['started_at'],
                    'completed_at' => $report['completed_at'],
                ],
                actor: $actor,
                entityType: 'lab_session',
                entityId: (string) $lockedSession->id
            );

            return [
                'session_id' => $lockedSession->id,
                'scanner_type' => $scannerType,
                'target_url' => $approvedTarget->target_url,
                'total_findings' => count($findingIds),
                'finding_ids' => $findingIds,
                'severity_counts' => $severityCounts,
                'scanner_errors' => $report['errors'],
                'started_at' => $report['started_at'],
                'completed_at' => $report['completed_at'],
            ];
        });
    }

    /**
     * Validate and normalize the Python scanner report.
     */
    private function validateReport(
        array $report,
        string $scannerType,
        PentestTarget $target
    ): array {
        $validator = Validator::make($report, [
            'target_url' => [
                'required',
                'string',
                'max:2048',
            ],
            'scan_type' => [
                'required',
                Rule::in([$scannerType]),
            ],
            'started_at' => [
                'required',
                'date',
            ],
            'completed_at' => [
                'nullable',
                'date',
            ],
            'total_findings' => [
                'required',
                'integer',
                'min:0',
            ],
            'findings' => [
                'present',
                'array',
                'max:1000',
            ],
            'errors' => [
                'present',
                'array',
                'max:100',
            ],
        ]);

        if ($validator->fails()) {
            throw new RuntimeException(
                'Struktur laporan Python runner tidak valid.'
            );
        }

        $validatedReport = $validator->validated();

        $validatedReport['completed_at'] =
            $validatedReport['completed_at'] ?? null;

        // Ensure report belongs to the requested target.
        if (
            rtrim($validatedReport['target_url'], '/') !==
            rtrim($target->target_url, '/')
        ) {
            throw new RuntimeException(
                'Target pada laporan tidak sesuai dengan target yang diminta.'
            );
        }

        // Ensure reported finding count is consistent.
        if (
            $validatedReport['total_findings'] !==
            count($validatedReport['findings'])
        ) {
            throw new RuntimeException(
                'Jumlah temuan pada laporan tidak konsisten.'
            );
        }

        $validatedFindings = [];

        foreach ($validatedReport['findings'] as $index => $finding) {
            if (!is_array($finding)) {
                throw new RuntimeException(
                    "Format security finding nomor {$index} tidak valid."
                );
            }

            $findingValidator = Validator::make($finding, [
                'title' => [
                    'required',
                    'string',
                    'max:200',
                ],
                'vulnerability_type' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'severity' => [
                    'required',
                    Rule::in([
                        'critical',
                        'high',
                        'medium',
                        'low',
                        'info',
                    ]),
                ],
                'description' => [
                    'required',
                    'string',
                ],
                'affected_endpoint' => [
                    'nullable',
                    'string',
                    'max:2048',
                ],
                'evidence' => [
                    'required',
                    'array',
                ],
                'recommendation' => [
                    'nullable',
                    'string',
                ],
                'cvss_score' => [
                    'nullable',
                    'numeric',
                    'between:0,10',
                    'decimal:0,1',
                ],
            ]);

            if ($findingValidator->fails()) {
                throw new RuntimeException(
                    "Format security finding nomor {$index} tidak valid."
                );
            }

            // Only validated fields may be persisted.
            $validatedFindings[] = $findingValidator->validated();
        }

        $validatedReport['findings'] = $validatedFindings;

        return $validatedReport;
    }
}
