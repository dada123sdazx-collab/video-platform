import { Link } from 'react-router-dom'
import MediaOrb from './MediaOrb'

/**
 * Премиальное пустое состояние с 3D-слотом (или светящимся орбом-fallback).
 * Используется на favorites/history/search/комментариях и т.п.
 *
 * props:
 *  - icon: React-нода (svg), показывается поверх орба
 *  - title, text
 *  - ctaText + (ctaTo | onCta): кнопка действия
 *  - asset: url/элемент 3D-визуала (необязательно)
 */
export default function EmptyState3D({
  icon,
  title,
  text,
  ctaText,
  ctaTo,
  onCta,
  asset = null,
  children,
}) {
  return (
    <div className="empty3d reveal">
      <div className="empty3d__viz">
        <MediaOrb asset={asset} size="clamp(150px, 22vw, 210px)" particles={false} parallax={false} />
        {icon && <span className="empty3d__icon" aria-hidden="true">{icon}</span>}
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {ctaText && ctaTo && (
        <Link to={ctaTo} className="btn btn--primary" style={{ marginTop: 8 }}>{ctaText}</Link>
      )}
      {ctaText && onCta && (
        <button className="btn btn--primary" style={{ marginTop: 8 }} onClick={onCta}>{ctaText}</button>
      )}
      {children}
    </div>
  )
}
