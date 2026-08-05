import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

type Mode = 'login' | 'register'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [rePassword, setRePassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async () => {
    setError('')
    if (!username.trim() || !password) { setError('请输入账号和密码'); return }
    try {
      setSubmitting(true)
      await login(username.trim(), password)
      navigate('/')
    } catch {
      setError('账号或密码错误')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async () => {
    setError('')
    if (!username.trim()) { setError('请输入账号'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError('请输入正确的邮箱'); return }
    if (password.length < 6) { setError('密码至少 6 位'); return }
    if (password !== rePassword) { setError('两次输入的密码不一致'); return }
    try {
      setSubmitting(true)
      await register({ username: username.trim(), email, password, nickname: nickname.trim() })
      await login(username.trim(), password)
      navigate('/')
    } catch (e: any) {
      const detail = e?.response?.data
      const msg = typeof detail === 'object' && detail !== null
        ? (Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('，') : v}`).join('；'))
        : (detail || '注册失败，请稍后重试')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-6 transition-colors">
          <ArrowLeft size={16} /> 返回首页
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mic size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-primary">{mode === 'login' ? '欢迎回来' : '创建账号'}</h2>
          <p className="text-text-muted mt-1">{mode === 'login' ? '使用账号密码登录' : '注册后即可开始练习'}</p>
        </div>

        <div className="flex gap-1 bg-background rounded-lg p-1 mb-4">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === m ? 'bg-white text-primary shadow-sm' : 'text-text-muted'}`}
            >
              {m === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">账号</label>
              <input type="text" placeholder="请输入账号" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">邮箱</label>
                  <input type="email" placeholder="请输入邮箱" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">昵称</label>
                  <input type="text" placeholder="请输入昵称（选填）" value={nickname} onChange={e => setNickname(e.target.value)} className={inputCls} />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">密码</label>
              <input type="password" placeholder="请输入密码" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">确认密码</label>
                <input type="password" placeholder="请再次输入密码" value={rePassword} onChange={e => setRePassword(e.target.value)} className={inputCls} />
              </div>
            )}

            {error && <p className="text-red-500 text-xs whitespace-pre-wrap">{error}</p>}

            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={submitting}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
