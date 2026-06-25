import { Link } from 'react-router-dom'
import { useProtectedRoute } from '../hooks/useProtectedRoute'
import ShortUploadForm from '../components/shorts/ShortUploadForm'

const UploadIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
)

/** Страница загрузки short (/upload-short). Требует авторизации. */
export default function ShortUpload() {
  const user = useProtectedRoute()
  if (!user) return null

  return (
    <main className="wrap" style={{ maxWidth: 660, paddingBottom: 60 }}>
      <header className="phead reveal" style={{ gap: 16 }}>
        <Link to="/shorts" className="icon-btn" aria-label="Назад к ленте" style={{ flex: 'none' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <span className="phead__icon">{UploadIcon}</span>
        <div className="phead__t">
          <span className="eyebrow">Студия</span>
          <h1 style={{ fontSize: 'clamp(24px,3vw,32px)' }}>Загрузить <span className="grad-text">Short</span></h1>
          <p>Вертикальное видео до 60 секунд</p>
        </div>
      </header>

      <ShortUploadForm />
    </main>
  )
}
