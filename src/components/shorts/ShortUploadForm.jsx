import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { createShort } from '../../firebase/shorts'
import {
  ALLOWED_CATEGORIES, LIMITS,
  validateShortVideoFile, validateThumbnailFile, validateDuration,
} from '../../utils/validation'

const MAX_MB = Math.round(LIMITS.videoMaxBytes / 1024 / 1024)

const UploadIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
)
const CheckIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
)

/** Читает длительность видеофайла (метаданные) на клиенте. */
function readDuration(file) {
  return new Promise((resolve) => {
    try {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration || 0) }
      v.onerror = () => resolve(0)
      v.src = URL.createObjectURL(file)
    } catch { resolve(0) }
  })
}

export default function ShortUploadForm() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '', description: '', category: ALLOWED_CATEGORIES[0], tags: '', visibility: 'public',
  })
  const [videoFile, setVideoFile] = useState(null)
  const [thumbFile, setThumbFile] = useState(null)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const [successId, setSuccessId] = useState(null)
  const videoPreview = useRef(null)

  function change(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function processVideo(file) {
    setError('')
    if (!file) { setVideoFile(null); setDuration(0); return }
    const check = validateShortVideoFile(file)
    if (!check.ok) { setError(check.error); setVideoFile(null); return }
    const dur = await readDuration(file)
    const durCheck = validateDuration(dur)
    if (!durCheck.ok) { setError(durCheck.error); setVideoFile(null); setDuration(0); return }
    setVideoFile(file)
    setDuration(dur)
    if (videoPreview.current) videoPreview.current.src = URL.createObjectURL(file)
  }

  function pickVideo(e) { processVideo(e.target.files?.[0]) }

  function onDrop(e) {
    e.preventDefault(); setDrag(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) processVideo(file)
  }

  function pickThumb(e) {
    const file = e.target.files?.[0] || null
    const check = validateThumbnailFile(file)
    if (!check.ok) { setError(check.error); setThumbFile(null); return }
    setThumbFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (uploading) return
    if (!user) { toast.info('Войдите, чтобы загрузить short'); return }
    if (!videoFile) { setError('Выберите видеофайл'); return }
    setError('')
    setUploading(true)
    setProgress(0)
    try {
      const id = await createShort({
        user,
        data: {
          title: form.title,
          description: form.description,
          category: form.category,
          tags: form.tags,
          visibility: form.visibility,
          duration,
        },
        videoFile,
        thumbnailFile: thumbFile,
        onProgress: setProgress,
      })
      toast.success('Short загружен')
      setSuccessId(id)
    } catch (err) {
      setError(err.message || 'Ошибка загрузки')
      toast.error(err.message || 'Ошибка загрузки')
      setUploading(false)
    }
  }

  if (successId) {
    return (
      <div className="upload-success">
        <div className="upload-check">{CheckIcon}</div>
        <h3 style={{ fontSize: 24 }}>Short опубликован</h3>
        <p style={{ color: 'var(--muted)' }}>Ваше видео уже в ленте Shorts</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to={`/shorts/${successId}`} className="btn btn--primary">Смотреть short</Link>
          <button className="btn btn--secondary" onClick={() => navigate('/profile')}>Мои Shorts</button>
        </div>
      </div>
    )
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      {error && <div className="form-error" role="alert">{error}</div>}

      {/* Drag & drop зона видео */}
      <div
        className={`dropzone${drag ? ' is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <div className="dropzone__icon">{UploadIcon}</div>
        <div className="dropzone__title">{videoFile ? videoFile.name : 'Перетащите видео сюда или нажмите'}</div>
        <div className="dropzone__hint">mp4 / webm / mov · до {MAX_MB} МБ · до {LIMITS.shortDurationMax} сек</div>
        <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={pickVideo} aria-label="Видеофайл" />
      </div>

      {videoFile && (
        <div className="upload-preview">
          <video ref={videoPreview} muted playsInline className="upload-preview__video" />
          <div className="upload-preview__meta">
            <div>{videoFile.name}</div>
            <div className="field__hint">{duration ? `${duration.toFixed(1)} сек` : ''} · {(videoFile.size / 1024 / 1024).toFixed(1)} МБ</div>
          </div>
        </div>
      )}

      <label className="field">
        <span className="field__label">Название *</span>
        <input
          name="title" className="vt-input" value={form.title} onChange={change}
          maxLength={LIMITS.titleMax} placeholder="Например: Лучший трюк за 30 секунд"
        />
      </label>

      <label className="field">
        <span className="field__label">Описание</span>
        <textarea
          name="description" className="vt-input" rows={3} value={form.description}
          onChange={change} maxLength={LIMITS.descriptionMax} placeholder="О чём это видео…"
          style={{ resize: 'none' }}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field__label">Категория</span>
          <select name="category" className="vt-input" value={form.category} onChange={change}>
            {ALLOWED_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Видимость</span>
          <select name="visibility" className="vt-input" value={form.visibility} onChange={change}>
            <option value="public">Публичный</option>
            <option value="unlisted">По ссылке</option>
            <option value="private">Приватный</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field__label">Хэштеги</span>
        <input
          name="tags" className="vt-input" value={form.tags} onChange={change}
          placeholder="через запятую: react, обзор, лайфхак"
        />
        <span className="field__hint">До {LIMITS.tagsMax} тегов, без пробелов внутри тега</span>
      </label>

      <label className="field">
        <span className="field__label">Обложка <span className="field__hint">(необязательно)</span></span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="vt-input" onChange={pickThumb} />
      </label>

      {uploading && (
        <div className="progress" aria-label="Прогресс загрузки">
          <div className="progress__bar" style={{ width: `${progress}%` }} />
          <span className="progress__label">{progress}%</span>
        </div>
      )}

      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={uploading}>
        {uploading ? <span className="btn-spinner" aria-hidden="true" /> : null}
        {uploading ? 'Загрузка…' : 'Опубликовать short'}
      </button>
    </form>
  )
}
