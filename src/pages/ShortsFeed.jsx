import { useParams } from 'react-router-dom'
import { useShortsFeed } from '../hooks/useShortsFeed'
import { useAuth } from '../context/AuthContext'
import ShortsViewport from '../components/shorts/ShortsViewport'
import ShortSkeleton from '../components/shorts/ShortSkeleton'
import ShortEmptyState from '../components/shorts/ShortEmptyState'
import ShortErrorState from '../components/shorts/ShortErrorState'

/** Страница ленты shorts (/shorts и /shorts/:id). */
export default function ShortsFeed() {
  const { id } = useParams()
  const { user } = useAuth()
  const { items, loading, loadingMore, error, hasMore, loadMore, retry, removeItem } = useShortsFeed(id || null)

  return (
    <div className="shorts-page">
      {loading ? (
        <div className="shorts-viewport">
          <ShortSkeleton />
        </div>
      ) : error ? (
        <ShortErrorState onRetry={retry} />
      ) : items.length === 0 ? (
        <ShortEmptyState canUpload={!!user} />
      ) : (
        <ShortsViewport
          items={items}
          hasMore={hasMore}
          loadingMore={loadingMore}
          loadMore={loadMore}
          onDeleted={removeItem}
        />
      )}
    </div>
  )
}
