import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

let seq = 0

/**
 * Лёгкая система всплывающих уведомлений (toast). Заменяет alert() для
 * нормального UX. API: const toast = useToast(); toast.success('...').
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const tm = timers.current.get(id)
    if (tm) { clearTimeout(tm); timers.current.delete(id) }
  }, [])

  const push = useCallback((type, message, opts = {}) => {
    const id = ++seq
    setToasts((list) => [...list, { id, type, message }])
    const ttl = opts.duration ?? 3200
    const tm = setTimeout(() => remove(id), ttl)
    timers.current.set(id, tm)
    return id
  }, [remove])

  const api = useMemo(() => ({
    show: (message, opts) => push('info', message, opts),
    success: (message, opts) => push('success', message, opts),
    error: (message, opts) => push('error', message, opts),
    info: (message, opts) => push('info', message, opts),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="region" aria-label="Уведомления" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            <span className="toast__icon" aria-hidden="true">{ICONS[t.type]}</span>
            <span className="toast__msg">{t.message}</span>
            <button className="toast__close" aria-label="Закрыть уведомление" onClick={() => remove(t.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const ICONS = {
  success: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>,
  error: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-5M12 8h.01" /></svg>,
}

export function useToast() {
  const ctx = useContext(ToastContext)
  // Безопасный no-op fallback, если провайдер не смонтирован.
  return ctx ?? { show() {}, success() {}, error() {}, info() {} }
}
