import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getVideoById, getVideos, toggleLike, incrementViews, addToHistory, isFavorite, addFavorite, removeFavorite } from '../firebase/db'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import VideoPlayer from '../components/VideoPlayer'
import CommentSection from '../components/CommentSection'

export default function VideoPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const [video, setVideo] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [favId, setFavId] = useState(null)
  const [favLoading, setFavLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [burstKey, setBurstKey] = useState(0)
  const [favPulse, setFavPulse] = useState(0)
  const [likeBusy, setLikeBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const v = await getVideoById(id)
        if (cancelled) return
        if (!v) { setVideo(null); return }
        setVideo(v)
        setLiked(user ? (v.likes ?? []).includes(user.uid) : false)
        setLikeCount((v.likes ?? []).length)

        try {
          const viewed = JSON.parse(sessionStorage.getItem('vt_viewed_videos') || '[]')
          if (!viewed.includes(id)) {
            await incrementViews(id)
            sessionStorage.setItem('vt_viewed_videos', JSON.stringify([...viewed, id]))
          }
        } catch { /* sessionStorage недоступен — пропускаем учёт */ }

        const all = await getVideos()
        if (cancelled) return
        setRelated(all.filter(x => x.id !== id && x.category === v.category).slice(0, 6))
        if (user) {
          await addToHistory(user.uid, id)
          const fId = await isFavorite(user.uid, id)
          if (!cancelled) setFavId(fId)
        }
      } catch {
        if (!cancelled) setVideo(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, user])

  async function handleLike() {
    if (!user) { toast.info('Войдите, чтобы поставить лайк'); return }
    if (likeBusy) return
    const next = !liked
    setLikeBusy(true)
    // оптимистичное обновление + анимация
    setLiked(next)
    setLikeCount(c => Math.max(0, c + (next ? 1 : -1)))
    if (next) setBurstKey(k => k + 1)
    try {
      await toggleLike(id, user.uid)
    } catch {
      setLiked(!next)
      setLikeCount(c => Math.max(0, c + (next ? -1 : 1)))
      toast.error('Не удалось обновить лайк')
    } finally {
      setLikeBusy(false)
    }
  }

  async function handleFavorite() {
    if (!user || favLoading) return
    setFavLoading(true)
    setFavPulse(k => k + 1)
    try {
      if (favId) { await removeFavorite(favId); setFavId(null); toast.info('Удалено из избранного') }
      else { const ref = await addFavorite(user.uid, id); setFavId(ref.id); toast.success('Добавлено в избранное') }
    } catch {
      toast.error('Не удалось обновить избранное')
    } finally {
      setFavLoading(false)
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/video/${id}`
    try {
      if (navigator.share) await navigator.share({ title: video?.title, url })
      else { await navigator.clipboard.writeText(url); toast.success('Ссылка скопирована') }
    } catch (err) {
      if (err?.name === 'AbortError') return
      try { await navigator.clipboard.writeText(url); toast.success('Ссылка скопирована') }
      catch { toast.error('Не удалось поделиться') }
    }
  }

  if (loading) return (
    <main className="wrap" style={{ paddingTop: 30 }}>
      <div className="vp">
        <div>
          <div className="sk" style={{ aspectRatio: '16/9', borderRadius: 'var(--r-lg)' }} />
          <div style={{ marginTop: 24 }}>
            <div className="sk sk--title" style={{ width: '70%', height: 36, marginBottom: 16 }} />
            <div className="sk sk--line" style={{ width: '40%' }} />
          </div>
        </div>
        <aside>
          <div className="sk sk--title" style={{ width: '50%', marginBottom: 16 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sk" style={{ height: 92, borderRadius: 16, marginBottom: 14 }} />
          ))}
        </aside>
      </div>
    </main>
  )

  if (!video) return (
    <main className="wrap" style={{ paddingTop: 60, textAlign: 'center' }}>
      <div className="empty">
        <div className="empty__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>
        <h3>Видео не найдено</h3>
        <Link to="/" className="btn btn--secondary" style={{ marginTop: 16 }}>На главную</Link>
      </div>
    </main>
  )

  const dateStr = video.date?.toDate
    ? video.date.toDate().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : video.date ? new Date(video.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <main className="wrap video-page">
      {video.thumbnail && (
        <div className="video-atmos" style={{ backgroundImage: `url(${video.thumbnail})` }} aria-hidden="true" />
      )}

      <div className="vp">
        {/* Main column */}
        <div>
          <div className="player">
            <VideoPlayer src={video.videoUrl} poster={video.thumbnail} />
          </div>

          <div className="vmeta">
            <h1>{video.title}</h1>
            <div className="vmeta__row">
              <div className="vmeta__stats">
                <span className="tnum">{(video.views ?? 0).toLocaleString('ru')} просмотров</span>
                <span className="dot" />
                {dateStr && <span>{dateStr}</span>}
                <span className="dot" />
                <span className="badge badge--cat">{video.category}</span>
              </div>
              <div className="vmeta__actions">
                <button
                  onClick={handleLike}
                  className={`action is-like${liked ? ' is-on' : ''}${liked ? ' is-pop' : ''}`}
                  key={`like-${burstKey}`}
                  title={!user ? 'Войдите, чтобы поставить лайк' : ''}
                >
                  {burstKey > 0 && liked && <span className="action-burst" aria-hidden="true" />}
                  <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span className="tnum">{likeCount}</span>
                </button>

                {user && (
                  <button onClick={handleFavorite} disabled={favLoading} key={`fav-${favPulse}`} className={`action${favId ? ' is-on' : ''}${favId ? ' is-pop' : ''}`}>
                    <svg viewBox="0 0 24 24" fill={favId ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    {favId ? 'В избранном' : 'Избранное'}
                  </button>
                )}

                <button onClick={handleShare} className="action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
                  Поделиться
                </button>
              </div>
            </div>

            <div className="channel">
              <div className="channel__av" style={{ background: 'linear-gradient(150deg,oklch(0.55 0.2 293),oklch(0.5 0.18 330))' }}>
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
              <p style={{ color: 'var(--faint)', fontSize: 14 }}>Нет похожих видео</p>
            ) : related.map(v => (
              <Link key={v.id} to={`/video/${v.id}`} className="rcard">
                <div className="poster">
                  <div className="poster__art" style={
                    v.thumbnail
                      ? { backgroundImage: `url(${v.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: 'linear-gradient(135deg, oklch(0.26 0.09 293), oklch(0.18 0.07 240))' }
                  } />
                  <div className="poster__scrim" />
                  <span className="poster__play" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" fill="currentColor"/></svg>
                  </span>
                </div>
                <div className="rcard__b">
                  <div className="rcard__t">{v.title}</div>
                  <div className="rcard__m">
                    <span className="cat">{v.category}</span> · {(v.views || 0).toLocaleString('ru')} просм.
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}
