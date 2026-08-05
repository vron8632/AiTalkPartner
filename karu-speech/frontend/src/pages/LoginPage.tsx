import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'

type Mode = 'login' | 'register' | 'reset'
type LoginTab = 'account' | 'email'

const inputCls = 'w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, register, loginWithToken } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [loginTab, setLoginTab] = useState<LoginTab>('account')

  // 通用字段
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 账号登录 / 注册
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [rePassword, setRePassword] = useState('')

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const startCountdown = () => {
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1 && timerRef.current) clearInterval(timerRef.current)
        return c - 1
      })
    }, 1000)
  }

  const sendCode = async (purpose: string) => {
    setError('')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError('请输入正确的邮箱'); return }
    try {
      await api.post('/e_mail/send-code/', { email, purpose })
      startCountdown()
      setError('')
      alert('验证码已发送，请查收邮箱（2分钟内有效）')
    } catch (e: any) {
      setError(e?.response?.data?.detail || '验证码发送失败')
    }
  }

  const handleLogin = async () => {
    setError('')
    if (loginTab === 'account') {
      if (!username.trim() || !password) { setError('请输入账号和密码'); return }
      try {
        setSubmitting(true)
        await login(username.trim(), password)
        navigate('/')
      } catch { setError('账号或密码错误') } finally { setSubmitting(false) }
    } else {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError('请输入正确的邮箱'); return }
      if (!code) { setError('请输入验证码'); return }
      try {
        setSubmitting(true)
        const r = await api.post('/e_mail/login/', { email, code })
        await loginWithToken(r.data.access)
        navigate('/')
      } catch (e: any) {
        setError(e?.response?.data?.detail || '登录失败')
      } finally { setSubmitting(false) }
    }
  }

  const handleRegister = async () => {
    setError('')
    if (!username.trim()) { setError('请输入账号'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError('请输入正确的邮箱'); return }
    if (!code) { setError('请输入邮箱验证码'); return }
    if (password.length < 6) { setError('密码至少 6 位'); return }
    if (password !== rePassword) { setError('两次输入的密码不一致'); return }
    try {
      setSubmitting(true)
      await register({ username: username.trim(), email, password, nickname: nickname.trim(), emailVerifyCode: code })
      setError('')
      alert('注册成功，请登录')
      setMode('login'); setLoginTab('account')
    } catch (e: any) {
      const detail = e?.response?.data
      const msg = typeof detail === 'object' && detail !== null
        ? (Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('，') : v}`).join('；'))
        : (detail || '注册失败，请稍后重试')
      setError(msg)
    } finally { setSubmitting(false) }
  }

  const handleReset = async () => {
    setError('')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError('请输入正确的邮箱'); return }
    if (!code) { setError('请输入验证码'); return }
    if (password.length < 6) { setError('新密码至少 6 位'); return }
    if (password !== rePassword) { setError('两次输入的密码不一致'); return }
    try {
      setSubmitting(true)
      await api.post('/e_mail/reset-password/', { email, code, new_password: password })
      setError('')
      alert('密码已重置，请使用新密码登录')
      setMode('login'); setLoginTab('account')
    } catch (e: any) {
      setError(e?.response?.data?.detail || '重置失败，请稍后重试')
    } finally { setSubmitting(false) }
  }

  const switchMode = (m: Mode) => { setMode(m); setError('') }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-6 transition-colors">
          <ArrowLeft size={16} /> 返回首页
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mic size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-primary">
            {mode === 'login' ? '欢迎回来' : mode === 'register' ? '创建账号' : '找回密码'}
          </h2>
          <p className="text-text-muted mt-1">
            {mode === 'login' ? '登录后即可开始练习' : mode === 'register' ? '注册后即可开始练习' : '通过邮箱验证码重置密码'}
          </p>
        </div>

        <div className="flex gap-1 bg-background rounded-lg p-1 mb-4">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === m ? 'bg-white text-primary shadow-sm' : 'text-text-muted'}`}>
              {m === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="space-y-4">
            {mode === 'login' && (
              <div className="flex gap-1 bg-background rounded-lg p-1">
                {([['account', '账号登录'], ['email', '验证码登录']] as [LoginTab, string][]).map(([tab, label]) => (
                  <button key={tab} onClick={() => { setLoginTab(tab); setError('') }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${loginTab === tab ? 'bg-white text-primary shadow-sm' : 'text-text-muted'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {mode === 'login' && loginTab === 'account' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">账号</label>
                  <input type="text" placeholder="请输入账号" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">密码</label>
                  <input type="password" placeholder="请输入密码" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
                </div>
                <div className="text-right">
                  <button onClick={() => { switchMode('reset'); setLoginTab('account') }} className="text-xs text-primary-light hover:underline">忘记密码？</button>
                </div>
              </>
            )}

            {(mode === 'register' || mode === 'reset' || (mode === 'login' && loginTab === 'email')) && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  {mode === 'register' ? '邮箱' : mode === 'reset' ? '注册邮箱' : '邮箱'}
                </label>
                <div className="flex gap-2">
                  <input type="email" placeholder="请输入邮箱" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                  <button onClick={() => sendCode(mode === 'register' ? 'verify' : mode === 'reset' ? 'reset_password' : 'login')}
                    disabled={countdown > 0}
                    className="shrink-0 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 disabled:opacity-50">
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'register' || mode === 'reset' || (mode === 'login' && loginTab === 'email')) && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">邮箱验证码</label>
                <input type="text" placeholder="请输入6位验证码" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className={inputCls} />
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">账号</label>
                  <input type="text" placeholder="请输入账号" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">昵称（选填）</label>
                  <input type="text" placeholder="请输入昵称" value={nickname} onChange={e => setNickname(e.target.value)} className={inputCls} />
                </div>
              </>
            )}

            {(mode === 'register' || mode === 'reset') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">{mode === 'reset' ? '新密码' : '密码'}</label>
                  <input type="password" placeholder="请输入密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">确认密码</label>
                  <input type="password" placeholder="请再次输入密码" value={rePassword} onChange={e => setRePassword(e.target.value)} className={inputCls} />
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-xs whitespace-pre-wrap">{error}</p>}

            <button
              onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleReset}
              disabled={submitting}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? '处理中...' : mode === 'login' ? '登录' : mode === 'register' ? '注册' : '重置密码'}
            </button>

            {mode === 'reset' && (
              <button onClick={() => switchMode('login')} className="w-full text-center text-xs text-text-muted hover:text-text">
                返回登录
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
