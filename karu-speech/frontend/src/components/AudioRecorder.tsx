import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'

interface AudioRecorderProps {
  onUploaded: (recordId: number, audioUrl: string) => void
  lessonId: number
}

export function AudioRecorder({ onUploaded, lessonId }: AudioRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'uploading'>('idle')
  const [duration, setDuration] = useState(0)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // 部分浏览器（如 Safari/iOS WebView）不支持 audio/webm，需降级为浏览器默认编码
      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''
      mediaRecorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunks.current = []
      durationRef.current = 0
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data)
      mediaRecorder.current.onstop = () => {
        // 在 stop 事件回调里再停轨道，确保最后一段数据已写入 chunks
        mediaRecorder.current?.stream.getTracks().forEach(t => t.stop())
        upload()
      }
      mediaRecorder.current.start()
      setState('recording')
      setDuration(0)
      timer.current = window.setInterval(() => {
        durationRef.current += 1
        setDuration(durationRef.current)
      }, 1000)
    } catch {
      alert('无法访问麦克风，请检查权限设置')
    }
  }, [])

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current)
    // 轨道停止移到 onstop 回调里执行，避免最后一段数据丢失
    mediaRecorder.current?.stop()
    setState('uploading')
  }, [])

  const upload = useCallback(async () => {
    if (chunks.current.length === 0) {
      alert('未捕获到录音数据，请重试')
      setState('idle')
      return
    }
    const blob = new Blob(chunks.current, { type: 'audio/webm' })
    const form = new FormData()
    form.append('file', blob, `recording_${Date.now()}.webm`)
    form.append('lesson_id', String(lessonId))
    form.append('duration', String(durationRef.current))

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/practice/upload/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (res.ok) {
        onUploaded(data.id, data.audio_url)
        setState('idle')
      } else {
        alert('上传失败')
        setState('idle')
      }
    } catch {
      alert('上传失败，请检查网络')
      setState('idle')
    }
  }, [lessonId, onUploaded])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {state === 'uploading' ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={32} className="text-primary animate-spin" />
          <span className="text-sm text-text-muted">上传录音中...</span>
        </div>
      ) : (
        <>
          <div className="text-4xl font-mono font-bold text-primary tabular-nums">
            {formatTime(duration)}
          </div>

          <button
            onClick={state === 'recording' ? stop : start}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              state === 'recording'
                ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                : 'bg-primary hover:bg-primary-light hover:scale-105'
            }`}
          >
            {state === 'recording' ? <Square size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
          </button>

          <p className="text-sm text-text-muted">
            {state === 'recording' ? '点击停止按钮结束录音' : '点击麦克风开始录音'}
          </p>
        </>
      )}
    </div>
  )
}
