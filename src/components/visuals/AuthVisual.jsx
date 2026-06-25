import MediaOrb from './MediaOrb'

/**
 * Правая половина экранов входа/регистрации: 3D-слот (или орб-fallback),
 * плавающие медиа-плитки и подпись. Скрывается на узких экранах через CSS.
 */
export default function AuthVisual({ asset = null }) {
  return (
    <aside className="auth-visual">
      <div className="auth-visual__tiles" aria-hidden="true">
        <span className="auth-tile auth-tile--1" />
        <span className="auth-tile auth-tile--2" />
        <span className="auth-tile auth-tile--3" />
      </div>

      <MediaOrb asset={asset} size="clamp(220px, 26vw, 340px)" />

      <div className="auth-visual__copy">
        <h2>Кино-уровень <span className="grad-text">в каждом кадре</span></h2>
        <p>Тысячи видео и Shorts — в одном премиальном пространстве для просмотра.</p>
        <div className="auth-trust">
          <span className="auth-trust__item">React + Firebase</span>
          <span className="auth-trust__item">4K-ready</span>
          <span className="auth-trust__item">Shorts</span>
        </div>
      </div>
    </aside>
  )
}
