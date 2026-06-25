import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Mic, CheckCircle, Play, Loader2, BookOpen, Headphones, Radio, Sparkles } from 'lucide-react'
import api from '../lib/api'
import { AudioRecorder } from '../components/AudioRecorder'

interface LessonDetail {
  id: number; level_id: number; lesson_id: number
  title: string; description: string; exercise_type: string
  duration_goal: number; is_free: boolean
  theory_content: string; example_text: string
}

const exerciseLabels: Record<string, string> = {
  speech: '有准备演讲', impromptu: '即兴表达', story: '故事讲述', debate: '辩论/说服',
}

type Step = 'theory' | 'example' | 'practice' | 'done'

const steps: { key: Step; icon: typeof BookOpen; label: string }[] = [
  { key: 'theory', icon: BookOpen, label: '理论学习' },
  { key: 'example', icon: Headphones, label: '范例跟读' },
  { key: 'practice', icon: Radio, label: '自主练习' },
  { key: 'done', icon: Sparkles, label: '完成' },
]

export function PracticePage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [step, setStep] = useState<Step>('theory')
  const [exampleRec, setExampleRec] = useState<{ id: number; url: string } | null>(null)
  const [practiceRec, setPracticeRec] = useState<{ id: number; url: string } | null>(null)
  const [evaluating, setEvaluating] = useState(false)

  useEffect(() => {
    api.get(`/lessons/${lessonId}/`).then(r => setLesson(r.data)).catch(() => {})
  }, [lessonId])

  const handleEvaluate = async () => {
    if (!practiceRec) return
    setEvaluating(true)
    try {
      const r = await api.post(`/practice/evaluate/${practiceRec.id}/`)
      navigate(`/result/${practiceRec.id}`, { state: r.data })
    } catch {
      alert('评价失败，请稍后重试')
      setEvaluating(false)
    }
  }

  if (!lesson) {
    return <div className="space-y-4 pt-10">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-border/50 rounded-xl animate-pulse" />)}
    </div>
  }

  const stepIndex = steps.findIndex(s => s.key === step)

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4 transition-colors">
        <ArrowLeft size={16} /> 返回课程
      </Link>

      <div className="bg-surface rounded-xl border border-border p-5 shadow-sm mb-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs text-text-muted mb-0.5">
              L{lesson.level_id} · 第{lesson.lesson_id}课 · {exerciseLabels[lesson.exercise_type] || lesson.exercise_type}
            </div>
            <h2 className="text-lg font-bold text-text">{lesson.title}</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted shrink-0">
            <Clock size={12} /><span>{lesson.duration_goal}秒</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mt-4 bg-background rounded-lg p-1">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.key
            const isPast = i < stepIndex
            return (
              <button
                key={s.key}
                onClick={() => i <= stepIndex + 1 && setStep(s.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive ? 'bg-primary text-white shadow-sm' :
                  isPast ? 'bg-green-50 text-green-700' :
                  'text-text-muted hover:text-text'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-sm min-h-[300px]">
        {step === 'theory' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-primary" />
              <h3 className="font-bold text-text">理论学习</h3>
            </div>
            <div className="prose prose-sm max-w-none text-text leading-relaxed whitespace-pre-wrap text-sm">
              {lesson.theory_content || '暂无理论内容，直接进入练习吧。'}
            </div>
            <button onClick={() => setStep('example')} className="mt-6 w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
              下一步：范例跟读 →
            </button>
          </div>
        )}

        {step === 'example' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Headphones size={18} className="text-primary" />
              <h3 className="font-bold text-text">范例跟读</h3>
            </div>
            <p className="text-xs text-text-muted mb-3">看着文本大声朗读，录下自己的声音，感受表达的节奏。</p>
            <div className="bg-background rounded-lg p-4 text-sm text-text leading-relaxed whitespace-pre-wrap border border-border mb-4 max-h-60 overflow-y-auto">
              {lesson.example_text || '暂无范例文本。'}
            </div>

            {exampleRec ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-4">
                <CheckCircle size={24} className="mx-auto text-green-500 mb-1" />
                <p className="text-sm text-green-700 font-medium">跟读录音完成</p>
                <audio src={exampleRec.url} controls className="w-full mt-2 h-9" />
                <button onClick={() => setExampleRec(null)} className="mt-2 text-xs text-text-muted hover:text-text underline">
                  重新录制
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg p-4 mb-4">
                <p className="text-xs text-text-muted text-center mb-3">点击下方按钮，朗读上面的范例文本</p>
                <AudioRecorder
                  lessonId={lesson.id}
                  onUploaded={(id, url) => setExampleRec({ id, url })}
                />
              </div>
            )}

            <button onClick={() => setStep('practice')} className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
              下一步：自主练习 →
            </button>
          </div>
        )}

        {step === 'practice' && (
          <div>
            {practiceRec ? (
              <div className="text-center">
                <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
                <h3 className="text-lg font-bold text-green-800 mb-1">录音完成</h3>
                <p className="text-sm text-green-600 mb-4">回听录音，满意后提交AI评价</p>
                <audio src={practiceRec.url} controls className="w-full max-w-xs mx-auto mb-4 h-10" />
                <div className="flex gap-3">
                  <button onClick={() => setPracticeRec(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm text-text-muted hover:text-text">
                    重新录制
                  </button>
                  <button onClick={handleEvaluate} disabled={evaluating} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50 flex items-center justify-center gap-2">
                    {evaluating ? <><Loader2 size={14} className="animate-spin" /> 评价中</> : '提交AI评价'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Radio size={18} className="text-primary" />
                  <h3 className="font-bold text-text">自主练习</h3>
                </div>
                <AudioRecorder
                  lessonId={lesson.id}
                  onUploaded={(id, url) => setPracticeRec({ id, url })}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
