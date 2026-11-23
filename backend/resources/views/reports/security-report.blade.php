<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ChainShield Security Report</title>
    <style>
        @page {
            margin: 30px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9px;
            color: #243247;
        }

        h1 {
            color: #173b70;
            font-size: 23px;
            margin-bottom: 5px;
        }

        h2 {
            color: #173b70;
            font-size: 14px;
            margin-top: 25px;
            padding-bottom: 6px;
            border-bottom: 2px solid #2864b4;
        }

        p {
            color: #64748b;
        }

        .header {
            border-bottom: 3px solid #2864b4;
            padding-bottom: 15px;
        }

        .summary {
            width: 100%;
            margin-top: 15px;
        }

        .summary td {
            background: #eef4fc;
            padding: 10px;
            border: 1px solid #d8e3f1;
            text-align: center;
        }

        .number {
            font-size: 18px;
            font-weight: bold;
            color: #173b70;
        }

        table.data {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        table.data th {
            background: #173b70;
            color: white;
            padding: 7px;
            text-align: left;
        }

        table.data td {
            border: 1px solid #dce3ec;
            padding: 6px;
            word-wrap: break-word;
        }

        table.data tr:nth-child(even) {
            background: #f3f6fa;
        }

        .muted {
            color: #64748b;
        }

        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #dce3ec;
            color: #64748b;
            font-size: 8px;
        }

        .empty {
            color: #64748b;
            font-style: italic;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>CHAINSHIELD</h1>
        <strong>SECURITY AUDIT REPORT</strong>

        <p>
            Reporting Period:
            {{ $period['start_date'] ?? 'All Time' }}
            —
            {{ $period['end_date'] ?? 'All Time' }}
        </p>

        <p>
            Generated:
            {{ $generated_at->format('d M Y H:i:s') }}
        </p>
    </div>

    <h2>Executive Summary</h2>

    <table class="summary">
        @foreach(array_chunk($summary, 4, true) as $row)
            <tr>
                @foreach($row as $label => $total)
                    <td>
                        <div class="number">{{ $total }}</div>
                        <div>{{ ucwords(str_replace('_', ' ', $label)) }}</div>
                    </td>
                @endforeach
            </tr>
        @endforeach
    </table>

    <h2>1. Audit Logs</h2>

    <table class="data">
        <thead>
            <tr>
                <th>Sequence</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Created At</th>
            </tr>
        </thead>
        <tbody>
            @forelse($auditLogs as $log)
                <tr>
                    <td>{{ $log->sequence }}</td>
                    <td>{{ $log->actor?->name ?? 'System' }}</td>
                    <td>{{ $log->action }}</td>
                    <td>{{ $log->entity_type }} #{{ $log->entity_id }}</td>
                    <td>{{ $log->created_at }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="empty">No audit logs found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>2. Security Events</h2>

    <table class="data">
        <thead>
            <tr>
                <th>Event Type</th>
                <th>Severity</th>
                <th>User</th>
                <th>Source IP</th>
                <th>Occurred At</th>
            </tr>
        </thead>
        <tbody>
            @forelse($securityEvents as $event)
                <tr>
                    <td>{{ $event->event_type }}</td>
                    <td>{{ strtoupper($event->severity) }}</td>
                    <td>{{ $event->user?->name ?? 'Unknown' }}</td>
                    <td>{{ $event->source_ip }}</td>
                    <td>{{ $event->occurred_at }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="empty">No security events found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>3. Security Alerts</h2>

    <table class="data">
        <thead>
            <tr>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Resolved At</th>
            </tr>
        </thead>
        <tbody>
            @forelse($securityAlerts as $alert)
                <tr>
                    <td>{{ $alert->title }}</td>
                    <td>{{ strtoupper($alert->severity) }}</td>
                    <td>{{ $alert->status }}</td>
                    <td>{{ $alert->assignedUser?->name ?? '-' }}</td>
                    <td>{{ $alert->resolved_at ?? '-' }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="empty">No security alerts found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>4. Security Findings</h2>

    <table class="data">
        <thead>
            <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Severity</th>
                <th>CVSS</th>
                <th>Status</th>
                <th>Endpoint</th>
            </tr>
        </thead>
        <tbody>
            @forelse($securityFindings as $finding)
                <tr>
                    <td>{{ $finding->title }}</td>
                    <td>{{ $finding->vulnerability_type }}</td>
                    <td>{{ strtoupper($finding->severity) }}</td>
                    <td>{{ $finding->cvss_score ?? '-' }}</td>
                    <td>{{ $finding->status }}</td>
                    <td>{{ $finding->affected_endpoint }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="empty">No security findings found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>5. Lab Sessions</h2>

    <table class="data">
        <thead>
            <tr>
                <th>Session</th>
                <th>User</th>
                <th>Target</th>
                <th>Status</th>
                <th>Started At</th>
                <th>Completed At</th>
            </tr>
        </thead>
        <tbody>
            @forelse($labSessions as $session)
                <tr>
                    <td>{{ $session->name }}</td>
                    <td>{{ $session->user?->name ?? '-' }}</td>
                    <td>{{ $session->target?->name ?? '-' }}</td>
                    <td>{{ $session->status }}</td>
                    <td>{{ $session->started_at ?? '-' }}</td>
                    <td>{{ $session->completed_at ?? '-' }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="empty">No lab sessions found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>6. Blockchain Audit Batches</h2>

    <table class="data">
        <thead>
            <tr>
                <th>Batch</th>
                <th>Merkle Root</th>
                <th>Records</th>
                <th>Status</th>
                <th>Anchored At</th>
            </tr>
        </thead>
        <tbody>
            @forelse($auditBatches as $batch)
                <tr>
                    <td>#{{ $batch->batch_number }}</td>
                    <td>{{ $batch->merkle_root }}</td>
                    <td>{{ $batch->total_records }}</td>
                    <td>{{ $batch->status }}</td>
                    <td>{{ $batch->anchored_at ?? '-' }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="empty">No blockchain batches found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>7. Blockchain Transactions</h2>

    <table class="data">
        <thead>
            <tr>
                <th>Batch</th>
                <th>Network</th>
                <th>Chain ID</th>
                <th>Transaction Hash</th>
                <th>Block</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($blockchainTransactions as $transaction)
                <tr>
                    <td>#{{ $transaction->auditBatch?->batch_number ?? '-' }}</td>
                    <td>{{ $transaction->network }}</td>
                    <td>{{ $transaction->chain_id }}</td>
                    <td>{{ $transaction->transaction_hash }}</td>
                    <td>{{ $transaction->block_number ?? '-' }}</td>
                    <td>{{ $transaction->status }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="empty">No blockchain transactions found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        ChainShield — Blockchain-Based Security Audit System
        <br>
        This report was generated automatically by ChainShield.
    </div>

</body>
</html>
