import { User, BarChart3, Clock, Award, Mic, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const stats = [
  { label: '练习次数', value: '--', icon: Mic, color: 'text-primary bg-primary/5' },
  { label: '总时长', value: '-- 分钟', icon: Clock, color: 'text-accent bg-accent/5' },
  { label: '最高分', value: '--', icon: Award, color: 'text-green-600 bg-green-50' },
]

export function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <User size={48} className="mx-auto text-text-muted mb-4" />
          <h2 className="text-xl font-bold text-text mb-2">未登录</h2>
          <p className="text-text-muted mb-6">登录后可查看练习数据和进度</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
            <LogIn size={16} /> 去登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-surface rounded-xl border border-border p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center border-2 border-primary/10">
            <User size={32} className="text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text">{user.nickname || user.phone}</h2>
            <p className="text-sm text-text-muted">
              {user.is_member ? '🎯 会员' : '📖 免费用户'}
              {user.phone && ` · ${user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface rounded-xl border border-border p-4 text-center shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div className="text-lg font-bold text-text">{stat.value}</div>
            <div className="text-xs text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 text-center shadow-sm">
        <BarChart3 size={32} className="mx-auto text-text-muted mb-2" />
        <p className="text-text-muted text-sm">练习趋势将在你完成首次练习后展示</p>
      </div>
    </div>
  )
}
