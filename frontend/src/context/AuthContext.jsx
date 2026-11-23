
import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(
    () => localStorage.getItem('chainshield_token'),
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        setUser(response.data.data.user)
      } catch {
        localStorage.removeItem('chainshield_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [token])

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials)

    const { user: authenticatedUser, token: accessToken } =
      response.data.data

    localStorage.setItem('chainshield_token', accessToken)
    setToken(accessToken)
    setUser(authenticatedUser)

    return authenticatedUser
  }

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout')
      }
    } finally {
      localStorage.removeItem('chainshield_token')
      setToken(null)
      setUser(null)
    }
  }

  const hasRole = (roleSlug) => {
    return user?.roles?.some((role) => role.slug === roleSlug) ?? false
  }

  const hasPermission = (permissionSlug) => {
  // Super Admin memiliki akses penuh.
  if (user?.roles?.some((role) => role.slug === 'super-admin')) {
    return true
  }

  return (
    user?.permissions?.some(
      (permission) => permission.slug === permissionSlug,
    ) ?? false
  )
}

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        hasRole,
        hasPermission,
        isAuthenticated: Boolean(token && user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
