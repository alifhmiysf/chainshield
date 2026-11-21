
import {
  Activity,
  ShieldAlert,
  FileCheck2,
  Blocks,
  ArrowUpRight,
  ArrowDownRight,
  Clock3,
  CheckCircle2,
} from 'lucide-react'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const activityData = [
  { day: 'Mon', logs: 120, threats: 12 },
  { day: 'Tue', logs: 180, threats: 18 },
  { day: 'Wed', logs: 145, threats: 9 },
  { day: 'Thu', logs: 230, threats: 25 },
  { day: 'Fri', logs: 190, threats: 14 },
  { day: 'Sat', logs: 280, threats: 30 },
  { day: 'Sun', logs: 220, threats: 16 },
]

const stats = [
  {
    label: 'Total Audit Logs',
    value: '12,840',
    change: '+12.8%',
    positive: true,
    icon: Activity,
    color: 'blue',
    description: 'vs. last month',
  },
  {
    label: 'Security Findings',
    value: '24',
    change: '-8.2%',
    positive: true,
    icon: ShieldAlert,
    color: 'amber',
    description: 'vs. last month',
  },
  {
    label: 'Verified Batches',
    value: '186',
    change: '+18.4%',
    positive: true,
    icon: FileCheck2,
    color: 'emerald',
    description: 'vs. last month',
  },
  {
    label: 'Blockchain Anchors',
    value: '182',
    change: '+10.5%',
    positive: true,
    icon: Blocks,
    color: 'violet',
    description: 'vs. last month',
  },
]

const activities = [
  {
    title: 'Audit batch successfully anchored',
    detail: 'Batch #4 · Ethereum Sepolia',
    time: '12 minutes ago',
    status: 'Verified',
  },
  {
    title: 'New security finding detected',
    detail: 'SQL Injection · Target #3',
    time: '28 minutes ago',
    status: 'High',
  },
  {
    title: 'Audit integrity verification completed',
    detail: '186 records checked',
    time: '45 minutes ago',
    status: 'Passed',
  },
  {
    title: 'New laboratory session completed',
    detail: 'Session #2 · Security Assessment',
    time: '1 hour ago',
    status: 'Completed',
  },
]

function StatCard({ item }) {
  const Icon = item.icon

  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{item.label}</p>
        <div className={`rounded-xl p-2.5 ${colors[item.color]}`}>
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900">
            {item.value}
          </h3>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className="flex items-center font-semibold text-emerald-600">
              <ArrowUpRight size={14} />
              {item.change}
            </span>
            <span className="text-slate-400">{item.description}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">
            SECURITY OVERVIEW
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here is what's happening across your security infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600">
          <Clock3 size={15} />
          Last 7 days
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">
                Security Activity
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Audit events and detected threats over time
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Audit Logs
              </span>
              <span className="flex items-center gap-2 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Threats
              </span>
            </div>
          </div>

          <div className="mt-7 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="logGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="logs"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#logGradient)"
                />

                <Area
                  type="monotone"
                  dataKey="threats"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">System Integrity</h3>
          <p className="mt-1 text-xs text-slate-400">
            Current infrastructure status
          </p>

          <div className="mt-7 flex flex-col items-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-emerald-100">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-slate-900">100%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  Healthy
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {[
              'Audit Log Integrity',
              'Blockchain Connection',
              'Security Runner',
            ].map((label) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  {label}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={14} />
                  Operational
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="font-bold text-slate-900">Recent Activities</h3>
            <p className="mt-1 text-xs text-slate-400">
              Latest events recorded by ChainShield
            </p>
          </div>
          <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            View all <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.map((activity) => (
            <div
              key={activity.title}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {activity.title}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {activity.detail}
                </p>
              </div>

              <div className="flex items-center gap-5">
                <span className="text-xs text-slate-400">
                  {activity.time}
                </span>
                <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700">
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        ChainShield Security Platform · Dashboard Preview
      </p>
    </div>
  )
}
