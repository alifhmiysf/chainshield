
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  RefreshCw,
  Plus,
  Eye,
  X,
  Play,
  CheckCircle,
  Ban,
  Clock,
  Search,
  Target,
  FileText,
  ShieldCheck,
  AlertCircle,
  Activity,
  Loader2,
  AlertTriangle,
  Code,
  Lock,
  Database,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { labService } from '../services/labService'

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
}

const severityStyles = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-blue-100 text-blue-800',
  info: 'bg-slate-100 text-slate-700',
}

const findingStatusStyles = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-orange-50 text-orange-700 border-orange-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  false_positive: 'bg-slate-100 text-slate-600 border-slate-200',
}

const scannerOptions = [
  {
    value: 'sqli',
    label: 'SQL Injection',
    description: 'Passive detection of SQL error indicators.',
    icon: Database,
  },
  {
    value: 'xss',
    label: 'Cross-Site Scripting',
    description: 'Checks reflected non-JavaScript probes.',
    icon: Code,
  },
  {
    value: 'idor',
    label: 'Insecure Direct Object Reference',
    description: 'Compares access using two authorization tokens.',
    icon: Lock,
  },
  {
    value: 'brute_force',
    label: 'Brute Force / Rate Limit',
    description: 'Checks rate-limit behavior without credential guessing.',
    icon: Activity,
  },
]

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      {status || 'unknown'}
    </span>
  )
}

function FindingStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        findingStatusStyles[status] || findingStatusStyles.open
      }`}
    >
      {(status || 'open').replaceAll('_', ' ')}
    </span>
  )
}

function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
        severityStyles[severity] || severityStyles.info
      }`}
    >
      {severity || 'info'}
    </span>
  )
}

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

