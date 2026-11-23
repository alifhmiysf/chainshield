
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ShieldAlert,
  FileCheck2,
  Blocks,
  Bell,
  FlaskConical,
  Clock3,
  AlertCircle,
  RefreshCw,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { dashboardService } from '../services/dashboardService'

const numberFormatter = new Intl.NumberFormat('en-US')

function formatNumber(value) {
  return numberFormatter.format(value ?? 0)
}

function formatLabel(value = '') {
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(value) {
  if (!value) return 'Unknown time'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Unknown time'

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

  return date.toLocaleDateString()
}

function formatResponseTime(value) {
  if (value === null || value === undefined) return 'N/A'

  return `${Number(value).toFixed(2)} ms`
}

function getIntegrityStatus(status) {
  const normalized = String(status || '').toLowerCase()

  const styles = {
    healthy: {
      label: 'Healthy',
      description: 'All monitored checks are operational.',
      text: 'text-emerald-700',
      background: 'bg-emerald-50',
      border: 'border-emerald-200',
      ring: 'border-emerald-200',
      icon: CheckCircle2,
    },
    warning: {
      label: 'Warning',
      description: 'Some checks require attention.',
      text: 'text-amber-700',
      background: 'bg-amber-50',
      border: 'border-amber-200',
      ring: 'border-amber-200',
      icon: AlertTriangle,
    },
    unhealthy: {
      label: 'Unhealthy',
      description: 'One or more system checks have failed.',
      text: 'text-red-700',
      background: 'bg-red-50',
      border: 'border-red-200',
      ring: 'border-red-200',
      icon: XCircle,
    },
  }

  return styles[normalized] ?? {
    label: 'Not Available',
    description: 'System integrity status is not available.',
    text: 'text-slate-500',
    background: 'bg-slate-50',
    border: 'border-slate-200',
    ring: 'border-slate-100',
    icon: AlertCircle,
  }
}

function StatCard({ item }) {
  const Icon = item.icon

  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{item.label}</p>

        <div className={`rounded-xl p-2.5 ${colors[item.color]}`}>
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-3xl font-bold tracking-tight text-slate-900">
          {formatNumber(item.value)}
        </h3>

        <p className="mt-2 text-xs text-slate-400">
          {item.description}
        </p>
      </div>
    </div>
  )
}

