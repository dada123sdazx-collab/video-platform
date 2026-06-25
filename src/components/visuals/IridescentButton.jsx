import { useRef } from 'react'
import { Link } from 'react-router-dom'

/**
 * Кнопка с перламутровой (mother-of-pearl) переливающейся текстурой.
 * Интерактивная: радужный блик следует за курсором (через CSS-переменные
 * --mx/--my). Анимация перелива — в CSS (.btn--iridescent), гасится при
 * prefers-reduced-motion.
 *
 * Полиморфна: to → <Link>, href → <a>, иначе → <button>.
 */
export default function IridescentButton({ to, href, children, className = '', size = 'btn--lg', ...rest }) {
  const ref = useRef(null)

  function move(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
  }
  function leave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--mx', '50%')
    el.style.setProperty('--my', '50%')
  }

  const cls = `btn ${size} btn--iridescent ${className}`.trim()
  const handlers = { ref, className: cls, onMouseMove: move, onMouseLeave: leave }

  if (to) return <Link to={to} {...handlers} {...rest}>{children}</Link>
  if (href) return <a href={href} {...handlers} {...rest}>{children}</a>
  return <button type="button" {...handlers} {...rest}>{children}</button>
}
