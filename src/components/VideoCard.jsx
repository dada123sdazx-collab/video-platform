import { Link } from 'react-router-dom'

const AVATAR_COLORS = [
  'linear-gradient(150deg,oklch(0.45 0.13 280),oklch(0.4 0.15 330))',
  'linear-gradient(150deg,oklch(0.5 0.15 180),oklch(0.45 0.18 220))',
  'linear-gradient(150deg,oklch(0.55 0.18 52),oklch(0.5 0.2 28))',
  'linear-gradient(150deg,oklch(0.48 0.14 140),oklch(0.43 0.17 160))',
]

function getColor(str) {
  let h = 0
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export default function VideoCard({ video }) {
  const { id, title, description, author, category, thumbnail, views, likes, date } = video

  const dateStr = date?.toDate
    ? date.toDate().toLocaleDateString('ru-RU', { day:'numeric', month:'short', year:'numeric' })
    : date ? new Date(date).toLocaleDateString('ru-RU', { day:'numeric', month:'short', year:'numeric' }) : ''

  const posterStyle = thumbnail
    ? { backgroundImage: `url(${thumbnail})`, backgroundSize:'cover', backgroundPosition:'center' }
    : { background: `linear-gradient(135deg, oklch(0.22 0.04 ${50 + (id?.charCodeAt(0) ?? 0) % 80}) 0%, oklch(0.18 0.06 ${28 + (id?.charCodeAt(1) ?? 0) % 60}) 100%)` }

  return (
    <Link to={`/video/${id}`} className="card">
      <div className="poster">
        <div className="poster__art" style={posterStyle} />
        <div className="poster__scrim" />
        <div className="poster__tag">
          <span className="badge badge--cat">{category}</span>
        </div>
        <button className="poster__play" aria-label="Воспроизвести">
          <svg viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" fill="currentColor"/></svg>
        </button>
        {dateStr && <span className="duration">{dateStr}</span>}
      </div>

      <div className="card__body">
        <div className="card__head">
          <div className="card__avatar" style={{ background: getColor(author) }}>
            {author?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="card__title">{title}</div>
            <div className="card__meta">
              <span>{author}</span>
              <span className="dot" />
              <span className="cat">{category}</span>
            </div>
          </div>
        </div>
        {description && <div className="card__desc">{description}</div>}
        <div className="card__meta" style={{ marginTop:'auto' }}>
          <span>{(views ?? 0).toLocaleString('ru')} просм.</span>
          <span className="dot" />
          <span>{Array.isArray(likes) ? likes.length : 0} лайков</span>
        </div>
      </div>
    </Link>
  )
}