function SeverityRow({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">
          {label}
        </span>

        <span className="text-xs font-semibold text-slate-800">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function IntegrityCheck({ name, result }) {
  const status = getIntegrityStatus(result?.status)
  const Icon = status.icon

  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`rounded-lg p-2 ${status.background} ${status.text}`}>
            {name === 'database' ? (
              <Database size={17} />
            ) : (
              <ShieldCheck size={17} />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {formatLabel(name)}
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {result?.message || 'No check result available.'}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${status.background} ${status.text}`}
        >
          <Icon size={12} />
          {status.label}
        </span>
      </div>

      {result && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
          {result.response_time_ms !== undefined && (
            <span className="text-[11px] text-slate-400">
              Response: {formatResponseTime(result.response_time_ms)}
            </span>
          )}

          {result.checked_records !== undefined && (
            <span className="text-[11px] text-slate-400">
              Records checked: {formatNumber(result.checked_records)}
            </span>
          )}

          {result.error_count !== undefined && (
            <span className="text-[11px] text-slate-400">
              Errors: {formatNumber(result.error_count)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function SystemIntegrity({ integrity }) {
  const status = getIntegrityStatus(integrity?.status)
  const Icon = status.icon

  const checks = integrity?.checks
    ? Object.entries(integrity.checks)
    : []

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h3 className="font-bold text-slate-900">
          System Integrity
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          Infrastructure health monitoring
        </p>
      </div>

      <div className="mt-7 flex flex-col items-center">
        <div
          className={`flex h-36 w-36 items-center justify-center rounded-full border-[10px] ${status.ring}`}
        >
          <div className="text-center">
            <Icon className={`mx-auto ${status.text}`} size={27} />

            <p className={`mt-1 text-lg font-extrabold ${status.text}`}>
              {status.label === 'Not Available'
                ? 'N/A'
                : status.label.toUpperCase()}
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          {status.description}
        </p>
      </div>

      {checks.length > 0 ? (
        <div className="mt-7 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Component Checks
          </p>

          {checks.map(([name, result]) => (
            <IntegrityCheck
              key={name}
              name={name}
              result={result}
            />
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-xl bg-slate-50 p-4">
          <div className="flex items-start gap-2">
            <Database
              size={16}
              className="mt-0.5 shrink-0 text-slate-400"
            />

            <p className="text-xs leading-relaxed text-slate-500">
              System integrity monitoring data is not available.
              No operational status is being assumed.
            </p>
          </div>
        </div>
      )}

      {integrity?.checked_at && (
        <p className="mt-4 text-center text-[10px] text-slate-400">
          Last checked: {new Date(integrity.checked_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}

function buildActivities(stats) {
  const auditActivities = (stats.recent_activities ?? []).map((item) => ({
    id: `audit-${item.id}`,
    title: formatLabel(item.action),
    detail: [
      item.entity_type,
      item.entity_id ? `#${item.entity_id}` : null,
      item.actor?.name ? `by ${item.actor.name}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    date: item.created_at,
    status: 'Audit Log',
  }))

  const securityActivities = (
    stats.recent_security_events ?? []
  ).map((item) => ({
    id: `event-${item.id}`,
    title: formatLabel(item.event_type),
    detail: item.description || 'Security event detected',
    date: item.occurred_at,
    status: formatLabel(item.severity),
  }))

  return [...auditActivities, ...securityActivities]
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0
      const dateB = new Date(b.date).getTime() || 0

      return dateB - dateA
    })
    .slice(0, 5)
}

export default function Dashboard() {
  const { user } = useAuth()

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const result = await dashboardService.getDashboard()

      setDashboard(result)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load dashboard data. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard, refreshKey])

  const stats = useMemo(() => {
    if (!dashboard?.stats) return []

    const data = dashboard.stats
    const cards = []

    if (data.audit_logs) {
      cards.push({
        label: 'Total Audit Logs',
        value: data.audit_logs.total,
        description: 'Recorded audit activities',
        icon: Activity,
        color: 'blue',
      })
    }

    if (data.security_findings) {
      cards.push({
        label: 'Security Findings',
        value: data.security_findings.total,
        description: `${formatNumber(data.security_findings.open)} open findings`,
        icon: ShieldAlert,
        color: 'amber',
      })
    }

    if (data.blockchain) {
      cards.push({
        label: 'Anchored Batches',
        value: data.blockchain.anchored_batches,
        description: `${formatNumber(data.blockchain.total_batches)} total batches`,
        icon: Blocks,
        color: 'violet',
      })

      cards.push({
        label: 'Confirmed Transactions',
        value: data.blockchain.confirmed_transactions,
        description: `${formatNumber(data.blockchain.failed_transactions)} failed transactions`,
        icon: FileCheck2,
        color: 'emerald',
      })
    }

    if (data.security_events) {
      cards.push({
        label: 'Security Events',
        value: data.security_events.total,
        description: `${formatNumber(data.security_events.critical)} critical events`,
        icon: AlertCircle,
        color: 'rose',
      })
    }

    if (data.security_alerts) {
      cards.push({
        label: 'Total Security Alerts',
        value: data.security_alerts.total,
        description: `${formatNumber(data.security_alerts.open)} open · ${formatNumber(data.security_alerts.investigating)} investigating · ${formatNumber(data.security_alerts.resolved)} resolved`,
        icon: Bell,
        color: 'amber',
      })
    }

    if (data.lab_sessions) {
      cards.push({
        label: 'Lab Sessions',
        value: data.lab_sessions.total,
        description: `${formatNumber(data.lab_sessions.running)} currently running`,
        icon: FlaskConical,
        color: 'blue',
      })
    }

    return cards
  }, [dashboard])

  const activities = useMemo(
    () => (dashboard ? buildActivities(dashboard.stats) : []),
    [dashboard],
  )

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <RefreshCw size={18} className="animate-spin" />
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <AlertCircle className="mx-auto text-red-500" size={32} />

        <h2 className="mt-4 font-bold text-slate-900">
          Unable to load dashboard
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error}
        </p>

        <button
          onClick={() => setRefreshKey((value) => value + 1)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    )
  }

  const data = dashboard?.stats ?? {}
  const securityEvents = data.security_events
  const severityTotal = securityEvents?.total ?? 0

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">
            SECURITY OVERVIEW
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || 'User'}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Here is what's happening across your security infrastructure.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      {stats.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No dashboard statistics are available for your current permissions.
        </div>
      )}

      {/* Security Overview */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <div>
            <h3 className="font-bold text-slate-900">
              Security Events by Severity
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Distribution of recorded security events
            </p>
          </div>

          {securityEvents ? (
            <div className="mt-8 space-y-6">
              <SeverityRow
                label="Critical"
                value={securityEvents.critical}
                total={severityTotal}
                color="bg-red-500"
              />

              <SeverityRow
                label="High"
                value={securityEvents.high}
                total={severityTotal}
                color="bg-orange-500"
              />

              <SeverityRow
                label="Medium"
                value={securityEvents.medium}
                total={severityTotal}
                color="bg-amber-500"
              />

              <SeverityRow
                label="Low"
                value={securityEvents.low}
                total={severityTotal}
                color="bg-blue-500"
              />

              <SeverityRow
                label="Info"
                value={securityEvents.info}
                total={severityTotal}
                color="bg-slate-400"
              />

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Total security events
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {formatNumber(severityTotal)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Security event statistics are not available for your permissions.
            </div>
          )}
        </div>

        {/* System Integrity */}
        <SystemIntegrity integrity={data.system_integrity} />
      </div>

      {/* Recent Activities */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="font-bold text-slate-900">
            Recent Activities
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Latest audit logs and security events recorded by ChainShield
          </p>
        </div>

        {activities.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {activity.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {activity.detail || 'No additional details'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatDate(activity.date)}
                  </span>

                  <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700">
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No recent activities available.
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400">
        ChainShield Security Platform · Dashboard
      </p>
    </div>
  )
}
