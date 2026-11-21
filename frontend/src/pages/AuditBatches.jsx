
import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Database,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  Layers,
  Link,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { auditBatchService } from '../services/auditBatchService'
import { useAuth } from '../context/AuthContext'

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function shortenHash(value, start = 12, end = 8) {
  if (!value) return '-'
  if (value.length <= start + end) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    anchored: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    failed: 'bg-rose-50 text-rose-700 ring-rose-200',
  }

  const labels = {
    pending: 'Pending',
    anchored: 'Anchored',
    failed: 'Failed',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {labels[status] || status || 'Unknown'}
    </span>
  )
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={`break-all text-sm text-slate-800 ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value ?? '-'}
      </p>
    </div>
  )
}

function BatchDetailModal({
  batch,
  onClose,
  canAnchor,
  canVerify,
  onAnchor,
  onVerify,
  actionLoading,
  actionMessage,
  actionError,
  verification,
}) {
  const [copied, setCopied] = useState(false)
  const [confirmAnchor, setConfirmAnchor] = useState(false)

  const copyHash = async () => {
    if (!batch.merkle_root) return

    try {
      await navigator.clipboard.writeText(batch.merkle_root)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access may be unavailable in some browser contexts.
    }
  }

  if (!batch) return null

  const isPending = batch.status === 'pending'
  const isAnchored = batch.status === 'anchored'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Blockchain Audit
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Batch #{batch.batch_number}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Batch status</span>
            <StatusBadge status={batch.status} />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Merkle Root
              </p>

              <button
                onClick={copyHash}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p className="break-all font-mono text-xs leading-6 text-slate-700">
              {batch.merkle_root || '-'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {batch.total_records ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Sequence Range</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {batch.start_sequence ?? '-'} - {batch.end_sequence ?? '-'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Batch Information
            </h3>

            <DetailRow label="Batch ID" value={batch.id} />
            <DetailRow label="Batch Number" value={batch.batch_number} />
            <DetailRow label="Created At" value={formatDate(batch.created_at)} />
            <DetailRow label="Anchored At" value={formatDate(batch.anchored_at)} />
            <DetailRow label="Updated At" value={formatDate(batch.updated_at)} />
          </div>

          {/* Blockchain Actions */}
          {(isPending && canAnchor) || (isAnchored && canVerify) ? (
            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Blockchain Actions
              </h3>

              {isPending && canAnchor && (
                <div className="space-y-3">
                  {!confirmAnchor ? (
                    <button
                      onClick={() => setConfirmAnchor(true)}
                      disabled={actionLoading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Link size={16} />
                      Anchor to Blockchain
                    </button>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          size={20}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">
                            Confirm Blockchain Anchoring
                          </p>
                          <p className="mt-1 text-xs leading-5 text-amber-800">
                            This action will submit Batch #{batch.batch_number}
                            {' '}to the configured blockchain network. Make sure
                            the batch data and Merkle Root are correct.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setConfirmAnchor(false)}
                          disabled={actionLoading}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={() => {
                            setConfirmAnchor(false)
                            onAnchor()
                          }}
                          disabled={actionLoading}
                          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Confirm Anchor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isAnchored && canVerify && (
                <button
                  onClick={onVerify}
                  disabled={actionLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  Verify Blockchain
                </button>
              )}
            </div>
          ) : null}

          {actionLoading && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
              <Loader2 size={16} className="animate-spin" />
              Processing blockchain request. Please wait...
            </div>
          )}

          {actionError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Blockchain action failed</p>
                  <p className="mt-1">{actionError}</p>
                  {isPending && (
                    <p className="mt-2 text-xs">
                      If the request timed out or returned a gateway error,
                      refresh the batch status before attempting another anchor.
                      The transaction may already have been submitted.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {actionMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <div className="flex items-start gap-2">
                <Check size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{actionMessage}</p>
                </div>
              </div>
            </div>
          )}

          {verification && (
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Blockchain Verification Result
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Overall Status</span>
                <StatusBadge
                  status={verification.verified ? 'anchored' : 'failed'}
                />
              </div>

              <DetailRow
                label="Database Integrity"
                value={
                  verification.database_integrity ? 'Passed' : 'Failed'
                }
              />

              <DetailRow
                label="Blockchain Verification"
                value={
                  verification.blockchain_verification?.verified === true
                    ? 'Passed'
                    : verification.verified
                      ? 'Passed'
                      : 'Failed'
                }
              />

              <DetailRow
                label="Transaction Hash"
                value={verification.transaction?.transaction_hash}
                mono
              />

              <DetailRow
                label="Block Number"
                value={verification.transaction?.block_number}
              />
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AuditBatches() {
  const { hasPermission } = useAuth()

  const canAnchor = hasPermission('blockchain.anchor')
  const canVerify = hasPermission('blockchain.view')

  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [selectedBatch, setSelectedBatch] = useState(null)

  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [verification, setVerification] = useState(null)

  const fetchBatches = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const result = await auditBatchService.getBatches({
        status: status || undefined,
        page,
        per_page: 10,
      })

      setBatches(result.data || [])
      setPagination({
        currentPage: result.current_page || 1,
        lastPage: result.last_page || 1,
        total: result.total || 0,
        from: result.from,
        to: result.to,
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load audit batches. Please check the API connection.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [status, page])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const filteredBatches = batches.filter((batch) => {
    const keyword = search.toLowerCase()

    return (
      String(batch.batch_number).includes(keyword) ||
      String(batch.merkle_root || '').toLowerCase().includes(keyword)
    )
  })

  const changeStatus = (value) => {
    setStatus(value)
    setPage(1)
  }

  const openBatchDetails = async (batch) => {
    try {
      setError('')
      setActionMessage('')
      setActionError('')
      setVerification(null)

      const detail = await auditBatchService.getBatch(batch.id)
      setSelectedBatch(detail)
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load batch details.',
      )
    }
  }

  const handleAnchor = async () => {
    if (!selectedBatch || actionLoading) return

    setActionLoading(true)
    setActionMessage('')
    setActionError('')
    setVerification(null)

    try {
      const result = await auditBatchService.anchorBatch(selectedBatch.id)

      setActionMessage(
        result.message || 'Audit batch successfully anchored to blockchain.',
      )

      const updatedBatch = await auditBatchService.getBatch(selectedBatch.id)
      setSelectedBatch(updatedBatch)

      await fetchBatches(true)
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          'Blockchain anchoring failed. Please check the batch status and blockchain connection.',
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!selectedBatch || actionLoading) return

    setActionLoading(true)
    setActionMessage('')
    setActionError('')
    setVerification(null)

    try {
      const result = await auditBatchService.verifyBatch(selectedBatch.id)
      const data = result.data

      setVerification(data)
      setActionMessage(
        result.message || 'Audit batch successfully verified against blockchain.',
      )
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          'Blockchain verification failed. Please check the audit batch integrity and blockchain connection.',
      )
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <ShieldCheck size={17} />
            Blockchain Security
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Batches
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage audit batches and monitor their blockchain anchoring status.
          </p>
        </div>

        <button
          onClick={() => fetchBatches(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Batches</p>
            <Database className="text-blue-600" size={20} />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {pagination?.total ?? 0}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Recorded audit batches
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Current Page</p>
            <Layers className="text-indigo-600" size={20} />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {pagination?.currentPage ?? 1}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Of {pagination?.lastPage ?? 1} pages
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Visible Records</p>
            <ShieldAlert className="text-amber-600" size={20} />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {batches.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">On this page</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Batch Registry</h2>
            <p className="mt-1 text-xs text-slate-500">
              Browse and inspect blockchain audit batches.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search batch or Merkle root..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-64"
              />
            </div>

            <select
              value={status}
              onChange={(event) => changeStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="anchored">Anchored</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="m-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="px-5 py-20 text-center">
            <Database size={34} className="mx-auto text-slate-300" />

            <h3 className="mt-3 font-semibold text-slate-800">
              No audit batches found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing the filter or search keyword.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Batch</th>
                  <th className="px-5 py-4 font-semibold">Merkle Root</th>
                  <th className="px-5 py-4 font-semibold">Records</th>
                  <th className="px-5 py-4 font-semibold">Sequence</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900">
                        #{batch.batch_number}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {shortenHash(batch.merkle_root)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {batch.total_records}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {batch.start_sequence} - {batch.end_sequence}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={batch.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(batch.created_at)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openBatchDetails(batch)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Details
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            Showing {pagination?.from ?? 0}-{pagination?.to ?? 0} of{' '}
            {pagination?.total ?? 0} batches
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!pagination || pagination.currentPage <= 1 || loading}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-2 text-sm font-medium text-slate-600">
              Page {pagination?.currentPage ?? 1} / {pagination?.lastPage ?? 1}
            </span>

            <button
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination?.lastPage ?? 1, current + 1),
                )
              }
              disabled={
                !pagination ||
                pagination.currentPage >= pagination.lastPage ||
                loading
              }
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {selectedBatch && (
        <BatchDetailModal
          batch={selectedBatch}
          onClose={() => setSelectedBatch(null)}
          canAnchor={canAnchor}
          canVerify={canVerify}
          onAnchor={handleAnchor}
          onVerify={handleVerify}
          actionLoading={actionLoading}
          actionMessage={actionMessage}
          actionError={actionError}
          verification={verification}
        />
      )}
    </div>
  )
}
