
import { useCallback, useEffect, useState } from 'react'
import {
  ShieldCheck,
  RefreshCw,
  Plus,
  Eye,
  X,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { labService } from '../services/labService'

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  }

  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase ${
      styles[status] || 'bg-slate-100 text-slate-600'
    }`}>
      {status || 'unknown'}
    </span>
  )
}

function DetailModal({ target, onClose }) {
  if (!target) return null

  const fields = [
    ['Target ID', target.id],
    ['Target Name', target.name],
    ['Target URL', target.target_url],
    ['Target Type', target.target_type],
    ['Authorization Status', target.authorization_status],
    ['Registered By', target.user?.name || '-'],
    ['Approved By', target.approver?.name || '-'],
    ['Authorized At', formatDate(target.authorized_at)],
    ['Created At', formatDate(target.created_at)],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Security Target #{target.id}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Target Details
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
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
            <h3 className="mb-2 text-sm font-bold text-slate-900">
              Description
            </h3>
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
              {target.description || '-'}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-bold text-slate-900">
              Authorization Proof
            </h3>
            <div className="whitespace-pre-wrap rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
              {target.authorization_proof || '-'}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function TargetForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    target_url: '',
    target_type: 'web_application',
    description: '',
    authorization_proof: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await labService.createTarget(form)
      onSuccess()
      onClose()
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      const firstError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null

      setError(
        firstError ||
        err.response?.data?.message ||
        'Unable to register target.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Security Testing
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Register New Target
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Target Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              required
              maxLength={150}
              placeholder="Example: Company Test Application"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Target URL
            </label>
            <input
              name="target_url"
              type="url"
              value={form.target_url}
              onChange={updateField}
              required
              maxLength={2048}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Target Type
            </label>
            <select
              name="target_type"
              value={form.target_type}
              onChange={updateField}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="web_application">Web Application</option>
              <option value="api">API</option>
              <option value="network">Network</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows={3}
              maxLength={5000}
              placeholder="Describe the target and testing scope..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Authorization Proof
            </label>
            <textarea
              name="authorization_proof"
              value={form.authorization_proof}
              onChange={updateField}
              required
              rows={4}
              maxLength={5000}
              placeholder="Explain the authorization, ownership, or written permission to test this target..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Target testing requires valid authorization.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} />
              {saving ? 'Registering...' : 'Register Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SecurityTesting() {
  const { hasPermission } = useAuth()

  const canManage = hasPermission('lab.sessions.manage')
  const canApprove = hasPermission('lab.targets.approve')

  const [targets, setTargets] = useState([])
  const [pendingTargets, setPendingTargets] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('targets')
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const requests = [
        labService.getTargets({ page, per_page: 10 }),
      ]

      if (canApprove) {
        requests.push(labService.getPendingTargets({ per_page: 10 }))
      }

      const results = await Promise.all(requests)

      const targetData = results[0]
      setTargets(targetData.data || [])
      setPagination(targetData)

      if (canApprove) {
        setPendingTargets(results[1].data || [])
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve security testing data.'
      )
    } finally {
      setLoading(false)
    }
  }, [page, canApprove])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openDetails = async (id) => {
    try {
      const target = await labService.getTarget(id)
      setSelectedTarget(target)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve target details.'
      )
    }
  }

  const handleDecision = async (id, decision) => {
    const action = decision === 'approve' ? 'approve' : 'reject'
    const confirmation = window.confirm(
      `Are you sure you want to ${action} this target?`
    )

    if (!confirmation) return

    setActionLoading(id)
    setError('')
    setNotice('')

    try {
      if (decision === 'approve') {
        await labService.approveTarget(id)
      } else {
        await labService.rejectTarget(id)
      }

      setNotice(`Target successfully ${action}d.`)
      await fetchData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Unable to ${action} target.`
      )
    } finally {
      setActionLoading(null)
    }
  }

  const filteredTargets = targets.filter((target) => {
    const query = search.toLowerCase()

    return (
      target.name?.toLowerCase().includes(query) ||
      target.target_url?.toLowerCase().includes(query) ||
      target.authorization_status?.toLowerCase().includes(query)
    )
  })

  const totalPages = pagination?.last_page || 1

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Security / Assessment
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Security Testing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register authorized targets and manage security testing approvals.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Register Target
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">My Targets</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pagination?.total ?? '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pending Approvals</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {canApprove ? pendingTargets.length : '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Approved Targets on Page</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {targets.filter((target) => target.authorization_status === 'approved').length}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('targets')}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            tab === 'targets'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Targets
        </button>

        {canApprove && (
          <button
            onClick={() => setTab('approvals')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${
              tab === 'approvals'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Approval Queue
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {pendingTargets.length}
            </span>
          </button>
        )}
      </div>

      {tab === 'targets' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-900">Registered Targets</h2>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search targets..."
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Authorization</th>
                  <th className="px-5 py-3">Registered At</th>
                  <th className="px-5 py-3">Detail</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-slate-500">
                      Loading targets...
                    </td>
                  </tr>
                ) : filteredTargets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-slate-500">
                      No targets found.
                    </td>
                  </tr>
                ) : (
                  filteredTargets.map((target) => (
                    <tr key={target.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {target.name}
                        </p>
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                          {target.target_url}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {target.target_type?.replaceAll('_', ' ')}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={target.authorization_status} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(target.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => openDetails(target.id)}
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
              Showing {pagination?.from ?? 0}–{pagination?.to ?? 0} of {pagination?.total ?? 0} targets
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={!pagination?.prev_page_url || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                <span className="sr-only">Previous page</span>
                ‹
              </button>

              <span className="px-2 text-sm font-semibold text-slate-700">
                {pagination?.current_page ?? 1} / {totalPages}
              </span>

              <button
                disabled={!pagination?.next_page_url || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                <span className="sr-only">Next page</span>
                ›
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-600" />
              <h2 className="font-bold text-slate-900">Pending Target Approvals</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Review authorization proof before approving security testing.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">
                Loading approval queue...
              </p>
            ) : pendingTargets.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">
                No pending approvals.
              </p>
            ) : (
              pendingTargets.map((target) => (
                <div key={target.id} className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {target.name}
                      </h3>
                      <StatusBadge status={target.authorization_status} />
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-500">
                      {target.target_url}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Submitted by: {target.user?.name || 'Unknown'} · {formatDate(target.created_at)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {target.authorization_proof || 'No authorization proof provided.'}
                    </p>
                    <button
                      onClick={() => openDetails(target.id)}
                      className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      View full details
                    </button>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleDecision(target.id, 'approve')}
                      disabled={actionLoading === target.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>

                    <button
                      onClick={() => handleDecision(target.id, 'reject')}
                      disabled={actionLoading === target.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-700" />
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Authorized security testing
          </p>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Targets must have valid authorization and be approved before a security testing session can be executed.
          </p>
        </div>
      </div>

      {showForm && (
        <TargetForm
          onClose={() => setShowForm(false)}
          onSuccess={fetchData}
        />
      )}

      <DetailModal
        target={selectedTarget}
        onClose={() => setSelectedTarget(null)}
      />
    </div>
  )
}
