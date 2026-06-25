import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Отслеживает активный (видимый) элемент ленты через IntersectionObserver.
 * Возвращает activeIndex и колбэк registerItem(index, el) для регистрации
 * DOM-узлов карточек.
 *
 * @param {object} opts
 * @param {React.RefObject} opts.rootRef — контейнер-скроллер.
 * @param {number} opts.count — число элементов (для пересоздания наблюдателя).
 */
export function useActiveShort({ rootRef, count }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const els = useRef(new Map())
  const observer = useRef(null)

  const registerItem = useCallback((index, el) => {
    const map = els.current
    const prev = map.get(index)
    if (prev && prev !== el && observer.current) observer.current.unobserve(prev)
    if (el) {
      map.set(index, el)
      el.dataset.index = String(index)
      if (observer.current) observer.current.observe(el)
    } else {
      map.delete(index)
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    observer.current = new IntersectionObserver(
      (entries) => {
        let best = null
        for (const e of entries) {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e
        }
        if (best) {
          const idx = Number(best.target.dataset.index)
          if (!Number.isNaN(idx)) setActiveIndex(idx)
        }
      },
      { root, threshold: [0.5, 0.75] },
    )

    els.current.forEach((el) => observer.current.observe(el))
    return () => { observer.current?.disconnect(); observer.current = null }
    // count пересоздаёт наблюдатель при изменении длины ленты
  }, [rootRef, count])

  return { activeIndex, setActiveIndex, registerItem }
}
