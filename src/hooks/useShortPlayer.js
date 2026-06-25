import { useCallback, useEffect, useState } from 'react'

/**
 * Управляет одним <video> short: автозапуск активного, пауза неактивного,
 * обход autoplay-ограничений (если со звуком нельзя — стартуем без звука),
 * состояния загрузки/ошибки. Останавливает видео при размонтировании.
 *
 * @param {React.RefObject<HTMLVideoElement>} videoRef
 * @param {object} opts
 * @param {boolean} opts.active  — активна ли карточка в ленте
 * @param {boolean} opts.muted   — глобальный mute ленты
 * @param {(forced:boolean)=>void} [opts.onMutedFallback] — вызывается, если
 *        пришлось включить mute из-за autoplay-политики браузера
 */
export function useShortPlayer(videoRef, { active, muted, ready = true, onMutedFallback }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)

  const attemptPlay = useCallback(async () => {
    const v = videoRef.current
    if (!v) return
    try {
      await v.play()
      setPlaying(true)
    } catch {
      // autoplay со звуком заблокирован — пробуем без звука
      try {
        v.muted = true
        onMutedFallback?.(true)
        await v.play()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    }
  }, [videoRef, onMutedFallback])

  // Реакция на смену активности (ready — смонтирован ли <video>)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active) {
      attemptPlay()
    } else {
      v.pause()
      setPlaying(false)
      // перематываем неактивные в начало — следующий показ с нуля
      try { v.currentTime = 0 } catch { /* noop */ }
    }
  }, [active, attemptPlay, videoRef, ready])

  // Синхронизация mute
  useEffect(() => {
    const v = videoRef.current
    if (v) v.muted = muted
  }, [muted, videoRef, ready])

  // Подписки на события + очистка (без утечек). ready в зависимостях —
  // чтобы переподписаться, когда <video> монтируется лениво.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onWaiting = () => setLoading(true)
    const onPlaying = () => { setLoading(false); setError(false); setPlaying(true) }
    const onCanPlay = () => setLoading(false)
    const onError = () => { setError(true); setLoading(false) }
    const onPause = () => setPlaying(false)

    v.addEventListener('waiting', onWaiting)
    v.addEventListener('playing', onPlaying)
    v.addEventListener('canplay', onCanPlay)
    v.addEventListener('loadeddata', onCanPlay)
    v.addEventListener('error', onError)
    v.addEventListener('pause', onPause)

    return () => {
      v.removeEventListener('waiting', onWaiting)
      v.removeEventListener('playing', onPlaying)
      v.removeEventListener('canplay', onCanPlay)
      v.removeEventListener('loadeddata', onCanPlay)
      v.removeEventListener('error', onError)
      v.removeEventListener('pause', onPause)
      v.pause()
    }
  }, [videoRef, ready])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) attemptPlay()
    else { v.pause(); setPlaying(false) }
  }, [attemptPlay, videoRef])

  const retry = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setError(false)
    setLoading(true)
    try { v.load() } catch { /* noop */ }
    if (active) attemptPlay()
  }, [active, attemptPlay, videoRef])

  return { loading, error, playing, togglePlay, retry }
}
