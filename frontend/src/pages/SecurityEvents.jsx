
import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  ShieldAlert,
} from 'lucide-react'

import { securityEventService } from '../services/securityEventService'

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })
}

function SeverityBadge({ severity }) {
  const styles = {
    info: 'bg-sky-50 text-sky-700',
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

function DetailModal({ event, onClose }) {
  if (!event) return null

  const fields = [
    ['Event ID', event.id],
    ['Event Type', event.event_type],
    ['Severity', event.severity],
    ['User', event.user?.name || 'System'],
    ['User Email', event.user?.email || '-'],
    ['Source IP', event.source_ip],
    ['User Agent', event.user_agent],
    ['Occurred At', formatDate(event.occurred_at)],
    ['Created At', formatDate(event.created_at)],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Security Event #{event.id}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Event Details
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

          <section>
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Description
            </h3>
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
              {event.description || '-'}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Metadata
            </h3>
            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-300">
              {JSON.stringify(event.metadata ?? {}, null, 2)}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function SecurityEvents() {
  const [events, setEvents] = useState([])
  const [pagination, setPagination] = useState(null)
  const [severity, setSeverity] = useState('')
  const [eventType, setEventType] = useState('')
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await securityEventService.getEvents({
        page,
        per_page: 15,
        ...(severity ? { severity } : {}),
        ...(eventType ? { event_type: eventType } : {}),
      })

      setEvents(data.data || [])
      setPagination(data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve security events.'
      )
    } finally {
      setLoading(false)
    }
  }, [page, severity, eventType])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const resetFilters = () => {
    setSeverity('')
    setEventType('')
    setPage(1)
  }

  const openDetails = async (id) => {
    try {
      const event = await securityEventService.getEvent(id)
      setSelectedEvent(event)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve security event details.'
      )
    }
  }

  const totalPages = pagination?.last_page || 1

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Security / Monitoring
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Security Events
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor detected security events and inspect suspicious activities.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Events</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pagination?.total ?? '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Current Page</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pagination?.current_page ?? '—'}
            <span className="ml-1 text-sm font-medium text-slate-400">
              / {totalPages}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Critical Events on Page</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {events.filter((event) => event.severity === 'critical').length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search size={17} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">
            Filter Events
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            value={severity}
            onChange={(event) => {
              setSeverity(event.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <input
            value={eventType}
            onChange={(event) => {
              setEventType(event.target.value)
              setPage(1)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') fetchEvents()
            }}
            placeholder="Exact event type"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset filters
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Severity and event type filters are applied to the API request.
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
            <Activity size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900">Detected Events</h2>
          </div>
          <span className="text-xs text-slate-500">
            {pagination?.total ?? 0} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Source IP</th>
                <th className="px-5 py-3">Occurred At</th>
                <th className="px-5 py-3">Detail</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    Loading security events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    No security events found.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {event.event_type}
                      </p>
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                        {event.description || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <SeverityBadge severity={event.severity} />
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {event.user?.name || 'System'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {event.user?.email || 'No user'}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {event.source_ip || '-'}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {formatDate(event.occurred_at)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => openDetails(event.id)}
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
            {pagination?.total ?? 0} events
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
            Security event monitoring
          </p>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Security events record detected activities with severity levels,
            source information, timestamps, and metadata for further inspection.
          </p>
        </div>
      </div>

      <DetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}
