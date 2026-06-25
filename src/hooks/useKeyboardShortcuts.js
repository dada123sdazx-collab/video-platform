import { useEffect } from 'react'

const isTyping = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)

/**
 * Глобальные горячие клавиши ленты shorts.
 * @param {object} handlers — { next, prev, toggleMute, like, save, comments, close }
 * @param {boolean} [enabled=true]
 */
export function useKeyboardShortcuts(handlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e) => {
      if (isTyping(e.target)) {
        if (e.key === 'Escape') handlers.close?.()
        return
      }
      switch (e.key) {
        case 'ArrowDown':
        case ' ':
        case 'Spacebar':
          e.preventDefault(); handlers.next?.(); break
        case 'ArrowUp':
          e.preventDefault(); handlers.prev?.(); break
        case 'm': case 'M': case 'ь':
          handlers.toggleMute?.(); break
        case 'l': case 'L': case 'д':
          handlers.like?.(); break
        case 'f': case 'F': case 'а':
          handlers.save?.(); break
        case 'c': case 'C': case 'с':
          handlers.comments?.(); break
        case 'Escape':
          handlers.close?.(); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlers, enabled])
}
