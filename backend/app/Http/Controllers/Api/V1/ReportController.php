<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditBatch;
use App\Models\AuditLog;
use App\Models\BlockchainTransaction;
use App\Models\LabSession;
use App\Models\SecurityAlert;
use App\Models\SecurityEvent;
use App\Models\SecurityFinding;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Build report data using an optional date range.
     */
    private function buildReportData(Request $request): array
    {
        $validated = $request->validate([
            'start_date' => ['sometimes', 'date_format:Y-m-d'],
            'end_date' => [
                'sometimes',
                'date_format:Y-m-d',
                'after_or_equal:start_date',
            ],
        ]);

        $startDate = isset($validated['start_date'])
            ? Carbon::parse($validated['start_date'])->startOfDay()
            : null;

        $endDate = isset($validated['end_date'])
            ? Carbon::parse($validated['end_date'])->endOfDay()
            : null;

        $applyDateFilter = function ($query, string $column = 'created_at') use (
            $startDate,
            $endDate
        ) {
            $query
                ->when(
                    $startDate,
                    fn ($q) => $q->where($column, '>=', $startDate)
                )
                ->when(
                    $endDate,
                    fn ($q) => $q->where($column, '<=', $endDate)
                );
        };

        $auditLogs = AuditLog::with('actor:id,name,email')
            ->when(
                $startDate,
                fn ($q) => $q->where('created_at', '>=', $startDate)
            )
            ->when(
                $endDate,
                fn ($q) => $q->where('created_at', '<=', $endDate)
            )
            ->orderByDesc('sequence')
            ->get();

        $securityEvents = SecurityEvent::with('user:id,name,email')
            ->where(function ($query) use ($applyDateFilter) {
                $applyDateFilter($query, 'occurred_at');
            })
            ->latest('occurred_at')
            ->get();

        $securityAlerts = SecurityAlert::with([
            'securityEvent',
            'assignedUser:id,name,email',
        ])
            ->where(function ($query) use ($applyDateFilter) {
                $applyDateFilter($query);
            })
            ->latest()
            ->get();

        $securityFindings = SecurityFinding::with('labSession:id,name,status')
            ->where(function ($query) use ($applyDateFilter) {
                $applyDateFilter($query);
            })
            ->latest()
            ->get();

        $labSessions = LabSession::with([
            'user:id,name,email',
            'target:id,name',
        ])
            ->where(function ($query) use ($applyDateFilter) {
                $applyDateFilter($query);
            })
            ->latest()
            ->get();

        $auditBatches = AuditBatch::with('blockchainTransactions')
            ->where(function ($query) use ($applyDateFilter) {
                $applyDateFilter($query);
            })
            ->latest()
            ->get();

        $blockchainTransactions = BlockchainTransaction::with(
            'auditBatch:id,batch_number'
        )
            ->where(function ($query) use ($applyDateFilter) {
                $applyDateFilter($query);
            })
            ->latest()
            ->get();

        return [
            'period' => [
                'start_date' => $startDate?->toDateString(),
                'end_date' => $endDate?->toDateString(),
            ],
            'generated_at' => now(),
            'summary' => [
                'audit_logs' => $auditLogs->count(),
                'security_events' => $securityEvents->count(),
                'security_alerts' => $securityAlerts->count(),
                'security_findings' => $securityFindings->count(),
                'lab_sessions' => $labSessions->count(),
                'audit_batches' => $auditBatches->count(),
                'blockchain_transactions' => $blockchainTransactions->count(),
            ],
            'auditLogs' => $auditLogs,
            'securityEvents' => $securityEvents,
            'securityAlerts' => $securityAlerts,
            'securityFindings' => $securityFindings,
            'labSessions' => $labSessions,
            'auditBatches' => $auditBatches,
            'blockchainTransactions' => $blockchainTransactions,
        ];
    }

    /**
     * Export report as PDF.
     */
    public function pdf(Request $request)
    {
        $data = $this->buildReportData($request);

        $pdf = Pdf::loadView('reports.security-report', $data)
            ->setPaper('a4', 'landscape');

        return $pdf->download('chainshield-security-report.pdf');
    }

    /**
     * Export report as CSV.
     */
    public function csv(Request $request): StreamedResponse
    {
        $data = $this->buildReportData($request);

        return response()->streamDownload(function () use ($data) {
            $output = fopen('php://output', 'w');

            // UTF-8 BOM for spreadsheet compatibility.
            fwrite($output, "\xEF\xBB\xBF");

            fputcsv($output, ['CHAINSHIELD SECURITY REPORT']);
            fputcsv($output, [
                'Generated At',
                $data['generated_at']->toDateTimeString(),
            ]);
            fputcsv($output, [
                'Start Date',
                $data['period']['start_date'] ?? 'All',
            ]);
            fputcsv($output, [
                'End Date',
                $data['period']['end_date'] ?? 'All',
            ]);

            fputcsv($output, []);
            fputcsv($output, ['SUMMARY']);
            fputcsv($output, ['Category', 'Total']);

            foreach ($data['summary'] as $category => $total) {
                fputcsv($output, [$category, $total]);
            }

            fputcsv($output, []);
            fputcsv($output, [
                'AUDIT LOGS',
            ]);
            fputcsv($output, [
                'Sequence',
                'Actor',
                'Action',
                'Entity Type',
                'Entity ID',
                'Created At',
                'Current Hash',
            ]);

            foreach ($data['auditLogs'] as $log) {
                fputcsv($output, [
                    $log->sequence,
                    $log->actor?->name,
                    $log->action,
                    $log->entity_type,
                    $log->entity_id,
                    $log->created_at,
                    $log->current_hash,
                ]);
            }

            fputcsv($output, []);
            fputcsv($output, ['SECURITY EVENTS']);
            fputcsv($output, [
                'Event Type',
                'Severity',
                'User',
                'Source IP',
                'Description',
                'Occurred At',
            ]);

            foreach ($data['securityEvents'] as $event) {
                fputcsv($output, [
                    $event->event_type,
                    $event->severity,
                    $event->user?->name,
                    $event->source_ip,
                    $event->description,
                    $event->occurred_at,
                ]);
            }

            fputcsv($output, []);
            fputcsv($output, ['SECURITY ALERTS']);
            fputcsv($output, [
                'Title',
                'Severity',
                'Status',
                'Assigned To',
                'Resolved At',
                'Created At',
            ]);

            foreach ($data['securityAlerts'] as $alert) {
                fputcsv($output, [
                    $alert->title,
                    $alert->severity,
                    $alert->status,
                    $alert->assignedUser?->name,
                    $alert->resolved_at,
                    $alert->created_at,
                ]);
            }

            fputcsv($output, []);
            fputcsv($output, ['SECURITY FINDINGS']);
            fputcsv($output, [
                'Title',
                'Vulnerability Type',
                'Severity',
                'CVSS',
                'Status',
                'Affected Endpoint',
                'Created At',
            ]);

            foreach ($data['securityFindings'] as $finding) {
                fputcsv($output, [
                    $finding->title,
                    $finding->vulnerability_type,
                    $finding->severity,
                    $finding->cvss_score,
                    $finding->status,
                    $finding->affected_endpoint,
                    $finding->created_at,
                ]);
            }

            fputcsv($output, []);
            fputcsv($output, ['LAB SESSIONS']);
            fputcsv($output, [
                'Name',
                'User',
                'Target',
                'Status',
                'Started At',
                'Completed At',
                'Created At',
            ]);

            foreach ($data['labSessions'] as $session) {
                fputcsv($output, [
                    $session->name,
                    $session->user?->name,
                    $session->target?->name,
                    $session->status,
                    $session->started_at,
                    $session->completed_at,
                    $session->created_at,
                ]);
            }

            fputcsv($output, []);
            fputcsv($output, ['BLOCKCHAIN BATCHES']);
            fputcsv($output, [
                'Batch Number',
                'Merkle Root',
                'Total Records',
                'Status',
                'Anchored At',
                'Created At',
            ]);

            foreach ($data['auditBatches'] as $batch) {
                fputcsv($output, [
                    $batch->batch_number,
                    $batch->merkle_root,
                    $batch->total_records,
                    $batch->status,
                    $batch->anchored_at,
                    $batch->created_at,
                ]);
            }

            fputcsv($output, []);
            fputcsv($output, ['BLOCKCHAIN TRANSACTIONS']);
            fputcsv($output, [
                'Batch Number',
                'Network',
                'Chain ID',
                'Transaction Hash',
                'Block Number',
                'Gas Used',
                'Status',
                'Confirmed At',
            ]);

            foreach ($data['blockchainTransactions'] as $transaction) {
                fputcsv($output, [
                    $transaction->auditBatch?->batch_number,
                    $transaction->network,
                    $transaction->chain_id,
                    $transaction->transaction_hash,
                    $transaction->block_number,
                    $transaction->gas_used,
                    $transaction->status,
                    $transaction->confirmed_at,
                ]);
            }

            fclose($output);
        }, 'chainshield-security-report.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
