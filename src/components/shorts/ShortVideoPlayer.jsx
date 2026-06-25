import { useRef } from 'react'
import { useShortPlayer } from '../../hooks/useShortPlayer'
import { useDebouncedView } from '../../hooks/useDebouncedView'

/**
 * Плеер одного short. Создаёт <video> только для «близких» к активной
 * карточек (near) — иначе показывает обложку, чтобы не держать десятки
 * плееров в DOM. Различает одиночный тап (play/pause) и двойной (лайк).
 */
export default function ShortVideoPlayer({
  short,
  active,
  near,
  muted,
  userId,
  onDoubleTap,
  onMutedFallback,
}) {
  const videoRef = useRef(null)
  const tapTimer = useRef(null)
  const { loading, error, playing, togglePlay, retry } = useShortPlayer(videoRef, {
    active,
    muted,
    ready: near,
    onMutedFallback,
  })

  useDebouncedView({ active, shortId: short.id, userId, durationSec: short.duration })

  const posterStyle = short.thumbnail
    ? { backgroundImage: `url(${short.thumbnail})` }
    : { background: 'linear-gradient(160deg, oklch(0.24 0.05 280), oklch(0.16 0.05 28))' }

  function handleTap() {
    if (tapTimer.current) {
      // второй тап → двойной (лайк)
      clearTimeout(tapTimer.current)
      tapTimer.current = null
      onDoubleTap?.()
      return
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null
      togglePlay()
    }, 250)
  }

  return (
    <div className="short-video">
      {near ? (
        <video
          ref={videoRef}
          className="short-video__el"
          src={short.videoUrl || undefined}
          poster={short.thumbnail || undefined}
          playsInline
          loop
          muted={muted}
          preload="metadata"
          // нативные controls скрыты — управление через жесты/кнопки
        />
      ) : (
        <div className="short-video__poster" style={posterStyle} />
      )}

      {/* Слой жестов */}
      <button
        className="short-video__tap"
        onClick={handleTap}
        aria-label={playing ? 'Пауза' : 'Воспроизвести'}
      />

      {/* Индикатор паузы */}
      {near && active && !playing && !loading && !error && (
        <div className="short-video__pause" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" /></svg>
        </div>
      )}

      {/* Загрузка */}
      {near && active && loading && !error && (
        <div className="short-video__spinner" role="status" aria-label="Загрузка видео">
          <span className="short-spinner" />
        </div>
      )}

      {/* Ошибка */}
      {near && error && (
        <div className="short-video__error">
          <p>Видео недоступно</p>
          <button className="btn btn--secondary btn--sm" onClick={retry}>Повторить</button>
        </div>
      )}

      {/* Затемнение снизу для читаемости текста */}
      <div className="short-video__scrim" aria-hidden="true" />
    </div>
  )
}
