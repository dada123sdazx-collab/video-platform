import { useCallback, useRef } from 'react'

/**
 * 3D-наклон карточки за курсором + позиция для блика-прожектора.
 * Пишет CSS-переменные на элемент: --rx/--ry (наклон) и --mx/--my (блик).
 * No-op при prefers-reduced-motion. На touch просто не срабатывает (нет hover).
 */
export function useTilt(max = 6) {
  const ref = useRef(null)

  const onMouseMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
  }, [max])

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
