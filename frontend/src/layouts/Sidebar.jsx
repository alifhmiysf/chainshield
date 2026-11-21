
import {
  LayoutDashboard,
  FileSearch,
  Layers3,
  ShieldCheck,
  Bug,
  Users,
  Shield,
  ChevronLeft,
  Activity,
  Bell,
  FileBarChart,
  LogOut,
} from 'lucide-react'

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navigation = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/',
        permission: 'dashboard.view',
      },
    ],
  },
  {
    title: 'AUDIT & SECURITY',
    items: [
      {
        label: 'Audit Logs',
        icon: FileSearch,
        path: '/audit-logs',
        permission: 'audit-logs.view',
      },
      {
        label: 'Audit Batches',
        icon: Layers3,
        path: '/audit-batches',
        permission: 'blockchain.view',
      },
      {
        label: 'Blockchain',
        icon: ShieldCheck,
        path: '/blockchain',
        permission: 'blockchain.view',
      },
      {
        label: 'Security Testing',
        icon: Bug,
        path: '/security-testing',
        permission: 'lab.view',
      },
      {
        label: 'Security Events',
        icon: Activity,
        path: '/security-events',
        permission: 'security-events.view',
      },
      {
        label: 'Security Alerts',
        icon: Bell,
        path: '/security-alerts',
        permission: 'security-alerts.manage',
      },
      {
        label: 'Reports',
        icon: FileBarChart,
        path: '/reports',
        permission: 'reports.view',
      },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      {
        label: 'Users',
        icon: Users,
        path: '/users',
        permission: 'users.manage',
      },
    ],
  },
]

export default function Sidebar() {
  const { user, hasPermission, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      // AuthContext clears the local session even if the API fails.
      navigate('/login', { replace: true })
    }
  }

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
          <Shield size={22} strokeWidth={2.4} />
        </div>

        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
            Chain<span className="text-blue-600">Shield</span>
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Security Platform
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-7">
        {navigation.map((group) => {
          const visibleItems = group.items.filter((item) =>
            hasPermission(item.permission),
          )

          if (visibleItems.length === 0) return null

          return (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
                {group.title}
              </p>

              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={18} />
                          <span>{item.label}</span>

                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Shield size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">
              {user?.name || 'ChainShield User'}
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {user?.email || 'Authenticated'}
            </p>
          </div>

          <ChevronLeft size={16} className="text-slate-400" />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          Sign out
        </button>

        <p className="mt-3 text-center text-[10px] text-slate-400">
          ChainShield Version 1.0.0
        </p>
      </div>
    </aside>
  )
}
