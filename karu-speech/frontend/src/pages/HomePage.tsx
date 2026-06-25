import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Layout, Heart, Zap, Star, Sparkles, Lock, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'

const levelMeta = [
  { title: '破冰', subtitle: '克服恐惧，建立自信', color: 'bg-green-500' },
  { title: '结构', subtitle: '黄金三段论', color: 'bg-blue-500' },
  { title: '情感', subtitle: '故事力与感染力', color: 'bg-purple-500' },
  { title: '说服', subtitle: '观点植入与即兴', color: 'bg-orange-500' },
  { title: '魅力', subtitle: '综合进阶与应用', color: 'bg-red-500' },
]

const levelIcons = [Mic, Layout, Heart, Zap, Star]

interface Lesson {
  id: number
  level_id: number
  lesson_id: number
  title: string
  description: string
  is_free: boolean
  progress_status: string
  duration_goal: number
}

export function HomePage() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    api.get('/lessons/progress/')
      .then(r => setLessons(r.data))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false))
  }, [user])

  const grouped = lessons.reduce((acc, l) => {
    const key = l.level_id
    if (!acc[key]) acc[key] = []
    acc[key].push(l)
    return acc
  }, {} as Record<number, Lesson[]>)

  return (
    <div>
      <div className="text-center mb-10 pt-4 md:pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent-dark rounded-full text-sm font-medium mb-4">
          <Sparkles size={14} />
          卡耐基经典五阶训练法
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-primary">
          让你的声音被世界听见
        </h2>
        <p className="text-text-muted mt-3 max-w-md mx-auto text-base leading-relaxed">
          从不敢开口到魅力演说，系统化口才训练，AI智能评分，见证每一次进步
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-border/50 rounded-xl animate-pulse" />)}
        </div>
      ) : !user ? (
        <div className="text-center py-20">
          <p className="text-text-muted mb-4">登录后查看课程</p>
          <Link to="/login" className="inline-flex px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium">去登录</Link>
        </div>
      ) : (
        Object.entries(grouped).map(([levelId, levelLessons]) => {
          const meta = levelMeta[Number(levelId) - 1]
          const Icon = levelIcons[Number(levelId) - 1]
          const done = levelLessons.filter(l => l.progress_status === 'completed').length
          const total = levelLessons.length

          return (
            <div key={levelId} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 ${meta.color} rounded-lg flex items-center justify-center text-white shadow-sm`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-text">L{levelId} · {meta.title}</h3>
                  <p className="text-xs text-text-muted">{meta.subtitle}</p>
                </div>
                <div className="text-xs text-text-muted">{done}/{total} 已完成</div>
              </div>

              <div className="space-y-2">
                {levelLessons.map((lesson, idx) => {
                  const prevDone = idx === 0 || levelLessons[idx - 1].progress_status === 'completed'
                  const isLocked = lesson.progress_status === 'locked'
                  const isCompleted = lesson.progress_status === 'completed'
                  const canAccess = !isLocked

                  if (!canAccess) {
                    return (
                      <div key={lesson.id} className="flex items-center gap-3 p-4 bg-surface/50 rounded-xl border border-border opacity-50 cursor-not-allowed">
                        <Lock size={18} className="text-text-muted" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-text">{lesson.title}</div>
                          <div className="text-xs text-text-muted">
                            {lesson.is_free ? '完成前置课程后解锁' : '开通会员后解锁'} · {lesson.duration_goal}秒
                          </div>
                        </div>
                        {!lesson.is_free && <span className="text-xs text-accent font-medium">会员</span>}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={lesson.id}
                      to={`/practice/${lesson.id}`}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                        isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-surface border-border hover:border-accent/30 hover:shadow-sm'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={18} className="text-green-500 shrink-0" />
                      ) : (
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                          lesson.is_free ? 'border-primary' : 'border-accent'
                        }`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text truncate">
                          {lesson.title}
                        </div>
                        <div className="text-xs text-text-muted truncate">{lesson.description || `${lesson.duration_goal}秒练习`}</div>
                      </div>
                      {!lesson.is_free && (
                        <span className="text-xs text-accent font-medium shrink-0">会员</span>
                      )}
                      {isCompleted && <span className="text-xs text-green-600 font-medium shrink-0">已完成</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
