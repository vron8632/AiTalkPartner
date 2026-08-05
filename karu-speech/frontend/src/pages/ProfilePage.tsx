import { useState, useEffect } from 'react'
import { User, BarChart3, Clock, Award, Mic, LogIn, ChevronRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface PracticeItem {
  id: number
  lesson_id: number
  lesson_title: string
  lesson_level_id: number
  lesson_lesson_id: number
  duration_sec: number
  scores: { [key: string]: number } | null
  created_at: string
}

export function ProfilePage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<PracticeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    api.get('/practice/records/').then(r => {
      const data = (r.data as any).results || r.data || []
      setRecords(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  const totalPractices = records.length
  const totalDuration = records.reduce((s, r) => s + (r.duration_sec || 0), 0)
  const scoredRecords = records.filter(r => r.scores)
  const bestScore = scoredRecords.length > 0
    ? Math.max(...scoredRecords.map(r => Math.max(...Object.values(r.scores || {}) as number[])))
    : null

  const formatDuration = (sec: number) => sec >= 60 ? `${Math.round(sec / 60)}分` : `${sec}秒`

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
            <h2 className="text-xl font-bold text-text">{user.nickname || user.username}</h2>
            <p className="text-sm text-text-muted">
              {user.is_member ? '🎯 会员' : '📖 免费用户'}
              {user.phone && ` · ${user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-border/50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface rounded-xl border border-border p-4 text-center shadow-sm">
              <Mic size={18} className="mx-auto text-primary mb-1" />
              <div className="text-xl font-bold text-text">{totalPractices}</div>
              <div className="text-xs text-text-muted">练习次数</div>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center shadow-sm">
              <Clock size={18} className="mx-auto text-accent mb-1" />
              <div className="text-xl font-bold text-text">{formatDuration(totalDuration)}</div>
              <div className="text-xs text-text-muted">总时长</div>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center shadow-sm">
              <Award size={18} className="mx-auto text-green-600 mb-1" />
              <div className="text-xl font-bold text-text">{bestScore ?? '--'}</div>
              <div className="text-xs text-text-muted">最高分</div>
            </div>
          </div>

          <h3 className="font-bold text-text mb-3">练习记录</h3>
          {records.length === 0 ? (
            <div className="bg-surface rounded-xl border border-border p-6 text-center shadow-sm">
              <BarChart3 size={32} className="mx-auto text-text-muted mb-2" />
              <p className="text-text-muted text-sm">还没有练习记录，去完成首次练习吧</p>
              <Link to="/" className="inline-block mt-3 text-sm text-primary-light font-medium">去课程 →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {records.slice(0, 10).map(r => {
                const vals = r.scores ? Object.values(r.scores) as number[] : []
                const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
                return (
                  <Link key={r.id} to={`/result/${r.id}`} className="block bg-surface rounded-xl border border-border p-4 hover:border-accent/30 transition-colors shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-text">L{r.lesson_level_id} · {r.lesson_title || `第${r.lesson_lesson_id}课`}</div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        {avg !== null && <span className="flex items-center gap-0.5"><Star size={12} className="text-accent" />{avg}</span>}
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