export default function LabSessions() {
  const { hasPermission } = useAuth()

  const canManage = hasPermission('lab.sessions.manage')
  const canExecute = hasPermission('lab.execute')

  const [sessions, setSessions] = useState([])
  const [targets, setTargets] = useState([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [selectedSession, setSelectedSession] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [scannerType, setScannerType] = useState('sqli')
  const [scannerConfig, setScannerConfig] = useState({
    resource_path: '',
    owner_token: '',
    comparison_token: '',
  })
  const [scannerLoading, setScannerLoading] = useState(false)
  const [scannerResult, setScannerResult] = useState(null)

  const [findings, setFindings] = useState([])
  const [findingsPagination, setFindingsPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  })
  const [findingsLoading, setFindingsLoading] = useState(false)

  const [form, setForm] = useState({
    pentest_target_id: '',
    name: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [sessionResult, targetResult] = await Promise.all([
        labService.getSessions({ page, per_page: 10 }),
        labService.getTargets({ page: 1 }),
      ])

      setSessions(sessionResult?.data || [])
      setPagination({
        current_page: sessionResult?.current_page || 1,
        last_page: sessionResult?.last_page || 1,
        total: sessionResult?.total || 0,
      })

      setTargets(targetResult?.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Gagal mengambil data Lab Sessions.',
      )
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadData()
  }, [loadData])

  const approvedTargets = useMemo(
    () =>
      targets.filter(
        (target) => target.authorization_status === 'approved',
      ),
    [targets],
  )

  const filteredSessions = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    if (!keyword) return sessions

    return sessions.filter((session) => {
      const targetName = session.target?.name || ''

      return (
        session.name?.toLowerCase().includes(keyword) ||
        targetName.toLowerCase().includes(keyword) ||
        session.status?.toLowerCase().includes(keyword) ||
        String(session.id).includes(keyword)
      )
    })
  }, [sessions, search])

  const statistics = useMemo(
    () => ({
      total: sessions.length,
      pending: sessions.filter((item) => item.status === 'pending').length,
      running: sessions.filter((item) => item.status === 'running').length,
      completed: sessions.filter((item) => item.status === 'completed').length,
    }),
    [sessions],
  )

  async function loadFindings(sessionId, findingPage = 1) {
    setFindingsLoading(true)

    try {
      const result = await labService.getFindings(sessionId, {
        page: findingPage,
      })

      setFindings(result?.data || [])
      setFindingsPagination({
        current_page: result?.current_page || 1,
        last_page: result?.last_page || 1,
        total: result?.total || 0,
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Gagal mengambil security findings.',
      )
    } finally {
      setFindingsLoading(false)
    }
  }

  async function handleCreateSession(event) {
    event.preventDefault()

    if (!form.pentest_target_id || !form.name.trim()) {
      setError('Target dan nama sesi wajib diisi.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await labService.createSession({
        pentest_target_id: Number(form.pentest_target_id),
        name: form.name.trim(),
      })

      setShowCreateModal(false)
      setForm({ pentest_target_id: '', name: '' })
      setPage(1)

      setSuccess(response.message || 'Lab Session berhasil dibuat.')

      if (page === 1) {
        await loadData()
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Gagal membuat Lab Session.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function openDetail(id) {
    setShowDetailModal(true)
    setDetailLoading(true)
    setSelectedSession(null)
    setScannerResult(null)
    setScannerType('sqli')
    setScannerConfig({
      resource_path: '',
      owner_token: '',
      comparison_token: '',
    })
    setFindings([])
    setFindingsPagination({
      current_page: 1,
      last_page: 1,
      total: 0,
    })
    setError('')

    try {
      const result = await labService.getSession(id)
      setSelectedSession(result)

      await loadFindings(id, 1)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Gagal mengambil detail sesi.',
      )
      setShowDetailModal(false)
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleExecuteScanner(event) {
    event.preventDefault()

    if (!selectedSession || selectedSession.status !== 'running') {
      setError('Scanner hanya dapat dijalankan pada sesi running.')
      return
    }

    const payload = {
      scanner_type: scannerType,
    }

    if (scannerType === 'idor') {
      if (
        !scannerConfig.resource_path.trim() ||
        !scannerConfig.owner_token.trim() ||
        !scannerConfig.comparison_token.trim()
      ) {
        setError('Semua konfigurasi IDOR wajib diisi.')
        return
      }

      if (
        scannerConfig.owner_token === scannerConfig.comparison_token
      ) {
        setError('Owner token dan comparison token harus berbeda.')
        return
      }

      payload.options = {
        resource_path: scannerConfig.resource_path.trim(),
        owner_token: scannerConfig.owner_token,
        comparison_token: scannerConfig.comparison_token,
      }
    }

    setScannerLoading(true)
    setError('')
    setSuccess('')
    setScannerResult(null)

    try {
      const response = await labService.executeScanner(
        selectedSession.id,
        payload,
      )

      setScannerResult(response.data)
      setSuccess(response.message || 'Scanner berhasil dijalankan.')

      await loadFindings(selectedSession.id, 1)

      const updated = await labService.getSession(selectedSession.id)
      setSelectedSession(updated)

      await loadData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Scanner gagal dijalankan.',
      )
    } finally {
      setScannerLoading(false)
    }
  }

  async function handleFindingStatus(findingId, status) {
    if (!selectedSession) return

    setError('')
    setSuccess('')

    try {
      await labService.updateFindingStatus(
        selectedSession.id,
        findingId,
        status,
      )

      setSuccess('Status security finding berhasil diperbarui.')

      await loadFindings(
        selectedSession.id,
        findingsPagination.current_page,
      )

      await loadData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Gagal memperbarui status finding.',
      )
    }
  }

  async function handleSessionAction(action, session) {
    setError('')
    setSuccess('')

    let message = ''

    try {
      if (action === 'start') {
        if (!window.confirm(`Mulai sesi "${session.name}"?`)) return

        await labService.startSession(session.id)
        message = 'Lab Session berhasil dimulai.'
      }

      if (action === 'complete') {
        const summary = window.prompt(
          'Masukkan ringkasan hasil pengujian (opsional):',
          '',
        )

        if (summary === null) return

        await labService.completeSession(session.id, {
          summary: summary.trim() || null,
        })

        message = 'Lab Session berhasil diselesaikan.'
      }

      if (action === 'cancel') {
        if (!window.confirm(`Batalkan sesi "${session.name}"?`)) return

        await labService.cancelSession(session.id)
        message = 'Lab Session berhasil dibatalkan.'
      }

      setSuccess(message)
      await loadData()

      if (showDetailModal && selectedSession?.id === session.id) {
        const updated = await labService.getSession(session.id)
        setSelectedSession(updated)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Aksi terhadap Lab Session gagal.',
      )
    }
  }

  function closeCreateModal() {
    setShowCreateModal(false)
    setForm({ pentest_target_id: '', name: '' })
  }

  function closeDetailModal() {
    setShowDetailModal(false)
    setSelectedSession(null)
    setScannerResult(null)
    setFindings([])
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <ShieldCheck size={16} />
            Security Operations
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Lab Sessions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and monitor authorized security testing sessions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              New Session
            </button>
          )}
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <span className="break-words">{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X size={17} />
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sessions on This Page"
          value={statistics.total}
          icon={ClipboardList}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Pending"
          value={statistics.pending}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />

        <StatCard
          label="Running"
          value={statistics.running}
          icon={Play}
          color="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          label="Completed"
          value={statistics.completed}
          icon={CheckCircle}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* SESSIONS TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">Session Records</h2>
            <p className="mt-1 text-sm text-slate-500">
              {pagination.total} session records found
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sessions..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Session</th>
                <th className="px-5 py-4 font-semibold">Target</th>
                <th className="px-5 py-4 font-semibold">Findings</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Created</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    Loading Lab Sessions...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <ClipboardList
                      size={32}
                      className="mx-auto mb-3 text-slate-300"
                    />
                    <p className="font-medium text-slate-700">
                      No sessions found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a new session to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {session.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        ID #{session.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {session.target?.name || 'Unknown Target'}
                      </p>
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                        {session.target?.target_url || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-700">
                        {session.findings_count ?? 0}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={session.status} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(session.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(session.id)}
                          title="View details"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye size={16} />
                        </button>

                        {canManage && session.status === 'pending' && (
                          <button
                            onClick={() => handleSessionAction('start', session)}
                            title="Start session"
                            className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                          >
                            <Play size={16} />
                          </button>
                        )}

                        {canManage && session.status === 'running' && (
                          <button
                            onClick={() => handleSessionAction('complete', session)}
                            title="Complete session"
                            className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}

                        {canManage &&
                          ['pending', 'running'].includes(session.status) && (
                            <button
                              onClick={() => handleSessionAction('cancel', session)}
                              title="Cancel session"
                              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">
            Page {pagination.current_page} of {pagination.last_page}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={page >= pagination.last_page || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create Lab Session
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a session for an approved target.
                </p>
              </div>

              <button
                onClick={closeCreateModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Approved Target
                </label>

                <select
                  required
                  value={form.pentest_target_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      pentest_target_id: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select an approved target</option>

                  {approvedTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      #{target.id} — {target.name}
                    </option>
                  ))}
                </select>

                {approvedTargets.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No approved targets are available on the first target page.
                  </p>
                )}
              </div>

              {form.pentest_target_id && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                    <Target size={16} />
                    Selected Target
                  </div>

                  {(() => {
                    const target = approvedTargets.find(
                      (item) =>
                        String(item.id) === String(form.pentest_target_id),
                    )

                    return target ? (
                      <div className="mt-2 space-y-1 text-sm text-blue-700">
                        <p className="font-medium">{target.name}</p>
                        <p className="break-all text-xs">{target.target_url}</p>
                        <p className="text-xs capitalize">
                          {target.target_type?.replaceAll('_', ' ')}
                        </p>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Session Name
                </label>

                <input
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Example: Initial Security Assessment"
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || approvedTargets.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SESSION DETAIL MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <div className="my-8 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Session Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Lab session information and execution status.
                </p>
              </div>

              <button
                onClick={closeDetailModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Loading session details...
              </div>
            ) : selectedSession ? (
              <div className="space-y-6 p-6">
                {/* SESSION INFORMATION */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Session #{selectedSession.id}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      {selectedSession.name}
                    </h3>
                  </div>

                  <StatusBadge status={selectedSession.status} />
                </div>

                {/* TARGET INFORMATION */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                    <Target size={17} className="text-blue-600" />
                    Target Information
                  </div>

                  <p className="font-medium text-slate-900">
                    {selectedSession.target?.name || 'Unknown Target'}
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    {selectedSession.target?.target_url || '-'}
                  </p>

                  <p className="mt-2 text-xs capitalize text-slate-500">
                    Type:{' '}
                    {selectedSession.target?.target_type?.replaceAll('_', ' ') || '-'}
                  </p>
                </div>

                {/* SESSION TIMELINE */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Created At
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatDate(selectedSession.created_at)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Started At
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatDate(selectedSession.started_at)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Completed At
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatDate(selectedSession.completed_at)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Findings
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {findingsPagination.total}
                    </p>
                  </div>
                </div>

                {/* SESSION SUMMARY */}
                {selectedSession.summary && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
                      <FileText size={17} className="text-blue-600" />
                      Session Summary
                    </div>

                    <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                      {selectedSession.summary}
                    </div>
                  </div>
                )}

                {/* SCANNER EXECUTION */}
                {canExecute && selectedSession.status === 'running' && (
                  <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                        <Activity size={20} />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          Security Scanner
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Execute an authorized passive security assessment.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleExecuteScanner} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Scanner Type
                        </label>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {scannerOptions.map((option) => {
                            const Icon = option.icon
                            const active = scannerType === option.value

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setScannerType(option.value)}
                                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                                  active
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                                    : 'border-slate-200 bg-white hover:border-blue-200'
                                }`}
                              >
                                <Icon
                                  size={19}
                                  className={active ? 'text-blue-600' : 'text-slate-400'}
                                />

                                <span>
                                  <span className="block text-sm font-semibold text-slate-800">
                                    {option.label}
                                  </span>
                                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                                    {option.description}
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* IDOR CONFIGURATION */}
                      {scannerType === 'idor' && (
                        <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-start gap-2 text-sm text-amber-800">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                            <p>
                              Gunakan dua token otorisasi yang memang Anda miliki
                              dan berhak gunakan untuk pengujian. Token tidak
                              ditampilkan dalam hasil audit.
                            </p>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Resource Path
                            </label>
                            <input
                              required
                              value={scannerConfig.resource_path}
                              onChange={(event) =>
                                setScannerConfig((current) => ({
                                  ...current,
                                  resource_path: event.target.value,
                                }))
                              }
                              placeholder="/api/resources/1"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Owner Authorization Token
                            </label>
                            <input
                              required
                              type="password"
                              autoComplete="off"
                              value={scannerConfig.owner_token}
                              onChange={(event) =>
                                setScannerConfig((current) => ({
                                  ...current,
                                  owner_token: event.target.value,
                                }))
                              }
                              placeholder="Enter owner token"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Comparison Authorization Token
                            </label>
                            <input
                              required
                              type="password"
                              autoComplete="off"
                              value={scannerConfig.comparison_token}
                              onChange={(event) =>
                                setScannerConfig((current) => ({
                                  ...current,
                                  comparison_token: event.target.value,
                                }))
                              }
                              placeholder="Enter comparison token"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col justify-between gap-3 border-t border-blue-100 pt-4 sm:flex-row sm:items-center">
                        <p className="text-xs text-slate-500">
                          Target: {selectedSession.target?.target_url || '-'}
                        </p>

                        <button
                          type="submit"
                          disabled={scannerLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {scannerLoading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play size={16} />
                              Execute Scanner
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {/* SCANNER RESULT */}
                {scannerResult && (
                  <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <CheckCircle size={20} className="text-emerald-600" />
                      <h3 className="font-bold text-slate-900">
                        Scanner Execution Result
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500">Scanner</p>
                        <p className="mt-1 font-semibold uppercase text-slate-800">
                          {scannerResult.scanner_type}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500">Total Findings</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {scannerResult.total_findings ?? 0}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500">Finding IDs</p>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                          {scannerResult.finding_ids?.length
                            ? scannerResult.finding_ids.join(', ')
                            : 'None'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-sm font-semibold text-slate-700">
                        Severity Distribution
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          scannerResult.severity_counts || {},
                        ).map(([severity, count]) => (
                          <div
                            key={severity}
                            className="rounded-lg bg-white px-3 py-2 text-xs"
                          >
                            <span className="capitalize text-slate-500">
                              {severity}:{' '}
                            </span>
                            <strong className="text-slate-900">{count}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {scannerResult.scanner_errors?.length > 0 && (
                      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="mb-2 text-sm font-semibold text-amber-800">
                          Scanner Warnings
                        </p>

                        <ul className="list-inside list-disc space-y-1 text-xs text-amber-700">
                          {scannerResult.scanner_errors.map((item, index) => (
                            <li key={index}>
                              {typeof item === 'string'
                                ? item
                                : JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                )}

                {/* SECURITY FINDINGS */}
                <section className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-blue-600" />
                        <h3 className="font-bold text-slate-900">
                          Security Findings
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {findingsPagination.total} findings recorded
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadFindings(selectedSession.id, 1)}
                      disabled={findingsLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <RefreshCw
                        size={14}
                        className={findingsLoading ? 'animate-spin' : ''}
                      />
                      Refresh Findings
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {findingsLoading ? (
                      <div className="p-8 text-center text-sm text-slate-500">
                        Loading security findings...
                      </div>
                    ) : findings.length === 0 ? (
                      <div className="p-8 text-center">
                        <ShieldCheck
                          size={30}
                          className="mx-auto mb-2 text-slate-300"
                        />
                        <p className="text-sm font-medium text-slate-700">
                          No findings recorded
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Findings will appear here after scanner execution.
                        </p>
                      </div>
                    ) : (
                      findings.map((finding) => (
                        <div key={finding.id} className="space-y-3 p-4">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-slate-400">
                                  #{finding.id}
                                </span>
                                <SeverityBadge severity={finding.severity} />
                                <FindingStatusBadge status={finding.status} />
                              </div>

                              <h4 className="mt-2 font-semibold text-slate-900">
                                {finding.title}
                              </h4>

                              <p className="mt-1 text-xs text-slate-500">
                                {finding.vulnerability_type}
                              </p>
                            </div>

                            {finding.cvss_score !== null &&
                              finding.cvss_score !== undefined && (
                                <div className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-center">
                                  <p className="text-xs text-slate-500">CVSS</p>
                                  <p className="font-bold text-slate-900">
                                    {finding.cvss_score}
                                  </p>
                                </div>
                              )}
                          </div>

                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                            {finding.description}
                          </p>

                          {finding.affected_endpoint && (
                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="text-xs font-semibold text-slate-500">
                                Affected Endpoint
                              </p>
                              <p className="mt-1 break-all font-mono text-xs text-slate-700">
                                {finding.affected_endpoint}
                              </p>
                            </div>
                          )}

                          {finding.recommendation && (
                            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                              <p className="text-xs font-semibold text-blue-800">
                                Recommendation
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-blue-700">
                                {finding.recommendation}
                              </p>
                            </div>
                          )}

                          {canManage &&
                            !['completed', 'cancelled'].includes(
                              selectedSession.status,
                            ) && (
                              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-xs text-slate-400">
                                  Update finding status
                                </span>

                                <select
                                  value={finding.status}
                                  onChange={(event) =>
                                    handleFindingStatus(
                                      finding.id,
                                      event.target.value,
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                                >
                                  <option value="open">Open</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="false_positive">
                                    False Positive
                                  </option>
                                </select>
                              </div>
                            )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* FINDINGS PAGINATION */}
                  {findingsPagination.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-500">
                        Page {findingsPagination.current_page} of{' '}
                        {findingsPagination.last_page}
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={
                            findingsPagination.current_page <= 1 ||
                            findingsLoading
                          }
                          onClick={() =>
                            loadFindings(
                              selectedSession.id,
                              findingsPagination.current_page - 1,
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
                        >
                          Previous
                        </button>

                        <button
                          type="button"
                          disabled={
                            findingsPagination.current_page >=
                              findingsPagination.last_page ||
                            findingsLoading
                          }
                          onClick={() =>
                            loadFindings(
                              selectedSession.id,
                              findingsPagination.current_page + 1,
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* SESSION ACTIONS */}
                {canManage && (
                  <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                    {selectedSession.status === 'pending' && (
                      <button
                        onClick={() =>
                          handleSessionAction('start', selectedSession)
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <Play size={16} />
                        Start Session
                      </button>
                    )}

                    {selectedSession.status === 'running' && (
                      <button
                        onClick={() =>
                          handleSessionAction('complete', selectedSession)
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle size={16} />
                        Complete Session
                      </button>
                    )}

                    {['pending', 'running'].includes(selectedSession.status) && (
                      <button
                        onClick={() =>
                          handleSessionAction('cancel', selectedSession)
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Ban size={16} />
                        Cancel Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">
                Session details are unavailable.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
