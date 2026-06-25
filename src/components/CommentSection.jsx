import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getComments, addComment, deleteComment } from '../firebase/db'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isAdmin } from '../utils/admin'
import { validateComment, LIMITS } from '../utils/validation'
import { formatTimeAgo, initialOf } from '../utils/formatters'

const AV_COLORS = [
  'linear-gradient(150deg,oklch(0.45 0.13 280),oklch(0.4 0.15 330))',
  'linear-gradient(150deg,oklch(0.5 0.15 180),oklch(0.45 0.18 220))',
  'linear-gradient(150deg,oklch(0.55 0.18 52),oklch(0.5 0.2 28))',
]
function avColor(s) {
  let h = 0
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return AV_COLORS[h % AV_COLORS.length]
}

export default function CommentSection({ videoId }) {
  const { user } = useAuth()
  const toast = useToast()
  const admin = isAdmin(user)
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getComments(videoId)
      .then((c) => { if (!cancelled) setComments(c) })
      .catch(() => { if (!cancelled) setComments([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [videoId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (posting) return
    const v = validateComment(text)
    if (!v.ok) { toast.error(v.error); return }
    setPosting(true)
    try {
      await addComment(user.uid, user.displayName || user.email, videoId, v.value)
      const updated = await getComments(videoId)
      setComments(updated)
      setText('')
      toast.success('Комментарий добавлен')
    } catch {
      toast.error('Не удалось отправить комментарий')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(c) {
    if (!confirm('Удалить комментарий?')) return
    try {
      await deleteComment(c.id)
      setComments((prev) => prev.filter((x) => x.id !== c.id))
      toast.success('Комментарий удалён')
    } catch {
      toast.error('Не удалось удалить комментарий')
    }
  }

  return (
    <div className="comments">
      <h3 className="comments__title">
        Комментарии <span style={{ color: 'var(--faint)', fontWeight: 400, fontSize: 16 }}>({comments.length})</span>
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}>
          <div className="card__avatar" style={{ background: avColor(user.email), width: 38, height: 38, flexShrink: 0, marginTop: 2, fontSize: 14 }}>
            {initialOf(user.displayName || user.email)}
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 10 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={LIMITS.commentMax}
              placeholder="Напишите комментарий…"
              className="vt-input"
              style={{ flex: 1 }}
              aria-label="Текст комментария"
            />
            <button type="submit" disabled={posting || !text.trim()} className="btn btn--primary btn--sm" style={{ flexShrink: 0 }}>
              {posting ? '…' : 'Отправить'}
            </button>
          </div>
        </form>
      ) : (
        <p style={{ color: 'var(--faint)', fontSize: 14, marginBottom: 20, padding: '14px 18px', background: 'var(--card)', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Войдите</Link>, чтобы оставить комментарий.
        </p>
      )}

      {loading ? (
        <>
          <div className="sk sk--line" style={{ height: 60, marginBottom: 12 }} />
          <div className="sk sk--line" style={{ height: 60 }} />
        </>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--faint)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>Комментариев пока нет. Будьте первым.</p>
      ) : (
        comments.map((c) => {
          const canDelete = admin || (user && user.uid === c.userId)
          return (
            <div key={c.id} className="comment">
              <div className="comment__head">
                <div className="comment__av" style={{ background: avColor(c.userName) }}>
                  {initialOf(c.userName)}
                </div>
                <span className="comment__name">{c.userName || 'Аноним'}</span>
                <span className="comment__date">{formatTimeAgo(c.date)}</span>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(c)}
                    aria-label="Удалить комментарий"
                    style={{ marginLeft: 8, color: 'var(--faint)', display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8 }}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                  </button>
                )}
              </div>
              <p className="comment__text">{c.text}</p>
            </div>
          )
        })
      )}
    </div>
  )
}
