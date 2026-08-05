import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../lib/api'

interface User {
  id: number
  username: string
  email: string
  nickname: string | null
  avatar_url: string | null
  phone: string | null
  is_member: boolean
  member_expire: string | null
  is_staff: boolean
  is_superuser: boolean
}

interface RegisterData {
  username: string
  email: string
  password: string
  nickname: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.get('/auth/users/me/')
      .then(r => setUser(r.data))
      .catch(() => { localStorage.removeItem('token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (username: string, password: string) => {
    const r = await api.post('/auth/jwt/create/', { username, password })
    localStorage.setItem('token', r.data.access)
    setToken(r.data.access)
    const me = await api.get('/auth/users/me/')
    setUser(me.data)
  }

  const register = async (data: RegisterData) => {
    await api.post('/auth/users/', {
      username: data.username,
      email: data.email,
      password: data.password,
      re_password: data.password,
      nickname: data.nickname,
    })
  }

  const refreshUser = async () => {
    const me = await api.get('/auth/users/me/')
    setUser(me.data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, refreshUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
