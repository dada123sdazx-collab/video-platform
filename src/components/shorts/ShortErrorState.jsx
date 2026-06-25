/** Состояние ошибки загрузки ленты shorts с кнопкой повтора. */
export default function ShortErrorState({ onRetry }) {
  return (
    <div className="short-state">
      <div className="empty__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <h3>Не удалось загрузить</h3>
      <p>Проверьте подключение к интернету и попробуйте снова.</p>
      {onRetry && (
        <button className="btn btn--secondary" style={{ marginTop: 16 }} onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  )
}
