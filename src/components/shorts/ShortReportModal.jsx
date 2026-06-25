import { useEffect, useState } from 'react'
import { reportShort, REPORT_REASONS } from '../../firebase/shortReports'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

/** Модальное окно жалобы на short. */
export default function ShortReportModal({ shortId, open, onClose }) {
  const { user } = useAuth()
  const toast = useToast()
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (sending) return
    setSending(true)
    try {
      const { alreadyReported } = await reportShort({ userId: user.uid, shortId, reason, details })
      if (alreadyReported) toast.info('Вы уже жаловались на это видео')
      else toast.success('Жалоба отправлена')
      setDetails('')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Не удалось отправить жалобу')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Пожаловаться на видео"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h3>Пожаловаться</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <fieldset className="report-reasons">
            <legend>Причина жалобы</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r.value} className={`report-reason${reason === r.value ? ' is-on' : ''}`}>
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                <span>{r.label}</span>
              </label>
            ))}
          </fieldset>

          <textarea
            className="vt-input"
            rows={3}
            maxLength={500}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Дополнительно (необязательно)…"
            aria-label="Подробности жалобы"
            style={{ resize: 'none', marginTop: 14 }}
          />

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={sending}>
              {sending ? 'Отправка…' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
