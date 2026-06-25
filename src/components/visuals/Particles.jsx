import { useMemo } from 'react'

/**
 * Декоративный слой плавающих частиц (фиолетовые/cyan/blue точки).
 * Позиции детерминированы (sin-based PRNG) — без Math.random в рендере,
 * чтобы оставаться «чистой» функцией. Отключается при prefers-reduced-motion
 * через стиль .particles.
 */
function prng(i, salt) {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export default function Particles({ count = 16 }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        left: prng(i, 1) * 100,
        size: 2 + prng(i, 2) * 4,
        dur: 7 + prng(i, 3) * 9,
        delay: prng(i, 4) * 9,
      })),
    [count],
  )

  return (
    <div className="particles" aria-hidden="true">
      {items.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
