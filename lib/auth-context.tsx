'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserProfile, UserRole } from './types'

export interface AuthContextType {
  user: UserProfile | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, secretKey: string) => Promise<{ success: boolean; error?: string }>
  quickLogin: (accountKey: 'admin') => void
  logout: () => Promise<void>
  demoAccounts: DemoAccountInfo[]
}

export interface DemoAccountInfo {
  key: 'admin'
  label: string
  role: UserRole
  email: string
  organization: string
  description: string
  clientCode?: string
}

export const DEMO_ACCOUNTS: DemoAccountInfo[] = [
  {
    key: 'admin',
    label: 'Chief Specie Marshal (HQ Admin)',
    role: 'admin',
    email: 'chief.marshal@aurumvault.ch',
    organization: 'AurumVault Federal Operations Command (Geneva HQ)',
    description: 'Full supervisory authority over global air-specie fleet, dispatch creation, seal overrides & quote approvals.',
  },
]

const AUTH_STORAGE_KEY = 'aurumvault_auth_v1'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Verify active SQLite session on mount and continuously validate security restrictions
  useEffect(() => {
    let isMounted = true

    async function checkSession(isInitial = false) {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const data = await res.json()
        if (!isMounted) return

        if (data && data.user) {
          setUser(prev => {
            // Check if restriction properties or identity changed
            const hasChanged =
              !prev ||
              prev.id !== data.user.id ||
              prev.isDashboardLocked !== data.user.isDashboardLocked ||
              prev.isCertificateLocked !== data.user.isCertificateLocked ||
              prev.isSuspended !== data.user.isSuspended ||
              prev.noticeActive !== data.user.noticeActive ||
              prev.noticeTitle !== data.user.noticeTitle ||
              prev.noticeMessage !== data.user.noticeMessage

            if (hasChanged) {
              return data.user
            }
            return prev
          })
        } else {
          // If server reports no active session (e.g. Admin remotely logged out user or suspended account)
          setUser(null)
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY)
          } catch {}
        }
      } catch (err) {
        // Silently tolerate network blips; cookie session remains authoritative
      } finally {
        if (isInitial && isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkSession(true)
    const interval = setInterval(() => checkSession(false), 2000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const persistUser = (profile: UserProfile | null) => {
    setUser(profile)
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {}
  }

  // SQLite-backed authentication with scrypt salted verification
  const login = async (email: string, secretKey: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedKey = secretKey.trim()

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedKey }),
      })

      const data = await res.json()

      if (res.ok && data.success && data.user) {
        persistUser(data.user)
        return { success: true }
      }

      return {
        success: false,
        error: data.error || 'Authentication rejected. Invalid cryptographic passkey.',
      }
    } catch (error) {
      console.error('API login failure:', error)
      return {
        success: false,
        error: 'Security gateway error. Unable to reach authentication server.',
      }
    }
  }

  const quickLogin = async (_accountKey: 'admin') => {
    // Disabled in live environment. Cryptographic passkey authentication required.
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    try {
      localStorage.removeItem('aurumvault_shipments_v1')
      localStorage.removeItem('aurumvault_holdings_v1')
      localStorage.removeItem('aurumvault_quotes_v1')
    } catch {}
    persistUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickLogin,
        logout,
        demoAccounts: DEMO_ACCOUNTS,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
