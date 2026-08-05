import { useState, useEffect, useRef } from 'react'
import { User, BarChart3, Clock, Award, Mic, LogIn, ChevronRight, Star, Camera, Pencil, Loader2 } from 'lucide-react'
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

interface OrderItem {
  id: number
  order_no: string
  plan_type: string
  amount_cents: number
  status: string
  channel: string | null
  paid_at: string | null
  created_at: string
}

const planTypeLabels: Record<string, string> = {
  monthly: '月度会员', quarterly: '季度会员', yearly: '年度会员',
}

const orderStatusLabels: Record<string, { text: string; cls: string }> = {
  pending: { text: '待支付', cls: 'text-accent-dark bg-accent/10' },
  paid: { text: '已支付', cls: 'text-green-600 bg-green-50' },
  expired: { text: '已过期', cls: 'text-text-muted bg-background' },
  refunded: { text: '已退款', cls: 'text-red-500 bg-red-50' },
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [records, setRecords] = useState<PracticeItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [editingNick, setEditingNick] = useState(false)
  const [nickInput, setNickInput] = useState('')
  const [savingNick, setSavingNick] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pwdCode, setPwdCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [reNewPassword, setReNewPassword] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdCountdown, setPwdCountdown] = useState(0)
  const [savingPwd, setSavingPwd] = useState(false)
  const [showPwdForm, setShowPwdForm] = useState(false)
  const pwdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (pwdTimerRef.current) clearInterval(pwdTimerRef.current) }, [])

  const handleSendPwdCode = async () => {
    setPwdError('')
    if (!user?.email) { setPwdError('当前账号未绑定邮箱'); return }
    try {
      await api.post('/e_mail/send-code/', { email: user.email, purpose: 'change_password' })
      setPwdCountdown(60)
      pwdTimerRef.current = setInterval(() => {
        setPwdCountdown(c => {
          if (c <= 1 && pwdTimerRef.current) clearInterval(pwdTimerRef.current)
          return c - 1
        })
      }, 1000)
      alert('验证码已发送，请查收邮箱（2分钟内有效）')
    } catch (e: any) {
      setPwdError(e?.response?.data?.detail || '验证码发送失败')
    }
  }

  const handleChangePassword = async () => {
    setPwdError('')
    if (!pwdCode) { setPwdError('请输入验证码'); return }
    if (newPassword.length < 6) { setPwdError('新密码至少 6 位'); return }
    if (newPassword !== reNewPassword) { setPwdError('两次输入的密码不一致'); return }
    try {
      setSavingPwd(true)
      await api.post('/e_mail/change-password/', { code: pwdCode, new_password: newPassword })
      setPwdCode(''); setNewPassword(''); setReNewPassword('')
      alert('密码修改成功')
    } catch (e: any) {
      setPwdError(e?.response?.data?.detail || '修改失败，请稍后重试')
    } finally {
      setSavingPwd(false)
    }
  }

  useEffect(() => {
    if (!user) { setLoading(false); return }
    api.get('/practice/records/').then(r => {
      const data = (r.data as any).results || r.data || []
      setRecords(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user) { setLoadingOrders(false); return }
    api.get('/payment/orders/').then(r => {
      const data = (r.data as any).results || r.data || []
      setOrders(data)
    }).catch(() => {}).finally(() => setLoadingOrders(false))
  }, [user])

  const startEditNick = () => {
    setNickInput(user?.nickname || '')
    setEditingNick(true)
  }

  const saveNick = async () => {
    if (!user) return
    const nickname = nickInput.trim()
    if (!nickname) { alert('昵称不能为空'); return }
    try {
      setSavingNick(true)
      await api.patch('/auth/users/me/', { nickname })
      await refreshUser()
      setEditingNick(false)
    } catch {
      alert('保存失败，请稍后重试')
    } finally {
      setSavingNick(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    try {
      setUploadingAvatar(true)
      await api.post('/auth/avatar/', form)
      await refreshUser()
    } catch {
      alert('头像上传失败，请重试')
    } finally {
      setUploadingAvatar(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

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
          <div className="relative">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border-2 border-primary/10 bg-primary/5 hover:opacity-80 transition-opacity"
              title="点击更换头像"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-primary" />
              )}
              {uploadingAvatar && <Loader2 size={20} className="absolute text-white animate-spin" />}
            </button>
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow">
              <Camera size={12} />
            </span>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1">
            {editingNick ? (
              <div className="flex items-center gap-2">
                <input
                  value={nickInput}
                  onChange={e => setNickInput(e.target.value)}
                  maxLength={20}
                  autoFocus
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-lg font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button onClick={saveNick} disabled={savingNick} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium disabled:opacity-50">
                  {savingNick ? '保存中' : '保存'}
                </button>
                <button onClick={() => setEditingNick(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs text-text-muted">取消</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text">{user.nickname || user.username}</h2>
                <button onClick={startEditNick} className="text-text-muted hover:text-text transition-colors" title="修改昵称">
                  <Pencil size={14} />
                </button>
              </div>
            )}
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

        <h3 className="font-bold text-text mb-3 mt-8">订单记录</h3>
        {loadingOrders ? (
          <div className="h-24 bg-border/50 rounded-xl animate-pulse" />
        ) : orders.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-6 text-center shadow-sm">
            <Award size={32} className="mx-auto text-text-muted mb-2" />
            <p className="text-text-muted text-sm">暂无订单记录</p>
            <Link to="/" className="inline-block mt-3 text-sm text-primary-light font-medium">去开通会员 →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(o => {
              const st = orderStatusLabels[o.status] || { text: o.status, cls: 'text-text-muted bg-background' }
              return (
                <div key={o.id} className="bg-surface rounded-xl border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-text">
                      {planTypeLabels[o.plan_type] || o.plan_type}
                      <span className="text-text-muted text-xs ml-2">¥{(o.amount_cents / 100).toFixed(2)}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="font-mono">{o.order_no}</span>
                    <span>{new Date(o.paid_at || o.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <h3 className="font-bold text-text mb-3 mt-8">账号安全</h3>
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          {!user.email ? (
            <p className="text-sm text-text-muted">当前账号未绑定邮箱，暂无法通过邮箱验证码修改密码。</p>
          ) : (
            <>
              <button onClick={() => setShowPwdForm(v => !v)} className="w-full py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                {showPwdForm ? '收起修改密码' : '修改密码'}
              </button>
              {showPwdForm && (
                <div className="space-y-4 mt-4">
              <div className="text-sm text-text-muted">通过邮箱验证码修改密码（验证码发送至 <span className="text-text">{user.email}</span>）</div>
              <div className="flex gap-2">
                <input
                  type="text" placeholder="请输入邮箱验证码" maxLength={6}
                  value={pwdCode} onChange={e => setPwdCode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button onClick={handleSendPwdCode} disabled={pwdCountdown > 0}
                  className="shrink-0 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 disabled:opacity-50">
                  {pwdCountdown > 0 ? `${pwdCountdown}s` : '获取验证码'}
                </button>
              </div>
              <input
                type="password" placeholder="新密码（至少6位）"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="password" placeholder="确认新密码"
                value={reNewPassword} onChange={e => setReNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {pwdError && <p className="text-red-500 text-xs">{pwdError}</p>}
              <button onClick={handleChangePassword} disabled={savingPwd}
                className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50">
                {savingPwd ? '提交中...' : '确认修改'}
              </button>
                </div>
              )}
            </>
          )}
        </div>
      </>
    )}
    </div>
  )
}
