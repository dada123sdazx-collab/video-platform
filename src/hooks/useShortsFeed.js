import { useCallback, useEffect, useRef, useState } from 'react'
import { getShortsFeed, getShortById } from '../firebase/shorts'

const PAGE = 5

/**
 * Бесконечная лента shorts с курсорной пагинацией.
 * @param {string|null} initialId — если задан, этот short ставится первым
 *   (открытие по прямой ссылке /shorts/:id).
 */
export function useShortsFeed(initialId = null) {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const seen = useRef(new Set())

  const append = useCallback((incoming) => {
    const fresh = incoming.filter((s) => s && !seen.current.has(s.id))
    fresh.forEach((s) => seen.current.add(s.id))
    setItems((prev) => [...prev, ...fresh])
  }, [])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    seen.current = new Set()
    setItems([])
    try {
      let head = []
      if (initialId) {
        const one = await getShortById(initialId)
        if (one) { head = [one]; seen.current.add(one.id) }
      }
      const page = await getShortsFeed({ limit: PAGE })
      const fresh = page.items.filter((s) => !seen.current.has(s.id))
      fresh.forEach((s) => seen.current.add(s.id))
      setItems([...head, ...fresh])
      setCursor(page.cursor)
      setHasMore(page.hasMore)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [initialId])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return
    setLoadingMore(true)
    try {
      const page = await getShortsFeed({ cursor, limit: PAGE })
      append(page.items)
      setCursor(page.cursor)
      setHasMore(page.hasMore && !!page.cursor)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [append, cursor, hasMore, loadingMore])

  useEffect(() => { loadInitial() }, [loadInitial])

  /** Удалить short из ленты локально (после удаления автором). */
  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return { items, loading, loadingMore, error, hasMore, loadMore, retry: loadInitial, removeItem }
}
