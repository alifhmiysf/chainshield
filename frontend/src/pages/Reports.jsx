import { useState } from 'react'
import {
  FileText,
  FileSpreadsheet,
  Download,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

import { reportService } from '../services/reportService'

const reportCategories = [
  { label: 'Audit Logs', description: 'Recorded user and system activities' },
  { label: 'Security Events', description: 'Detected security-related events' },
  { label: 'Security Alerts', description: 'Alerts and assigned responses' },
  { label: 'Security Findings', description: 'Findings from security assessments' },
  { label: 'Lab Sessions', description: 'Penetration testing session records' },
  { label: 'Blockchain Audit Batches', description: 'Anchored audit batch records' },
  { label: 'Blockchain Transactions', description: 'Blockchain transaction records' },
]

export default function Reports() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const downloadReport = async (format) => {
    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be later than end date.')
      setSuccess('')
      return
    }

    setLoading(format)
    setError('')
    setSuccess('')

    try {
      const filters = {
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      }

      const blob =
        format === 'csv'
          ? await reportService.downloadCsv(filters)
          : await reportService.downloadPdf(filters)

      const contentType =
        format === 'csv' ? 'text/csv;charset=utf-8' : 'application/pdf'

      const file = new Blob([blob], { type: contentType })
      const url = window.URL.createObjectURL(file)
      const link = document.createElement('a')

      link.href = url
      link.download = `chainshield-security-report.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setSuccess(
        `${format.toUpperCase()} report downloaded successfully.`,
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Unable to download ${format.toUpperCase()} report.`,
      )
    } finally {
      setLoading('')
    }
  }

  const resetFilters = () => {
    setStartDate('')
    setEndDate('')
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Security / Reports
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Security Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Generate and export consolidated ChainShield security reports.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">
          <ShieldCheck size={18} className="text-blue-700" />
          <span className="text-sm font-semibold text-blue-800">
            Audit Reporting
          </span>
        </div>
      </div>

      {/* Export Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                CSV Export
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                Spreadsheet Format
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Structured data for analysis and further processing.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3">
              <FileSpreadsheet size={22} className="text-emerald-600" />
            </div>
          </div>

          <button
            onClick={() => downloadReport('csv')}
            disabled={Boolean(loading)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            {loading === 'csv' ? 'Generating CSV...' : 'Export CSV'}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                PDF Export
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                Document Format
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Printable consolidated security audit report.
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3">
              <FileText size={22} className="text-red-600" />
            </div>
          </div>

          <button
            onClick={() => downloadReport('pdf')}
            disabled={Boolean(loading)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            {loading === 'pdf' ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center gap-2">
          <CalendarDays size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Report Period
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label
              htmlFor="report-start-date"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Start Date
            </label>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="report-end-date"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              End Date
            </label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            onClick={resetFilters}
            disabled={Boolean(loading) || (!startDate && !endDate)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Reset filters
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Leave both dates empty to export all available records. The selected
          period applies to all report categories.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Included Categories */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">
            Included Report Categories
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Every export contains the following security data categories.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {reportCategories.map((category, index) => (
            <div
              key={category.label}
              className="flex items-center gap-3 px-5 py-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {category.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {category.description}
                </p>
              </div>

              <CheckCircle2
                size={17}
                className="shrink-0 text-emerald-600"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Information */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-700" />
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Security report integrity
          </p>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Reports are generated from ChainShield records, including audit
            trail and blockchain transaction data. Access is protected by
            the reports.view permission.
          </p>
        </div>
      </div>
    </div>
  )
}
