import { Link } from 'react-router-dom'
import { useProtectedRoute } from '../hooks/useProtectedRoute'
import ShortUploadForm from '../components/shorts/ShortUploadForm'

/** Страница загрузки short (/upload-short). Требует авторизации. */
export default function ShortUpload() {
  const user = useProtectedRoute()
  if (!user) return null

  return (
    <main className="wrap" style={{ maxWidth: 640, paddingTop: 28, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link to="/shorts" className="icon-btn" aria-label="Назад к ленте">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 style={{ fontSize: 26 }}>Загрузить <span style={{ color: 'var(--accent)' }}>short</span></h1>
          <p className="section__sub" style={{ marginTop: 2 }}>Вертикальное видео до 60 секунд</p>
        </div>
      </div>

      <ShortUploadForm />
    </main>
  )
}
