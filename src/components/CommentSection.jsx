import { useEffect, useRef, useState } from 'react'
import { getComments, addComment } from '../firebase/db'
import { useAuth } from '../context/AuthContext'

const AV_COLORS = [
  'linear-gradient(150deg,oklch(0.45 0.13 280),oklch(0.4 0.15 330))',
  'linear-gradient(150deg,oklch(0.5 0.15 180),oklch(0.45 0.18 220))',
  'linear-gradient(150deg,oklch(0.55 0.18 52),oklch(0.5 0.2 28))',
]
function avColor(s) {
  let h = 0; for (let i = 0; i < (s||'').length; i++) h = (h*31+s.charCodeAt(i))>>>0
  return AV_COLORS[h % AV_COLORS.length]
}

export default function CommentSection({ videoId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    getComments(videoId).then(c => { setComments(c); setLoading(false) })
  }, [videoId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || posting) return
    setPosting(true)
    await addComment(user.uid, user.displayName || user.email, videoId, text.trim())
    const updated = await getComments(videoId)
    setComments(updated); setText(''); setPosting(false)
  }

  return (
    <div className="comments">
      <h3 className="comments__title">
        Комментарии <span style={{ color:'var(--faint)', fontWeight:400, fontSize:16 }}>({comments.length})</span>
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} style={{ display:'flex', gap:12, marginBottom:24, alignItems:'flex-start' }}>
          <div className="card__avatar" style={{ background: avColor(user.email), width:38, height:38, flexShrink:0, marginTop:2, fontSize:14 }}>
            {(user.displayName || user.email)?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1, display:'flex', gap:10 }}>
            <input value={text} onChange={e => setText(e.target.value)}
              placeholder="Напишите комментарий…" className="vt-input" style={{ flex:1 }} />
            <button type="submit" disabled={posting || !text.trim()} className="btn btn--primary btn--sm" style={{ flexShrink:0 }}>
              {posting ? '…' : 'Отправить'}
            </button>
          </div>
        </form>
      ) : (
        <p style={{ color:'var(--faint)', fontSize:14, marginBottom:20, padding:'14px 18px', background:'var(--card)', borderRadius:'var(--r-md)', border:'1px solid var(--line)' }}>
          <Link to="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Войдите</Link>, чтобы оставить комментарий.
        </p>
      )}

      {loading ? (
        <>
          <div className="sk sk--line" style={{ height:60, marginBottom:12 }} />
          <div className="sk sk--line" style={{ height:60 }} />
        </>
      ) : comments.length === 0 ? (
        <p style={{ color:'var(--faint)', fontSize:14, textAlign:'center', padding:'32px 0' }}>Комментариев пока нет. Будьте первым.</p>
      ) : (
        comments.map(c => (
          <div key={c.id} className="comment">
            <div className="comment__head">
              <div className="comment__av" style={{ background: avColor(c.userName) }}>
                {c.userName?.[0]?.toUpperCase()}
              </div>
              <span className="comment__name">{c.userName}</span>
              <span className="comment__date">{c.date?.toDate ? c.date.toDate().toLocaleDateString('ru-RU') : ''}</span>
            </div>
            <p className="comment__text">{c.text}</p>
          </div>
        ))
      )}
    </div>
  )
}
