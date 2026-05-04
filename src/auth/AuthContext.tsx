import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthUser {
  email: string
  name: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => boolean
  logout: () => void
  isLoggedIn: boolean
  error: string
}

const AuthContext = createContext<AuthContextType>(null!)
export function useAuth() { return useContext(AuthContext) }

const USERS: Record<string, { name: string; pass: string }> = {
  'clawdiustheai@gmail.com': { name: 'Balázs', pass: 'clawdius2024' },
  'kolesbalazs93@gmail.com': { name: 'Köles Balázs', pass: 'clawdius2024' },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('clawdius-auth-user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { localStorage.removeItem('clawdius-auth-user') }
    }
  }, [])

  function login(email: string, password: string): boolean {
    setError('')
    const u = USERS[email.toLowerCase().trim()]
    if (!u) {
      setError('❌ Ismeretlen email cím')
      return false
    }
    if (u.pass !== password) {
      setError('❌ Hibás jelszó')
      return false
    }
    const authUser: AuthUser = { email: email.toLowerCase().trim(), name: u.name }
    localStorage.setItem('clawdius-auth-user', JSON.stringify(authUser))
    setUser(authUser)
    return true
  }

  function logout() {
    localStorage.removeItem('clawdius-auth-user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, error }}>
      {children}
    </AuthContext.Provider>
  )
}
