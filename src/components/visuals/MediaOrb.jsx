import { useMemo, useRef } from 'react'
import Particles from './Particles'

/**
 * Универсальный слот под 3D / медиа-визуал.
 *
 * Если в `asset` передан URL картинки/видео ИЛИ готовый React-элемент
 * (Spline / Lottie / <canvas> three.js) — он рендерится внутри слота.
 * Если ассета нет — показывается анимированный CSS-fallback (светящаяся
 * сфера с орбитой), чтобы блок никогда не выглядел пустым, пока реальные
 * 3D-элементы не подложены.
 *
 * Поддерживает лёгкий parallax от движения курсора (отключается на
 * prefers-reduced-motion через CSS) и слой частиц.
 */
export default function MediaOrb({
  asset = null,
  size = 'clamp(200px, 32vw, 360px)',
  parallax = true,
  particles = true,
  className = '',
}) {
  const ref = useRef(null)

  function handleMove(e) {
    if (!parallax || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * 26
    const y = ((e.clientY - r.top) / r.height - 0.5) * 26
    ref.current.style.setProperty('--px', `${x.toFixed(1)}px`)
    ref.current.style.setProperty('--py', `${y.toFixed(1)}px`)
  }

  function reset() {
    if (!ref.current) return
    ref.current.style.setProperty('--px', '0px')
    ref.current.style.setProperty('--py', '0px')
  }

  const content = useMemo(() => {
    if (!asset) {
      return (
        <>
          <span className="viz-ring" aria-hidden="true" />
          <div className="viz-orb" aria-hidden="true" />
        </>
      )
    }
    if (typeof asset === 'string') {
      const isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(asset)
      return isVideo ? (
        <video src={asset} autoPlay muted loop playsInline />
      ) : (
        <img src={asset} alt="" loading="lazy" />
      )
    }
    return asset
  }, [asset])

  return (
    <div
      ref={ref}
      className={`viz-slot ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ '--s': size, width: size, height: size }}
    >
      {particles && <Particles />}
      <div className="viz-orbwrap">{content}</div>
    </div>
  )
}
