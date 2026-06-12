import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getVideos } from '../firebase/db'
import VideoCard from '../components/VideoCard'
import CategoryFilter from '../components/CategoryFilter'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('Все')

  useEffect(() => {
    getVideos().then(v => {
      setVideos(v)
      setLoading(false)
    })
  }, [])

  const results = useMemo(() => {
    return videos.filter(v => {
      const matchSearch = v.title.toLowerCase().includes(q.toLowerCase()) ||
        v.description?.toLowerCase().includes(q.toLowerCase())
      const matchCat = category === 'Все' || v.category === category
      return matchSearch && matchCat
    })
  }, [videos, q, category])

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Результаты поиска: <span className="text-violet-600 dark:text-violet-400">«{q}»</span>
        </h1>
        {!loading && <p className="text-sm text-gray-500 dark:text-gray-400">Найдено: {results.length}</p>}
      </div>

      <div className="mb-4">
        <CategoryFilter active={category} onChange={setCategory} />
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
      ) : results.length === 0 ? (
        <div className="text-center py-24 text-gray-400 dark:text-gray-500">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">Ничего не найдено</p>
          <p className="text-sm mt-1 mb-4">Попробуйте другой запрос или категорию</p>
          <Link to="/" className="text-violet-600 dark:text-violet-400 hover:underline text-sm">Вернуться в каталог</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map(v => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </main>
  )
}
