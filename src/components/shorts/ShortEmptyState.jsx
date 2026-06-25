import { Link } from 'react-router-dom'

/** Пустое состояние ленты shorts (нет опубликованных видео). */
export default function ShortEmptyState({ canUpload = false }) {
  return (
    <div className="short-state">
      <div className="empty__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M10 9l5 3-5 3z" />
        </svg>
      </div>
      <h3>Пока нет shorts</h3>
      <p>Коротких видео ещё нет. Загрузите первое — оно появится здесь.</p>
      {canUpload && (
        <Link to="/upload-short" className="btn btn--primary" style={{ marginTop: 16 }}>
          Загрузить short
        </Link>
      )}
    </div>
  )
}
