import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AuditLogs from './pages/AuditLogs'
import AuditBatches from './pages/AuditBatches'
import Sidebar from './layouts/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import SecurityEvents from './pages/SecurityEvents'
import SecurityAlerts from './pages/SecurityAlerts'
import SecurityTesting from './pages/SecurityTesting'
import LabSessions from './pages/LabSessions'
import Reports from './pages/Reports'
import Blockchain from './pages/Blockchain'
import Users from './pages/Users'

import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">
            Checking authentication...
          </p>
        </div>
      </div>
    )
  }

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace />
}

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header />

        <div className="p-5 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            {/* Audit */}
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/audit-batches" element={<AuditBatches />} />

            {/* Blockchain */}
            <Route path="/blockchain" element={<Blockchain />} />

            {/* Security */}
            <Route path="/security-events" element={<SecurityEvents />} />
            <Route path="/security-alerts" element={<SecurityAlerts />} />
            <Route path="/security-testing" element={<SecurityTesting />} />

            {/* Lab */}
            <Route path="/lab-sessions" element={<LabSessions />} />

            {/* Reporting */}
            <Route path="/reports" element={<Reports />} />

            {/* User Management */}
            <Route path="/users" element={<Users />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
