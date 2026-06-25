import { useCallback, useEffect, useRef, useState } from 'react'
import ShortVideoCard from './ShortVideoCard'
import { useActiveShort } from '../../hooks/useActiveShort'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

/**
 * Вертикальный scroll-snap контейнер ленты shorts. Держит активным только
 * текущее видео (плееры рендерятся для active±1), управляет mute,
 * клавиатурой и догрузкой следующих страниц.
 */
export default function ShortsViewport({ items, hasMore, loadingMore, loadMore, onDeleted }) {
  const rootRef = useRef(null)
  const slotRefs = useRef([])
  const cardRefs = useRef([])
  const [muted, setMuted] = useState(true)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const { activeIndex, setActiveIndex, registerItem } = useActiveShort({ rootRef, count: items.length })

  const setSlotRef = useCallback((i, el) => {
    slotRefs.current[i] = el
    registerItem(i, el)
  }, [registerItem])

  const scrollToIndex = useCallback((i) => {
    const idx = Math.max(0, Math.min(items.length - 1, i))
    const el = slotRefs.current[idx]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveIndex(idx)
    }
  }, [items.length, setActiveIndex])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])

  // Горячие клавиши (отключаем навигацию, когда открыт оверлей)
  useKeyboardShortcuts({
    next: () => { if (!overlayOpen) scrollToIndex(activeIndex + 1) },
    prev: () => { if (!overlayOpen) scrollToIndex(activeIndex - 1) },
    toggleMute,
    like: () => cardRefs.current[activeIndex]?.like(),
    save: () => cardRefs.current[activeIndex]?.save(),
    comments: () => cardRefs.current[activeIndex]?.openComments(),
  })

  // Догрузка следующих страниц по мере приближения к концу
  useEffect(() => {
    if (hasMore && !loadingMore && activeIndex >= items.length - 2) loadMore()
  }, [activeIndex, hasMore, loadingMore, items.length, loadMore])

  return (
    <div className="shorts-viewport" ref={rootRef}>
      {items.map((short, i) => (
        <div className="short-slot" key={short.id} ref={(el) => setSlotRef(i, el)}>
          <ShortVideoCard
            ref={(el) => { cardRefs.current[i] = el }}
            short={short}
            active={i === activeIndex}
            near={Math.abs(i - activeIndex) <= 1}
            muted={muted}
            onToggleMute={toggleMute}
            onOverlayChange={setOverlayOpen}
            onDeleted={onDeleted}
          />
        </div>
      ))}

      {loadingMore && (
        <div className="short-slot shorts-more" aria-hidden="true">
          <span className="short-spinner" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="shorts-end">Вы посмотрели все shorts ✦</div>
      )}
    </div>
  )
}
