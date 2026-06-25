import { formatCount } from '../../utils/formatters'

const I = {
  heart: (filled) => (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
  ),
  comment: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" /></svg>,
  bookmark: (filled) => (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
  ),
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>,
  flag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
  muted: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>,
  sound: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
}

function ActionBtn({ label, onClick, active, count, children }) {
  return (
    <div className="short-action">
      <button
        type="button"
        className={`short-action__btn${active ? ' is-on' : ''}`}
        onClick={onClick}
        aria-label={label}
        aria-pressed={active || undefined}
      >
        {children}
      </button>
      {count != null && <span className="short-action__count">{formatCount(count)}</span>}
    </div>
  )
}

export default function ShortActions({
  short, liked, saved, muted, isAuthor,
  onLike, onComments, onSave, onShare, onReport, onToggleMute, onDelete,
}) {
  return (
    <div className="short-actions">
      <ActionBtn label={liked ? 'Убрать лайк' : 'Лайк'} onClick={onLike} active={liked} count={short.likesCount}>
        {I.heart(liked)}
      </ActionBtn>

      <ActionBtn label="Комментарии" onClick={onComments} count={short.commentsCount}>
        {I.comment}
      </ActionBtn>

      <ActionBtn label={saved ? 'Убрать из сохранённых' : 'Сохранить'} onClick={onSave} active={saved} count={short.savesCount}>
        {I.bookmark(saved)}
      </ActionBtn>

      <ActionBtn label="Поделиться" onClick={onShare} count={short.sharesCount}>
        {I.share}
      </ActionBtn>

      <ActionBtn label="Пожаловаться" onClick={onReport}>
        {I.flag}
      </ActionBtn>

      {isAuthor && (
        <ActionBtn label="Удалить short" onClick={onDelete}>
          {I.trash}
        </ActionBtn>
      )}

      <ActionBtn label={muted ? 'Включить звук' : 'Выключить звук'} onClick={onToggleMute}>
        {muted ? I.muted : I.sound}
      </ActionBtn>
    </div>
  )
}
