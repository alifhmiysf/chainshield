
import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  RefreshCw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  X,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

import { auditLogService } from '../services/auditLogService'

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })
}

function shortHash(value) {
  if (!value) return '-'
  return `${value.slice(0, 12)}...${value.slice(-8)}`
}

function HashValue({ value }) {
  const [copied, setCopied] = useState(false)

  const copyHash = async () => {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copyHash}
      className="inline-flex items-center gap-2 font-mono text-xs text-blue-700 hover:text-blue-900"
      title="Copy full hash"
    >
      {shortHash(value)}
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

function DetailModal({ log, onClose }) {
  if (!log) return null

  const fields = [
    ['Sequence', log.sequence],
    ['Action', log.action],
    ['Entity Type', log.entity_type],
    ['Entity ID', log.entity_id],
    ['Actor', log.actor?.name || 'System'],
    ['Actor Email', log.actor?.email || '-'],
    ['Created At', formatDate(log.created_at)],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Audit Record #{log.sequence}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Audit Log Details
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
                <p className="text-xs font-medium text-slate-500">
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {value ?? '-'}
                </p>
              </div>
            ))}
          </div>

          <section>
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Hash Chain
            </h3>

            <div className="space-y-3">
              {[
                ['Payload Hash', log.payload_hash],
                ['Previous Hash', log.previous_hash],
                ['Current Hash', log.current_hash],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="mb-2 text-xs font-semibold text-slate-500">
                    {label}
                  </p>
                  <HashValue value={value} />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Payload
            </h3>

            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-300">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}

function VerificationResult({ result }) {
  if (!result) return null

  const isValid = result.valid

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isValid
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-red-200 bg-red-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {isValid ? (
          <CheckCircle2
            className="mt-0.5 shrink-0 text-emerald-600"
            size={24}
          />
        ) : (
          <AlertTriangle
            className="mt-0.5 shrink-0 text-red-600"
            size={24}
          />
        )}

        <div className="min-w-0 flex-1">
          <h3
            className={`font-bold ${
              isValid ? 'text-emerald-900' : 'text-red-900'
            }`}
          >
            {isValid
              ? 'Audit Integrity Verified'
              : 'Audit Integrity Verification Failed'}
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {isValid
              ? 'All checked audit records passed the integrity checks.'
              : 'Integrity issues were detected in the audit chain.'}
          </p>

          <p className="mt-3 text-sm font-semibold text-slate-800">
            Records checked: {result.checked_records}
          </p>

          {result.errors?.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-bold text-red-800">
                Detected Errors
              </h4>

              {result.errors.map((item, index) => (
                <div
                  key={`${item.sequence}-${index}`}
                  className="rounded-lg border border-red-200 bg-white p-3 text-sm"
                >
                  <span className="font-semibold text-red-800">
                    Sequence #{item.sequence}
                  </span>
                  <p className="mt-1 text-red-700">
                    {item.error}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [action, setAction] = useState('')
  const [actorId, setActorId] = useState('')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verification, setVerification] = useState(null)
  const [verifying, setVerifying] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await auditLogService.getLogs({
        page,
        per_page: 15,
        ...(action ? { action } : {}),
        ...(actorId ? { actor_id: actorId } : {}),
      })

      setLogs(data.data || [])
      setPagination(data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve audit logs.',
      )
    } finally {
      setLoading(false)
    }
  }, [page, action, actorId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const resetFilters = () => {
    setAction('')
    setActorId('')
    setPage(1)
  }

  const openDetails = async (id) => {
    try {
      const log = await auditLogService.getLog(id)
      setSelectedLog(log)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve audit log details.',
      )
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    setVerification(null)
    setError('')

    try {
      const result = await auditLogService.verifyIntegrity()
      setVerification(result)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to verify audit log integrity.',
      )
    } finally {
      setVerifying(false)
    }
  }

  const totalPages = pagination?.last_page || 1

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Security / Audit Trail
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Audit Logs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor recorded activities and inspect the audit hash chain.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleVerify}
            disabled={verifying || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            {verifying ? 'Verifying...' : 'Verify Integrity'}
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Records</p>
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
          <p className="text-sm text-slate-500">Latest Sequence</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {logs[0]?.sequence ?? '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search size={17} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">
            Filter Records
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={action}
            onChange={(event) => {
              setAction(event.target.value)
              setPage(1)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') fetchLogs()
            }}
            placeholder="Exact action, e.g. auth.login"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <input
            type="number"
            min="1"
            value={actorId}
            onChange={(event) => {
              setActorId(event.target.value)
              setPage(1)
            }}
            placeholder="Actor ID"
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
          Action filter uses an exact match. Actor ID filters by user.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Verification Result */}
      <VerificationResult result={verification} />

      {/* Audit Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileSearch size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900">
              Recorded Activities
            </h2>
          </div>

          <span className="text-xs text-slate-500">
            {pagination?.total ?? 0} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Sequence</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Current Hash</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Detail</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-mono font-semibold text-slate-700">
                      #{log.sequence}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {log.actor?.name || 'System'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {log.actor?.email || 'No actor'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {log.entity_type || '—'}
                      {log.entity_id ? ` #${log.entity_id}` : ''}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-slate-500">
                        {shortHash(log.current_hash)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {formatDate(log.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => openDetails(log.id)}
                        className="font-semibold text-blue-700 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            Showing {pagination?.from ?? 0}–{pagination?.to ?? 0} of{' '}
            {pagination?.total ?? 0} records
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={!pagination?.prev_page_url || loading}
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
              }
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

      {/* Hash Chain Information */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-blue-700"
        />

        <div>
          <p className="text-sm font-semibold text-blue-900">
            Hash-chain audit trail
          </p>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Each record contains a payload hash, previous hash, and current
            hash. Use Verify Integrity to check the complete audit chain.
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  )
}
