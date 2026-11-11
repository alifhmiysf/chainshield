<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LabSession;
use App\Models\PentestTarget;
use App\Services\Audit\AuditLogService;
use App\Services\Security\PythonSecurityRunnerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use RuntimeException;
use Throwable;

class LabSessionExecutionController extends Controller
{
    /**
     * Menjalankan security scanner pada target yang telah disetujui.
     *
     * Target URL selalu diambil dari database, bukan request pengguna.
     * Token IDOR hanya diteruskan sementara dan tidak dicatat ke audit log.
     */
    public function execute(
        Request $request,
        int $id,
        PythonSecurityRunnerService $runner,
        AuditLogService $auditLog
    ): JsonResponse {
        $validated = $request->validate([
            'scanner_type' => [
                'required',
                'string',
                Rule::in(['sqli', 'xss', 'idor', 'brute_force']),
            ],
            'options' => [
                'sometimes',
                'array',
            ],
        ]);

        $scannerType = $validated['scanner_type'];
        $options = $validated['options'] ?? [];

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
            return response()->json([
                'success' => false,
                'message' => 'Parameter scanner tidak dikenal.',
                'errors' => [
                    'options' => array_values($unknownOptions),
                ],
            ], 422);
        }

        if ($scannerType === 'idor') {
            $optionValidator = Validator::make($options, [
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

        $session = LabSession::query()
            ->where('user_id', $actor->id)
            ->findOrFail($id);

        if ($session->status !== 'running') {
            return response()->json([
                'success' => false,
                'message' => 'Scanner hanya dapat dijalankan pada sesi berstatus running.',
            ], 409);
        }

        $target = PentestTarget::query()
            ->where('id', $session->pentest_target_id)
            ->where('user_id', $actor->id)
            ->where('authorization_status', 'approved')
            ->first();

        if (!$target) {
            return response()->json([
                'success' => false,
                'message' => 'Target tidak ditemukan atau tidak lagi disetujui.',
            ], 422);
        }

        $timeout = (int) config('chainshield.timeout', 120);

        if ($timeout < 1 || $timeout > 600) {
            return response()->json([
                'success' => false,
                'message' => 'Konfigurasi timeout scanner tidak valid.',
            ], 500);
        }

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
            // URL target hanya berasal dari record yang disetujui.
            $report = $runner->execute(
                scannerType: $scannerType,
                targetUrl: $target->target_url,
                options: $options
            );

            $reportValidator = Validator::make($report, [
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

            if ($reportValidator->fails()) {
                throw new RuntimeException(
                    'Struktur laporan Python runner tidak valid.'
                );
            }

            $normalizedTargetUrl = rtrim($target->target_url, '/');
            $reportedTargetUrl = rtrim($report['target_url'], '/');

            if ($normalizedTargetUrl !== $reportedTargetUrl) {
                throw new RuntimeException(
                    'Target pada laporan tidak sesuai dengan target yang diminta.'
                );
            }

            if ($report['total_findings'] !== count($report['findings'])) {
                throw new RuntimeException(
                    'Jumlah temuan pada laporan tidak konsisten.'
                );
            }

            $validatedFindings = [];

            foreach ($report['findings'] as $index => $finding) {
                if (!is_array($finding)) {
                    throw new RuntimeException(
                        'Format salah satu security finding tidak valid.'
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

                $validatedFindings[] = $findingValidator->validated();
            }

            // Scanner berjalan di luar transaksi database.
            // Sebelum menyimpan, status session dan target diperiksa ulang.
            $result = DB::transaction(function () use (
                $actor,
                $session,
                $target,
                $scannerType,
                $report,
                $validatedFindings,
                $auditLog
            ) {
                $lockedSession = LabSession::query()
                    ->where('user_id', $actor->id)
                    ->lockForUpdate()
                    ->findOrFail($session->id);

                if ($lockedSession->status !== 'running') {
                    throw new RuntimeException(
                        'Session tidak lagi berstatus running. Hasil scan tidak disimpan.'
                    );
                }

                $approvedTarget = PentestTarget::query()
                    ->where('id', $target->id)
                    ->where('user_id', $actor->id)
                    ->where('authorization_status', 'approved')
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

                foreach ($validatedFindings as $findingData) {
                    $finding = $lockedSession->findings()->create(
                        array_merge(
                            $findingData,
                            ['status' => 'open']
                        )
                    );

                    $findingIds[] = $finding->id;
                    $severityCounts[$finding->severity]++;
                }

                $auditLog->record(
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
                    'finding_ids' => $findingIds,
                    'severity_counts' => $severityCounts,
                    'total_findings' => count($findingIds),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Security scanner berhasil dijalankan.',
                'data' => [
                    'session_id' => $session->id,
                    'scanner_type' => $scannerType,
                    'target_url' => $target->target_url,
                    'total_findings' => $result['total_findings'],
                    'finding_ids' => $result['finding_ids'],
                    'severity_counts' => $result['severity_counts'],
                    'scanner_errors' => $report['errors'],
                    'started_at' => $report['started_at'],
                    'completed_at' => $report['completed_at'],
                ],
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
