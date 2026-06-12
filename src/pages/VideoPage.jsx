import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getVideoById, getVideos, toggleLike, incrementViews, addToHistory, isFavorite, addFavorite, removeFavorite } from '../firebase/db'
import { useAuth } from '../context/AuthContext'
import VideoPlayer from '../components/VideoPlayer'
import CommentSection from '../components/CommentSection'

export default function VideoPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [video, setVideo] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [favId, setFavId] = useState(null)
  const [favLoading, setFavLoading] = useState(false)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const v = await getVideoById(id)
      if (cancelled || !v) return
      setVideo(v)
      setLiked(user ? (v.likes ?? []).includes(user.uid) : false)
      await incrementViews(id)
      const all = await getVideos()
      setRelated(all.filter(x => x.id !== id && x.category === v.category).slice(0, 6))
      if (user) {
        await addToHistory(user.uid, id)
        const fId = await isFavorite(user.uid, id)
        if (!cancelled) setFavId(fId)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, user])

  async function handleLike() {
    if (!user) return
    await toggleLike(id, user.uid)
    const updated = await getVideoById(id)
    setVideo(updated)
    setLiked((updated.likes ?? []).includes(user.uid))
  }

  async function handleFavorite() {
    if (!user || favLoading) return
    setFavLoading(true)
    if (favId) { await removeFavorite(favId); setFavId(null) }
    else { const ref = await addFavorite(user.uid, id); setFavId(ref.id) }
    setFavLoading(false)
  }

  const posterStyle = video?.thumbnail
    ? { backgroundImage:`url(${video.thumbnail})`, backgroundSize:'cover', backgroundPosition:'center' }
    : { background:'linear-gradient(135deg, oklch(0.22 0.04 50), oklch(0.18 0.06 28))' }

  if (loading) return (
    <main className="wrap" style={{ paddingTop:30 }}>
      <div className="vp">
        <div>
          <div className="sk" style={{ aspectRatio:'16/9', borderRadius:'var(--r-lg)' }} />
          <div style={{ marginTop:24 }}>
            <div className="sk sk--title" style={{ width:'70%', height:36, marginBottom:16 }} />
            <div className="sk sk--line" style={{ width:'40%' }} />
          </div>
        </div>
      </div>
    </main>
  )

  if (!video) return (
    <main className="wrap" style={{ paddingTop:60, textAlign:'center' }}>
      <div className="empty">
        <div className="empty__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>
        <h3>Видео не найдено</h3>
        <Link to="/" className="btn btn--secondary" style={{ marginTop:16 }}>На главную</Link>
      </div>
    </main>
  )

  const dateStr = video.date?.toDate
    ? video.date.toDate().toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })
    : video.date ? new Date(video.date).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' }) : ''

  return (
    <main className="wrap vp">
      {/* Main column */}
      <div>
        <div className="player">
          <VideoPlayer src={video.videoUrl} poster={video.thumbnail} />
        </div>

        <div className="vmeta">
          <h1>{video.title}</h1>
          <div className="vmeta__row">
            <div className="vmeta__stats">
              <span>{(video.views ?? 0).toLocaleString('ru')} просмотров</span>
              <span className="dot" />
              {dateStr && <span>{dateStr}</span>}
              <span className="dot" />
              <span className="badge badge--cat">{video.category}</span>
            </div>
            <div className="vmeta__actions">
              <button
                onClick={handleLike} disabled={!user}
                className={`action${liked ? ' is-on' : ''}`}
                title={!user ? 'Войдите, чтобы поставить лайк' : ''}
              >
                <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {(video.likes ?? []).length}
              </button>

              {user && (
                <button onClick={handleFavorite} disabled={favLoading} className={`action${favId ? ' is-on' : ''}`}>
                  <svg viewBox="0 0 24 24" fill={favId ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  {favId ? 'В избранном' : 'Избранное'}
                </button>
              )}
            </div>
          </div>

          <div className="channel">
            <div className="channel__av" style={{ background:'linear-gradient(150deg,oklch(0.45 0.13 280),oklch(0.4 0.15 330))' }}>
              {video.author?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="channel__name">{video.author}</div>
              <div className="channel__sub">Автор · {video.category}</div>
            </div>
          </div>

          {video.description && <div className="vdesc">{video.description}</div>}
        </div>

        <CommentSection videoId={id} />
      </div>

      {/* Sidebar */}
      <aside className="vp__side">
        <div className="sidebar__title">Похожие видео</div>
        <div className="related">
          {related.length === 0 ? (
            <p style={{ color:'var(--faint)', fontSize:14 }}>Нет похожих видео</p>
          ) : related.map(v => (
            <Link key={v.id} to={`/video/${v.id}`} className="rcard">
              <div className="poster">
                <div className="poster__art" style={
                  v.thumbnail
                    ? { backgroundImage:`url(${v.thumbnail})`, backgroundSize:'cover', backgroundPosition:'center' }
                    : { background:'linear-gradient(135deg, oklch(0.22 0.04 50), oklch(0.18 0.06 28))' }
                } />
                <div className="poster__scrim" />
              </div>
              <div className="rcard__b">
                <div className="rcard__t">{v.title}</div>
                <div className="rcard__m">
                  <span className="cat">{v.category}</span> · {(v.views||0).toLocaleString('ru')} просм.
                </div>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </main>
  )
}
