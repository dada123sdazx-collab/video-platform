import { useEffect, useRef, useState } from 'react'

/**
 * Анимированный счётчик: плавно «докручивает» число от 0 до value
 * (easeOutCubic) при появлении/изменении. Уважает prefers-reduced-motion.
 */
export default function CountUp({ value, duration = 1300, className }) {
  const [n, setN] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    const to = Number(value) || 0
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setN(to); return }
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.round(to * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return <span className={className}>{n.toLocaleString('ru')}</span>
}
