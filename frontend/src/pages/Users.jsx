
import { useCallback, useEffect, useState } from 'react'
import {
  Users as UsersIcon,
  Search,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  UserPlus,
  Mail,
  AlertCircle,
} from 'lucide-react'

import { userService } from '../services/userService'

function RoleBadge({ role }) {
  const styles = {
    'super-admin': 'bg-violet-50 text-violet-700',
    'security-analyst': 'bg-blue-50 text-blue-700',
    'penetration-tester': 'bg-orange-50 text-orange-700',
    auditor: 'bg-emerald-50 text-emerald-700',
    user: 'bg-slate-100 text-slate-600',
  }

  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
      styles[role?.slug] || 'bg-slate-100 text-slate-600'
    }`}>
      {role?.name || role?.slug || 'No role'}
    </span>
  )
}

function UserModal({ roles, onClose, onSubmit, saving }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  })

  const [error, setError] = useState('')

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      await onSubmit(form)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to create user. Please check the input.'
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              User Management
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Create New User
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={255}
              placeholder="Enter full name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="user@example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Assigned Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.slug}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

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
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={16} />
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  })

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await userService.getUsers({
        page,
        search: search.trim() || undefined,
      })

      setUsers(result.data || [])
      setPagination({
        current_page: result.current_page || 1,
        last_page: result.last_page || 1,
        total: result.total || 0,
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load users. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [page, search])

  const loadRoles = useCallback(async () => {
    try {
      const result = await userService.getRoles()
      setRoles(result)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load available roles.'
      )
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  async function handleCreateUser(form) {
    setSaving(true)

    try {
      await userService.createUser(form)
      setShowModal(false)
      setMessage('User created successfully.')
      setPage(1)
      setSearch('')
      await loadUsers()
    } finally {
      setSaving(false)
    }
  }

  async function handleRoleChange(userId, role) {
    setUpdatingId(userId)
    setMessage('')
    setError('')

    try {
      await userService.updateRole(userId, role)
      setMessage('User role updated successfully.')
      await loadUsers()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update user role.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
    loadUsers()
  }

  const superAdmins = users.filter((user) =>
    user.roles?.some((role) => role.slug === 'super-admin')
  ).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <Shield size={16} />
            Administration
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            User Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage system users and their access roles.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Users
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {pagination.total}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <UsersIcon size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Super Administrators on This Page
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {superAdmins}
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Shield size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">System Users</h2>
            <p className="mt-1 text-xs text-slate-500">
              Search users and manage assigned roles.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch('')
                setPage(1)
                setMessage('')
              }}
              title="Refresh"
              className="rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">User</th>
                <th className="px-5 py-4 font-semibold">Assigned Role</th>
                <th className="px-5 py-4 font-semibold">Joined</th>
                <th className="px-5 py-4 font-semibold">Change Role</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-sm text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {user.name}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={12} />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles?.length ? (
                          user.roles.map((role) => (
                            <RoleBadge key={role.id} role={role} />
                          ))
                        ) : (
                          <RoleBadge />
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('id-ID')
                        : '-'}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={user.roles?.[0]?.slug || ''}
                        disabled={
                          updatingId === user.id ||
                          !roles.length
                        }
                        onChange={(event) =>
                          handleRoleChange(user.id, event.target.value)
                        }
                        className="max-w-[190px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="" disabled>
                          Select role
                        </option>

                        {roles.map((role) => (
                          <option key={role.id} value={role.slug}>
                            {role.name}
                          </option>
                        ))}
                      </select>

                      {updatingId === user.id && (
                        <p className="mt-1 text-xs text-blue-600">
                          Updating...
                        </p>
                      )}
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
            Showing page {pagination.current_page} of {pagination.last_page}
            {' '}({pagination.total} users)
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <button
              disabled={page >= pagination.last_page || loading}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <UserModal
          roles={roles}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateUser}
          saving={saving}
        />
      )}
    </div>
  )
}
