import { Link } from 'react-router-dom'
import { formatCount, initialOf } from '../../utils/formatters'

/** Вертикальная карточка-превью short для списков (главная, профиль). */
export default function ShortPreviewCard({ short, showStatus = false, index = 0 }) {
  const posterStyle = short.thumbnail
    ? { backgroundImage: `url(${short.thumbnail})` }
    : { background: 'linear-gradient(160deg, oklch(0.28 0.09 293), oklch(0.18 0.07 240))' }

  const statusLabel = {
    published: 'Опубликован',
    blocked: 'Скрыт',
    draft: 'Черновик',
    deleted: 'Удалён',
  }[short.status] || short.status

  return (
    <Link to={`/shorts/${short.id}`} className="spreview" style={{ '--d': `${Math.min(index, 9) * 55}ms` }}>
      <div className="spreview__poster" style={posterStyle}>
        <div className="spreview__scrim" />
        <span className="spreview__play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" /></svg>
        </span>
        <span className="spreview__views">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          {formatCount(short.viewsCount)}
        </span>
        {showStatus && short.status !== 'published' && (
          <span className="spreview__status">{statusLabel}</span>
        )}
      </div>
      <div className="spreview__body">
        <div className="spreview__title">{short.title}</div>
        <div className="spreview__meta">
          <span className="spreview__av">{initialOf(short.authorName)}</span>
          <span className="spreview__author">@{short.authorName}</span>
          <span className="dot" />
          <span>♥ {formatCount(short.likesCount)}</span>
        </div>
      </div>
    </Link>
  )
}
