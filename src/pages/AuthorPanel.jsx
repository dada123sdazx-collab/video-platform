import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PlusSquare, CheckCircle, ArrowLeft, Play, Link2, Info, UploadCloud } from 'lucide-react'
import { addVideo } from '../firebase/db'
import { createShortFromVideo } from '../firebase/shorts'
import { uploadVideoFile } from '../firebase/storage'
import { useToast } from '../context/ToastContext'
import { useProtectedRoute } from '../hooks/useProtectedRoute'
import { validateShortVideoFile } from '../utils/validation'
import { CATEGORIES } from '../components/CategoryFilter'

const NON_ALL = CATEGORIES.filter(c => c !== 'Все')

function isYouTube(url) {
  return /youtube\.com|youtu\.be/.test(url)
}

// Прямое видео (можно показать в ленте Shorts через <video>): не эмбед-сервис.
function isDirectVideo(url) {
  return !!url && !/youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com/.test(url)
}

export default function AuthorPanel() {
  const user = useProtectedRoute()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    title: '', description: '', category: NON_ALL[0], videoUrl: '', thumbnail: '',
  })
  const [videoFile, setVideoFile] = useState(null)
  const [alsoShort, setAlsoShort] = useState(true)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleFile(e) {
    const file = e.target.files?.[0] || null
    setError('')
    if (!file) { setVideoFile(null); return }
    const check = validateShortVideoFile(file)
    if (!check.ok) { setError(check.error); setVideoFile(null); return }
    setVideoFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Введите название'); return }
    if (!videoFile && !form.videoUrl.trim()) {
      setError('Загрузите файл или укажите ссылку на видео')
      return
    }
    setError('')
    setLoading(true)
    setProgress(0)
    try {
      // 1) Источник видео: загруженный файл (Storage) или ссылка.
      let videoUrl = form.videoUrl.trim()
      if (videoFile) {
        const up = await uploadVideoFile(user.uid, videoFile, setProgress)
        videoUrl = up.url
      }

      // 2) Обычное видео.
      const ref = await addVideo({
        ...form,
        videoUrl,
        author: user.displayName || user.email,
      })

      // 3) Авто-создание Short (для прямых видео — не для YouTube/Vimeo-эмбедов).
      if (alsoShort) {
        if (isDirectVideo(videoUrl)) {
          try {
            await createShortFromVideo({
              user,
              video: { title: form.title, description: form.description, category: form.category, videoUrl, thumbnail: form.thumbnail },
            })
            toast.success('Видео опубликовано и добавлено в Shorts')
          } catch {
            toast.info('Видео добавлено, но Short создать не удалось')
          }
        } else {
          toast.info('Видео добавлено. Short не создан: для Shorts нужен файл или прямая ссылка на видео')
        }
      } else {
        toast.success('Видео опубликовано')
      }

      setSuccess(true)
      setTimeout(() => navigate(`/video/${ref.id}`), 1200)
    } catch {
      setError('Ошибка при добавлении видео')
      toast.error('Ошибка при добавлении видео')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <main className="page-enter max-w-7xl mx-auto px-4 py-32 text-center">
      <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
      <p className="text-lg font-semibold text-[var(--text)]">Видео добавлено</p>
      <p className="text-sm text-[var(--muted)] mt-1">Переходим на страницу видео...</p>
    </main>
  )

  const ytDetected = isYouTube(form.videoUrl)

  return (
    <main className="page-enter max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="p-2 rounded-lg text-[var(--muted)] hover:text-violet-400 hover:bg-violet-500/5 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-violet-600/15 flex items-center justify-center text-violet-400">
          <PlusSquare size={18} />
        </div>
        <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">Добавить видео</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--surface)] rounded-2xl p-6 border border-white/5 shadow-xl">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
            Название <span className="text-red-400">*</span>
          </label>
          <input name="title" required value={form.title} onChange={handleChange}
            className="vt-input" placeholder="Название видео" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Описание</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={3} className="vt-input resize-none" placeholder="Краткое описание..." />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Категория</label>
          <select name="category" value={form.category} onChange={handleChange} className="vt-input">
            {NON_ALL.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
            Ссылка на видео <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            {ytDetected
              ? <Play size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />
              : <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            }
            <input name="videoUrl" required value={form.videoUrl} onChange={handleChange}
              className="vt-input pl-9"
              placeholder="https://youtube.com/watch?v=... или прямая ссылка на mp4" />
          </div>
          {ytDetected && (
            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
              <Play size={11} /> YouTube-ссылка определена — видео встроится как плеер
            </p>
          )}
          <div className="mt-2 p-3 rounded-xl bg-[var(--surface-2)] border border-white/4 text-xs text-[var(--muted)] space-y-1">
            <p className="flex items-center gap-1.5 text-zinc-400 font-medium"><Info size={12} /> Поддерживаемые форматы:</p>
            <p>• <span className="text-red-400">YouTube</span> — youtube.com/watch?v=... или youtu.be/...</p>
            <p>• <span className="text-blue-400">Vimeo</span> — vimeo.com/номер</p>
            <p>• <span className="text-violet-400">Прямая ссылка</span> — любой публичный .mp4 URL</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UploadCloud size={13} /> Или загрузите файл (mp4 / webm / mov)
          </label>
          <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleFile} className="vt-input" />
          {videoFile && (
            <p className="text-xs text-[var(--muted)] mt-1.5">Выбран: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} МБ)</p>
          )}
          <p className="text-xs text-amber-400/80 mt-1.5">⚠ Загрузка файла заработает после включения Firebase Storage в консоли.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Обложка (URL)</label>
          <input name="thumbnail" value={form.thumbnail} onChange={handleChange}
            className="vt-input" placeholder="https://example.com/cover.jpg" />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-[var(--text)] cursor-pointer select-none">
          <input type="checkbox" checked={alsoShort} onChange={e => setAlsoShort(e.target.checked)} className="w-4 h-4 accent-violet-500" />
          Также добавить в Shorts (вертикальный формат)
        </label>

        {loading && progress > 0 && (
          <div className="progress"><div className="progress__bar" style={{ width: `${progress}%` }} /><span className="progress__label">{progress}%</span></div>
        )}

        <button type="submit" disabled={loading} className="btn-accent w-full justify-center py-2.5 mt-2">
          <PlusSquare size={16} />
          {loading ? 'Публикуем...' : 'Опубликовать видео'}
        </button>
      </form>
    </main>
  )
}
