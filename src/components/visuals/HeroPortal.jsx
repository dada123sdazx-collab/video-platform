import { useEffect, useRef } from 'react'
import Particles from './Particles'

const Play = (
  <svg viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" fill="currentColor"/></svg>
)

function Card({ mod, label }) {
  return (
    <div className={`portal__card portal__card--${mod}`}>
      <div className="portal__card-inner">
        <div className="portal__card-thumb">
          <span className="portal__card-play">{Play}</span>
        </div>
        <div className="portal__card-meta">
          <span className="portal__card-tag">{label}</span>
          <i /><i />
        </div>
      </div>
    </div>
  )
}

/**
 * Живой 3D media-portal для hero (CSS 3D-transforms, без WebGL).
 * - орбитальные светящиеся кольца + play-ядро + парящие видео-карточки
 *   + голографические фрагменты + частицы;
 * - parallax от курсора (rAF, lerp) — отключается на touch/reduced-motion;
 * - scroll-zoom: при прокрутке сцена приближается и плавно растворяется,
 *   создавая ощущение «погружения»;
 * - пауза анимаций вне вьюпорта (IntersectionObserver) ради производительности.
 * Декоративен (aria-hidden), pointer-events:none.
 */
export default function HeroPortal() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const mq = (q) => (window.matchMedia ? window.matchMedia(q).matches : false)
    const reduce = mq('(prefers-reduced-motion: reduce)')
    const coarse = mq('(pointer: coarse)')

    let raf = 0
    let cx = 0, cy = 0, tx = 0, ty = 0

    function onMove(e) {
      const r = root.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width - 0.5
      ty = (e.clientY - r.top) / r.height - 0.5
      if (!raf) raf = requestAnimationFrame(loop)
    }
    function loop() {
      raf = 0
      cx += (tx - cx) * 0.08
      cy += (ty - cy) * 0.08
      root.style.setProperty('--ry', `${(cx * 14).toFixed(2)}deg`)
      root.style.setProperty('--rx', `${(-cy * 11).toFixed(2)}deg`)
      root.style.setProperty('--px', cx.toFixed(3))
      root.style.setProperty('--py', cy.toFixed(3))
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(loop)
    }

    let sraf = 0
    function onScroll() {
      if (sraf) return
      sraf = requestAnimationFrame(() => {
        sraf = 0
        const vh = window.innerHeight || 1
        const p = Math.min(1, Math.max(0, window.scrollY / (vh * 0.85)))
        root.style.setProperty('--sp', p.toFixed(3))
      })
    }

    if (!reduce && !coarse) window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const io = new IntersectionObserver(
      ([e]) => root.classList.toggle('is-paused', !e.isIntersecting),
      { threshold: 0 },
    )
    io.observe(root)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
      if (sraf) cancelAnimationFrame(sraf)
    }
  }, [])

  return (
    <div className="portal" ref={rootRef} aria-hidden="true">
      <div className="portal__scene">
        <div className="portal__halo" />
        <div className="portal__ring portal__ring--1" />
        <div className="portal__ring portal__ring--2" />
        <div className="portal__ring portal__ring--3" />

        <div className="portal__core">
          <div className="portal__swirl" />
          <div className="portal__sheen" />
          <div className="portal__play">{Play}</div>
        </div>

        <Card mod="a" label="Trending" />
        <Card mod="b" label="Shorts" />
        <Card mod="c" label="4K" />

        <div className="portal__frag portal__frag--1"><span /><span /><span /></div>
        <div className="portal__frag portal__frag--2"><span /><span /></div>

        <span className="portal__spark portal__spark--1">{Play}</span>
        <span className="portal__spark portal__spark--2">{Play}</span>
      </div>

      <Particles count={22} />
    </div>
  )
}
