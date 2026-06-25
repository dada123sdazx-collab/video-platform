import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getShortComments, addShortComment, deleteShortComment } from '../../firebase/shortInteractions'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { isAdmin } from '../../utils/admin'
import { validateComment, LIMITS } from '../../utils/validation'
import { formatTimeAgo, initialOf } from '../../utils/formatters'

const AV = [
  'linear-gradient(150deg,oklch(0.45 0.13 280),oklch(0.4 0.15 330))',
  'linear-gradient(150deg,oklch(0.5 0.15 180),oklch(0.45 0.18 220))',
  'linear-gradient(150deg,oklch(0.72 0.13 200),oklch(0.6 0.17 250))',
]
function avColor(s) {
  let h = 0
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return AV[h % AV.length]
}

/**
 * Нижний лист (bottom sheet) с комментариями к short.
 * Без dangerouslySetInnerHTML — текст рендерится как обычная строка.
 */
export default function ShortCommentsSheet({ shortId, open, onClose, onCountChange }) {
  const { user } = useAuth()
  const toast = useToast()
  const admin = isAdmin(user)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const inputRef = useRef(null)
  const prevFocus = useRef(null)

  useEffect(() => {
    if (!open) return
    prevFocus.current = document.activeElement
    setLoading(true)
    let cancelled = false
    getShortComments(shortId).then((res) => {
      if (!cancelled) { setComments(res.items); setLoading(false) }
    })
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => { cancelled = true; clearTimeout(t) }
  }, [open, shortId])

  // Возврат фокуса при закрытии
  useEffect(() => {
    if (!open && prevFocus.current?.focus) {
      try { prevFocus.current.focus() } catch { /* noop */ }
    }
  }, [open])

  // Закрытие по Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (posting) return
    const v = validateComment(text)
    if (!v.ok) { toast.error(v.error); return }
    setPosting(true)
    try {
      const created = await addShortComment(user, shortId, v.value)
      setComments((prev) => [created, ...prev])
      setText('')
      onCountChange?.(1)
      toast.success('Комментарий добавлен')
    } catch (err) {
      toast.error(err.message || 'Не удалось отправить комментарий')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(c) {
    if (!confirm('Удалить комментарий?')) return
    try {
      await deleteShortComment(c.id, shortId)
      setComments((prev) => prev.filter((x) => x.id !== c.id))
      onCountChange?.(-1)
      toast.success('Комментарий удалён')
    } catch {
      toast.error('Не удалось удалить комментарий')
    }
  }

  if (!open) return null

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Комментарии"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__handle" aria-hidden="true" />
        <div className="sheet__head">
          <h3>Комментарии {comments.length > 0 && <span>({comments.length})</span>}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть комментарии">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="sheet__body">
          {loading ? (
            <>
              <div className="sk sk--line" style={{ height: 48, marginBottom: 10 }} />
              <div className="sk sk--line" style={{ height: 48 }} />
            </>
          ) : comments.length === 0 ? (
            <p className="sheet__empty">Пока нет комментариев. Будьте первым!</p>
          ) : (
            comments.map((c) => {
              const canDelete = admin || (user && user.uid === c.userId)
              return (
                <div key={c.id} className="scomment">
                  <div className="scomment__av" style={{ background: avColor(c.userName) }}>
                    {initialOf(c.userName)}
                  </div>
                  <div className="scomment__body">
                    <div className="scomment__head">
                      <span className="scomment__name">{c.userName || 'Аноним'}</span>
                      <span className="scomment__date">{formatTimeAgo(c.createdAt)}</span>
                    </div>
                    <p className="scomment__text">{c.text}</p>
                  </div>
                  {canDelete && (
                    <button className="scomment__del" onClick={() => handleDelete(c)} aria-label="Удалить комментарий">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {user ? (
          <form className="sheet__form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="vt-input"
              value={text}
              maxLength={LIMITS.commentMax}
              onChange={(e) => setText(e.target.value)}
              placeholder="Добавить комментарий…"
              aria-label="Текст комментария"
            />
            <button type="submit" className="btn btn--primary btn--sm" disabled={posting || !text.trim()}>
              {posting ? '…' : 'Отправить'}
            </button>
          </form>
        ) : (
          <p className="sheet__login">
            <Link to="/login">Войдите</Link>, чтобы оставить комментарий.
          </p>
        )}
      </div>
    </div>
  )
}
