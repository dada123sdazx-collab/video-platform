import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { getHistory, getVideoById } from '../firebase/db'
import { useProtectedRoute } from '../hooks/useProtectedRoute'
import VideoCard from '../components/VideoCard'

export default function WatchHistory() {
  const user = useProtectedRoute()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const history = await getHistory(user.uid)
      const videoPromises = history.map(h => getVideoById(h.videoId))
      const results = await Promise.all(videoPromises)
      setItems(results.filter(Boolean))
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="text-violet-600 dark:text-violet-400" size={22} />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">История просмотров</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 text-gray-400 dark:text-gray-500">
          <p className="text-5xl mb-4">📺</p>
          <p className="text-lg">История пуста</p>
          <p className="text-sm mt-1 mb-4">Просмотренные видео будут отображаться здесь</p>
          <Link to="/" className="text-violet-600 dark:text-violet-400 hover:underline text-sm">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(v => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </main>
  )
}
