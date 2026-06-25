import { useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Lightbulb, Target } from 'lucide-react'

const scoreLabels: Record<string, string> = {
  confidence: '自信度', structure: '结构清晰度', emotion: '情感感染力',
  logic: '逻辑说服力', language: '语言表达',
}

const scoreColors: Record<string, string> = {
  confidence: 'bg-green-500', structure: 'bg-blue-500',
  emotion: 'bg-purple-500', logic: 'bg-orange-500', language: 'bg-pink-500',
}

const dimensionIcons: Record<string, string> = {
  confidence: '🎯', structure: '📐', emotion: '💖', logic: '🧠', language: '📝',
}

export function ResultPage() {
  const { state } = useLocation()
  const data = state as any

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">暂无评价数据</p>
        <Link to="/" className="text-primary-light text-sm mt-2 inline-block">返回首页</Link>
      </div>
    )
  }

  const scores = data.scores || {}
  const entries = Object.entries(scoreLabels) as [string, string][]

  const maxScore = Math.max(...Object.values(scores).filter(v => typeof v === 'number'), 80)

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-6 transition-colors">
        <ArrowLeft size={16} /> 返回首页
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent-dark rounded-full text-sm font-medium mb-3">
          <Sparkles size={14} /> AI评价报告
        </div>
        <h2 className="text-2xl font-bold text-primary">本次练习评价</h2>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm mb-6">
        <h3 className="font-bold text-text mb-4">五维评分</h3>
        <div className="space-y-3">
          {entries.map(([key, label]) => {
            const score = (scores[key] as number) || 0
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <span>{dimensionIcons[key]}</span>
                    <span className="font-medium text-text">{label}</span>
                  </span>
                  <span className="font-bold text-primary">{score}</span>
                </div>
                <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${scoreColors[key] || 'bg-primary'}`}
                    style={{ width: `${(score / maxScore) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {data.summary && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 mb-6">
          <p className="text-text text-sm leading-relaxed">{data.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {data.strengths?.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-green-500" />
              <h3 className="font-bold text-text text-sm">优点</h3>
            </div>
            <ul className="space-y-2">
              {data.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.improvements?.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-orange-500" />
              <h3 className="font-bold text-text text-sm">改进点</h3>
            </div>
            <ul className="space-y-2">
              {data.improvements.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text">
                  <span className="text-orange-500 mt-0.5 shrink-0">!</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {data.tips?.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm mb-6">
          <h3 className="font-bold text-text text-sm mb-3">练习建议</h3>
          <div className="space-y-2">
            {data.tips.map((t: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link to="/" className="block w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors text-center shadow-sm">
        继续练习
      </Link>
    </div>
  )
}
