import { useEffect, useRef } from 'react'
import { registerShortView } from '../firebase/shortInteractions'
import { getAnonymousId } from '../utils/anonymousId'

const STORE = 'vt_viewed_shorts'
const REVIEW_WINDOW = 6 * 60 * 60 * 1000 // 6 ч: не накручиваем один short повторно

function recentlyViewed(shortId) {
  try {
    const map = JSON.parse(localStorage.getItem(STORE) || '{}')
    const ts = map[shortId]
    return ts && Date.now() - ts < REVIEW_WINDOW
  } catch { return false }
}

function markViewed(shortId) {
  try {
    const map = JSON.parse(localStorage.getItem(STORE) || '{}')
    map[shortId] = Date.now()
    localStorage.setItem(STORE, JSON.stringify(map))
  } catch { /* noop */ }
}

/**
 * Засчитывает просмотр, только если short оставался активным заданное время
 * (для очень коротких — после 50% длительности). Не считает повторно
 * в течение 6 часов и не накручивает при быстром скролле.
 */
export function useDebouncedView({ active, shortId, userId, durationSec = 0 }) {
  const counted = useRef(false)

  useEffect(() => {
    counted.current = false // сброс при смене short
  }, [shortId])

  useEffect(() => {
    if (!active || !shortId || counted.current) return
    if (recentlyViewed(shortId)) { counted.current = true; return }

    const minByDuration = durationSec > 0 && durationSec < 5 ? durationSec * 0.5 * 1000 : Infinity
    const threshold = Math.min(2500, minByDuration === Infinity ? 2500 : minByDuration)

    const t = setTimeout(() => {
      counted.current = true
      markViewed(shortId)
      registerShortView({
        userId: userId || null,
        anonId: userId ? null : getAnonymousId(),
        shortId,
        watchMs: threshold,
        completed: false,
      })
    }, threshold)

    return () => clearTimeout(t)
  }, [active, shortId, userId, durationSec])
}
