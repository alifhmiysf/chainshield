import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Blocks,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Loader2,
  Copy,
  Database,
} from 'lucide-react'

import { auditBatchService } from '../services/auditBatchService'

// Active Hardhat Localhost configuration
const NETWORK_NAME = 'Hardhat Localhost'
const CHAIN_ID = 31337
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

function shorten(value, start = 12, end = 8) {
  if (!value) return '-'

  const text = String(value)

  if (text.length <= start + end) return text

  return `${text.slice(0, start)}...${text.slice(-end)}`
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('id-ID')
}

function StatusBadge({ status }) {
  const normalized = String(status || 'unknown').toLowerCase()

  const styles = {
    confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    anchored: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    failed: 'bg-red-50 text-red-700 ring-red-200',
    unknown: 'bg-slate-100 text-slate-600 ring-slate-200',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[normalized] || styles.unknown
      }`}
    >
      {normalized}
    </span>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {formatNumber(value)}
      </p>
    </div>
  )
}

function NetworkInfo() {
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
    } catch {
      // Clipboard permission may be unavailable.
    }
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-5">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Blocks size={25} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-900">
                {NETWORK_NAME}
              </h2>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Active
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Local Ethereum development network
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-xs text-slate-400">
              Chain ID
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {CHAIN_ID}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Protocol
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              Ethereum EVM
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium text-slate-400">
          Smart Contract Address
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="break-all font-mono text-sm font-medium text-slate-700">
            {CONTRACT_ADDRESS}
          </p>

          <button
            type="button"
            onClick={copyAddress}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Copy size={13} />
            Copy address
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Local contract address. Not available on public block explorers.
        </p>
      </div>
    </div>
  )
}

function VerificationResult({ verification }) {
  if (!verification) return null

  const verified = verification.verified === true
  const databaseValid = verification.database_integrity === true
  const blockchainValid = verification.blockchain_verification?.success === true
  const valid = verified && databaseValid && blockchainValid

  return (
    <div
      className={`rounded-xl border p-5 ${
        valid
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-red-200 bg-red-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {valid ? (
          <CheckCircle2
            size={22}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
        ) : (
          <CircleAlert
            size={22}
            className="mt-0.5 shrink-0 text-red-600"
          />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">
            Batch #{verification.batchNumber} Verification
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {valid
              ? 'Audit data and blockchain records successfully verified.'
              : 'Verification completed, but one or more integrity checks did not pass.'}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            valid
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {valid ? 'VALID' : 'INVALID'}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/70 bg-white/70 p-3">
          <p className="text-xs text-slate-500">
            Database Integrity
          </p>
          <p className={`mt-1 text-sm font-semibold ${
            databaseValid ? 'text-emerald-700' : 'text-red-700'
          }`}>
            {databaseValid ? 'Valid' : 'Invalid'}
          </p>
        </div>

        <div className="rounded-lg border border-white/70 bg-white/70 p-3">
          <p className="text-xs text-slate-500">
            Blockchain Verification
          </p>
          <p className={`mt-1 text-sm font-semibold ${
            blockchainValid ? 'text-emerald-700' : 'text-red-700'
          }`}>
            {blockchainValid ? 'Valid' : 'Invalid'}
          </p>
        </div>

        <div className="rounded-lg border border-white/70 bg-white/70 p-3">
          <p className="text-xs text-slate-500">
            Chain ID
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {verification.blockchain_verification?.chain_id ?? '-'}
          </p>
        </div>
      </div>

      {verification.transaction?.transaction_hash && (
        <div className="mt-4 border-t border-slate-200/70 pt-3">
          <p className="text-xs text-slate-500">
            Transaction Hash
          </p>
          <p className="mt-1 break-all font-mono text-xs text-slate-700">
            {verification.transaction.transaction_hash}
          </p>
        </div>
      )}
    </div>
  )
}

export default function Blockchain() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifyingId, setVerifyingId] = useState(null)
  const [verification, setVerification] = useState(null)

  const fetchBatches = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await auditBatchService.getBatches({
        per_page: 50,
      })

      // Laravel paginator response:
      // { current_page, data: [...], total, ... }
      const records = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : []

      setBatches(records)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Gagal mengambil data blockchain. Periksa koneksi API dan autentikasi.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const transactions = useMemo(() => {
    return batches
      .flatMap((batch) =>
        (batch.blockchain_transactions || []).map((transaction) => ({
          ...transaction,
          batch_number: batch.batch_number,
        }))
      )
      .sort((a, b) => (b.id || 0) - (a.id || 0))
  }, [batches])

  const stats = useMemo(() => ({
    total: transactions.length,
    confirmed: transactions.filter(
      (tx) => tx.status === 'confirmed'
    ).length,
    pending: transactions.filter(
      (tx) => tx.status === 'pending'
    ).length,
    failed: transactions.filter(
      (tx) => tx.status === 'failed'
    ).length,
  }), [transactions])

  const anchoredBatches = useMemo(
    () => batches.filter((batch) => batch.status === 'anchored'),
    [batches]
  )

  const handleVerify = async (batch) => {
    setVerifyingId(batch.id)
    setVerification(null)

    try {
      const result = await auditBatchService.verifyBatch(batch.id)

      // API returns { success, message, data }
      const data = result?.data

      if (!data) {
        throw new Error(
          result?.message || 'Respons verifikasi tidak memiliki data.'
        )
      }

      setVerification({
        ...data,
        batchNumber: batch.batch_number,
      })
    } catch (err) {
      setVerification({
        batchNumber: batch.batch_number,
        verified: false,
        database_integrity: false,
        message:
          err.response?.data?.message ||
          err.message ||
          'Verifikasi blockchain gagal.',
      })
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            SECURITY / BLOCKCHAIN
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Blockchain Monitor
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor audit batches, blockchain transactions, and data integrity.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBatches}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Network Information */}
      <NetworkInfo />

      {/* API Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <CircleAlert
            size={19}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Unable to load blockchain data
            </p>
            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Transactions"
          value={stats.total}
          icon={Activity}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock3}
          color="bg-amber-50 text-amber-600"
        />

        <StatCard
          label="Failed"
          value={stats.failed}
          icon={XCircle}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Verification Result */}
      <VerificationResult verification={verification} />

      {/* Transaction History */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">
              Transaction History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Blockchain transactions associated with the latest 50 audit batches.
            </p>
          </div>

          <ShieldCheck
            className="text-blue-600"
            size={23}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2
              className="animate-spin"
              size={18}
            />
            Loading blockchain data...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Blocks
              className="mx-auto text-slate-300"
              size={35}
            />

            <p className="mt-3 font-semibold text-slate-700">
              No transactions found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Belum ada transaksi blockchain pada batch yang dimuat.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Batch</th>
                  <th className="px-5 py-3">Transaction Hash</th>
                  <th className="px-5 py-3">Block</th>
                  <th className="px-5 py-3">Gas Used</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Confirmed At</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      #{tx.batch_number}
                    </td>

                    <td className="min-w-[180px] px-5 py-4">
                      {tx.transaction_hash ? (
                        <span
                          title={tx.transaction_hash}
                          className="font-mono text-xs text-slate-600"
                        >
                          {shorten(tx.transaction_hash)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {tx.block_number ?? '-'}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {tx.gas_used != null
                        ? formatNumber(tx.gas_used)
                        : '-'}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={tx.status} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {formatDate(tx.confirmed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* On-chain Verification */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                On-chain Verification
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Verify audit batch integrity against blockchain records.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading audit batches...
          </div>
        ) : anchoredBatches.length === 0 ? (
          <div className="p-8 text-center">
            <Database
              className="mx-auto text-slate-300"
              size={32}
            />

            <p className="mt-3 font-medium text-slate-700">
              No anchored batches available
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Belum ada audit batch berstatus anchored yang dapat diverifikasi.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {anchoredBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      Batch #{batch.batch_number}
                    </p>

                    <StatusBadge status={batch.status} />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span>
                      {formatNumber(batch.total_records)} records
                    </span>

                    <span>
                      Sequence: {batch.start_sequence ?? '-'} – {batch.end_sequence ?? '-'}
                    </span>
                  </div>

                  <p
                    title={batch.merkle_root}
                    className="mt-2 break-all font-mono text-xs text-slate-400"
                  >
                    Merkle Root: {shorten(batch.merkle_root, 16, 12)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerify(batch)}
                  disabled={verifyingId !== null}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifyingId === batch.id ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <ShieldCheck size={16} />
                  )}

                  {verifyingId === batch.id
                    ? 'Verifying...'
                    : 'Verify Batch'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="pb-2 text-center text-xs text-slate-400">
        ChainShield Security Platform · Blockchain Audit Monitor
      </p>
    </div>
  )
}
