import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import ShortVideoPlayer from './ShortVideoPlayer'
import ShortActions from './ShortActions'
import ShortCommentsSheet from './ShortCommentsSheet'
import ShortReportModal from './ShortReportModal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  likeShort, unlikeShort, checkShortLiked,
  saveShort, unsaveShort, checkShortSaved,
  shareShort,
} from '../../firebase/shortInteractions'
import { deleteShort } from '../../firebase/shorts'
import { initialOf } from '../../utils/formatters'

function avColor(s) {
  const palette = [
    'linear-gradient(150deg,oklch(0.45 0.13 280),oklch(0.4 0.15 330))',
    'linear-gradient(150deg,oklch(0.5 0.15 180),oklch(0.45 0.18 220))',
    'linear-gradient(150deg,oklch(0.55 0.18 52),oklch(0.5 0.2 28))',
  ]
  let h = 0
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

/**
 * Одна карточка ленты shorts: плеер + оверлей с информацией и панель действий.
 * Через ref предоставляет like/save/openComments для горячих клавиш ленты.
 */
const ShortVideoCard = forwardRef(function ShortVideoCard(
  { short, active, near, muted, onToggleMute, onOverlayChange, onDeleted },
  ref,
) {
  const { user } = useAuth()
  const toast = useToast()

  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [extra, setExtra] = useState({
    likesCount: short.likesCount,
    commentsCount: short.commentsCount,
    savesCount: short.savesCount,
    sharesCount: short.sharesCount,
  })
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [heartKey, setHeartKey] = useState(0)
  const [showHeart, setShowHeart] = useState(false)
  const likeBusy = useRef(false)
  const saveBusy = useRef(false)

  const isAuthor = !!user && user.uid === short.authorId

  // Статус лайка/сохранения проверяем только для активной карточки.
  useEffect(() => {
    if (!active || !user) return
    let cancelled = false
    checkShortLiked(user.uid, short.id).then((v) => !cancelled && setLiked(v))
    checkShortSaved(user.uid, short.id).then((v) => !cancelled && setSaved(v))
    return () => { cancelled = true }
  }, [active, user, short.id])

  // Сообщаем ленте об открытых оверлеях (чтобы пауза навигации стрелками).
  useEffect(() => {
    onOverlayChange?.(commentsOpen || reportOpen)
  }, [commentsOpen, reportOpen, onOverlayChange])

  const toggleLike = useCallback(async (forceLike = false) => {
    if (!user) { toast.info('Войдите, чтобы поставить лайк'); return }
    if (likeBusy.current) return
    if (forceLike && liked) return // двойной тап по уже лайкнутому — только анимация
    likeBusy.current = true
    const next = forceLike ? true : !liked
    setLiked(next)
    setExtra((e) => ({ ...e, likesCount: Math.max(0, e.likesCount + (next ? 1 : -1)) }))
    try {
      if (next) await likeShort(user.uid, short.id)
      else await unlikeShort(user.uid, short.id)
    } catch {
      setLiked(!next) // rollback
      setExtra((e) => ({ ...e, likesCount: Math.max(0, e.likesCount + (next ? -1 : 1)) }))
      toast.error('Не удалось обновить лайк')
    } finally {
      likeBusy.current = false
    }
  }, [user, liked, short.id, toast])

  const toggleSave = useCallback(async () => {
    if (!user) { toast.info('Войдите, чтобы сохранить short'); return }
    if (saveBusy.current) return
    saveBusy.current = true
    const next = !saved
    setSaved(next)
    setExtra((e) => ({ ...e, savesCount: Math.max(0, e.savesCount + (next ? 1 : -1)) }))
    try {
      if (next) { await saveShort(user.uid, short.id); toast.success('Сохранено') }
      else await unsaveShort(user.uid, short.id)
    } catch {
      setSaved(!next)
      setExtra((e) => ({ ...e, savesCount: Math.max(0, e.savesCount + (next ? -1 : 1)) }))
      toast.error('Не удалось сохранить')
    } finally {
      saveBusy.current = false
    }
  }, [user, saved, short.id, toast])

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/shorts/${short.id}`
    const bump = () => { setExtra((e) => ({ ...e, sharesCount: e.sharesCount + 1 })); shareShort(short.id) }
    try {
      if (navigator.share) {
        await navigator.share({ title: short.title, url })
        bump()
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Ссылка скопирована')
        bump()
      }
    } catch (err) {
      if (err?.name === 'AbortError') return // пользователь отменил share
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Ссылка скопирована')
        bump()
      } catch {
        toast.error('Не удалось поделиться')
      }
    }
  }, [short.id, short.title, toast])

  const handleReport = useCallback(() => {
    if (!user) { toast.info('Войдите, чтобы пожаловаться'); return }
    setReportOpen(true)
  }, [user, toast])

  const handleDoubleTap = useCallback(() => {
    setHeartKey((k) => k + 1)
    setShowHeart(true)
    setTimeout(() => setShowHeart(false), 800)
    toggleLike(true)
  }, [toggleLike])

  const handleDelete = useCallback(async () => {
    if (!confirm(`Удалить short «${short.title}»?`)) return
    try {
      await deleteShort(short.id)
      toast.success('Short удалён')
      onDeleted?.(short.id)
    } catch {
      toast.error('Не удалось удалить')
    }
  }, [short.id, short.title, onDeleted, toast])

  useImperativeHandle(ref, () => ({
    like: () => toggleLike(false),
    save: () => toggleSave(),
    openComments: () => setCommentsOpen((o) => !o),
  }), [toggleLike, toggleSave])

  const view = { ...short, ...extra }

  return (
    <div className="short-card">
      <ShortVideoPlayer
        short={short}
        active={active}
        near={near}
        muted={muted}
        userId={user?.uid || null}
        onDoubleTap={handleDoubleTap}
      />

      {/* Анимация сердечка при двойном тапе */}
      {showHeart && (
        <span key={heartKey} className="short-heart" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
        </span>
      )}

      {/* Информация об авторе и описании */}
      <div className="short-info">
        <div className="short-info__author">
          <span className="short-info__av" style={{ background: avColor(short.authorName) }}>
            {short.authorAvatar
              ? <img src={short.authorAvatar} alt="" loading="lazy" />
              : initialOf(short.authorName)}
          </span>
          <span className="short-info__name">@{short.authorName}</span>
          {short.category && short.category !== 'Без категории' && (
            <span className="badge badge--cat">{short.category}</span>
          )}
        </div>
        {short.title && <div className="short-info__title">{short.title}</div>}
        {short.description && <p className="short-info__desc">{short.description}</p>}
        {short.hashtags?.length > 0 && (
          <div className="short-info__tags">
            {short.hashtags.slice(0, 6).map((t) => <span key={t}>#{t}</span>)}
          </div>
        )}
      </div>

      <ShortActions
        short={view}
        liked={liked}
        saved={saved}
        muted={muted}
        isAuthor={isAuthor}
        onLike={() => toggleLike(false)}
        onComments={() => setCommentsOpen(true)}
        onSave={toggleSave}
        onShare={handleShare}
        onReport={handleReport}
        onToggleMute={onToggleMute}
        onDelete={handleDelete}
      />

      <ShortCommentsSheet
        shortId={short.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCountChange={(d) => setExtra((e) => ({ ...e, commentsCount: Math.max(0, e.commentsCount + d) }))}
      />

      <ShortReportModal
        shortId={short.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  )
})

export default ShortVideoCard
