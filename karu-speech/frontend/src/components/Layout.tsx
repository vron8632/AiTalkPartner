import { Link, useLocation } from 'react-router-dom'
import { BookOpen, User, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const navLinks = [
    { to: '/', label: '课程', icon: BookOpen },
    { to: '/profile', label: '我的', icon: User },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-primary font-bold text-sm">
              K
            </div>
            <span className="font-bold text-base">卡耐基魅力演说</span>
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  location.pathname === to
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}

            {user && (
              <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors ml-1">
                <LogOut size={14} />
                <span className="hidden sm:inline">退出</span>
              </button>
            )}

            <a href="/admin/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors ml-1 border-l border-white/10 pl-3"
            >
              <Shield size={14} />
              <span className="hidden sm:inline">后台管理</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 md:px-6">
        {children}
      </main>
    </div>
  )
}
