import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    if (!phone || phone.length !== 11) { setError('请输入正确的手机号'); return }
    try {
      await login(phone)
      navigate('/')
    } catch { setError('登录失败，请稍后重试') }
  }

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
          <h2 className="text-2xl font-bold text-primary">欢迎回来</h2>
          <p className="text-text-muted mt-1">输入手机号即可开始练习</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">手机号</label>
              <input
                type="tel" placeholder="请输入11位手机号" maxLength={11}
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              onClick={handleLogin}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors shadow-sm"
            >
              登录
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
