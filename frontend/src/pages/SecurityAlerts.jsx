
import { useCallback, useEffect, useState } from 'react'
import {
  ShieldAlert,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Save,
  UserRound,
} from 'lucide-react'

import { securityAlertService } from '../services/securityAlertService'

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })
}

function SeverityBadge({ severity }) {
  const styles = {
    low: 'bg-emerald-50 text-emerald-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-orange-50 text-orange-700',
    critical: 'bg-red-50 text-red-700',
  }

  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase ${
      styles[severity] || 'bg-slate-100 text-slate-600'
    }`}>
      {severity || 'unknown'}
    </span>
  )
}

function StatusBadge({ status }) {
  const styles = {
    open: 'bg-red-50 text-red-700',
    investigating: 'bg-amber-50 text-amber-700',
    resolved: 'bg-emerald-50 text-emerald-700',
    false_positive: 'bg-slate-100 text-slate-600',
  }

  const labels = {
    open: 'Open',
    investigating: 'Investigating',
    resolved: 'Resolved',
    false_positive: 'False Positive',
  }

  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
      styles[status] || 'bg-slate-100 text-slate-600'
    }`}>
      {labels[status] || status || 'Unknown'}
    </span>
  )
}

function DetailModal({ alert, onClose, onSave, saving }) {
  const [status, setStatus] = useState(alert?.status || 'open')
  const [assignedTo, setAssignedTo] = useState(
    alert?.assigned_to ? String(alert.assigned_to) : ''
  )
  const [localError, setLocalError] = useState('')

  if (!alert) return null

  const handleSave = async () => {
    const payload = {}

    if (status !== alert.status) {
      payload.status = status
    }

    const currentAssigned = alert.assigned_to
      ? String(alert.assigned_to)
      : ''

    if (assignedTo !== currentAssigned) {
      payload.assigned_to = assignedTo ? Number(assignedTo) : null
    }

    if (Object.keys(payload).length === 0) {
      setLocalError('No changes to save.')
      return
    }

    setLocalError('')

    try {
      await onSave(alert.id, payload)
    } catch (err) {
      setLocalError(
        err.response?.data?.message || 'Unable to update alert.'
      )
    }
  }

  const fields = [
    ['Alert ID', alert.id],
    ['Severity', alert.severity],
    ['Status', alert.status],
    ['Assigned To', alert.assigned_user?.name || 'Unassigned'],
    ['Created At', formatDate(alert.created_at)],
    ['Resolved At', formatDate(alert.resolved_at)],
    ['Security Event ID', alert.security_event_id ?? '-'],
    ['Event Type', alert.security_event?.event_type || '-'],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Security Alert #{alert.id}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Alert Details
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-2 text-base font-bold text-slate-900">
              {alert.title}
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              {alert.description || 'No description provided.'}
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {value ?? '-'}
                </p>
              </div>
            ))}
          </div>

          {alert.security_event && (
            <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <h3 className="mb-3 text-sm font-bold text-blue-900">
                Related Security Event
              </h3>
              <p className="text-sm text-slate-700">
                Event: {alert.security_event.event_type || '-'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Source IP: {alert.security_event.source_ip || '-'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Description: {alert.security_event.description || '-'}
              </p>
            </section>
          )}

          <section className="space-y-4 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-bold text-slate-900">
              Update Alert
            </h3>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Alert Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Assigned User ID
              </label>
              <input
                type="number"
                min="1"
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                placeholder="Enter user ID, leave empty to unassign"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Enter an existing user ID. Leave empty to remove assignment.
              </p>
            </div>

            {localError && (
              <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {localError}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function SecurityAlerts() {
  const [alerts, setAlerts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await securityAlertService.getAlerts({
        page,
        per_page: 15,
        ...(severity ? { severity } : {}),
        ...(status ? { status } : {}),
      })

      setAlerts(data.data || [])
      setPagination(data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve security alerts.'
      )
    } finally {
      setLoading(false)
    }
  }, [page, severity, status])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const resetFilters = () => {
    setSeverity('')
    setStatus('')
    setPage(1)
  }

  const openDetails = async (id) => {
    try {
      const alert = await securityAlertService.getAlert(id)
      setSelectedAlert(alert)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve security alert details.'
      )
    }
  }

  const updateAlert = async (id, payload) => {
    setSaving(true)

    try {
      await securityAlertService.updateAlert(id, payload)
      setSelectedAlert(null)
      await fetchAlerts()
    } finally {
      setSaving(false)
    }
  }

  const totalPages = pagination?.last_page || 1

  const countStatus = (value) =>
    alerts.filter((alert) => alert.status === value).length

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Security / Monitoring
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Security Alerts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor, investigate, and manage detected security alerts.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Alerts</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pagination?.total ?? '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Open on Page</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {countStatus('open')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Investigating on Page</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {countStatus('investigating')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Resolved on Page</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {countStatus('resolved')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search size={17} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">
            Filter Alerts
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            value={severity}
            onChange={(event) => {
              setSeverity(event.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>

          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset filters
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Severity and status filters are applied to the API request.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900">Detected Alerts</h2>
          </div>
          <span className="text-xs text-slate-500">
            {pagination?.total ?? 0} alerts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Alert</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assigned To</th>
                <th className="px-5 py-3">Created At</th>
                <th className="px-5 py-3">Detail</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    Loading security alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    No security alerts found.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {alert.title}
                      </p>
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                        {alert.description || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <SeverityBadge severity={alert.severity} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={alert.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <UserRound size={15} />
                        {alert.assigned_user?.name || 'Unassigned'}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {formatDate(alert.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => openDetails(alert.id)}
                        className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            Showing {pagination?.from ?? 0}–{pagination?.to ?? 0} of{' '}
            {pagination?.total ?? 0} alerts
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={!pagination?.prev_page_url || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="px-2 text-sm font-semibold text-slate-700">
              {pagination?.current_page ?? 1} / {totalPages}
            </span>

            <button
              disabled={!pagination?.next_page_url || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-blue-700" />
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Security alert management
          </p>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Review detected alerts, investigate suspicious activity, assign
            responsible users, and update alert resolution status.
          </p>
        </div>
      </div>

      <DetailModal
        key={selectedAlert?.id ?? 'empty'}
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onSave={updateAlert}
        saving={saving}
      />
    </div>
  )
}
