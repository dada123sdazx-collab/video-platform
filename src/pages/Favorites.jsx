import { useEffect, useState } from 'react'
import { getFavorites, getVideoById } from '../firebase/db'
import { useProtectedRoute } from '../hooks/useProtectedRoute'
import VideoCard from '../components/VideoCard'
import { CardSkeletonGrid } from '../components/CardSkeleton'
import EmptyState3D from '../components/visuals/EmptyState3D'

const HeartIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
)

export default function Favorites() {
  const user = useProtectedRoute()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const favs = await getFavorites(user.uid)
      const results = await Promise.all(favs.map(f => getVideoById(f.videoId)))
      setVideos(results.filter(Boolean))
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <main className="wrap" style={{ paddingBottom: 64 }}>
      <header className="phead reveal">
        <span className="phead__icon">{HeartIcon}</span>
        <div className="phead__t">
          <span className="eyebrow">Ваша коллекция</span>
          <h1>Избранное</h1>
          <p>
            {loading ? 'Загружаем сохранённое…'
              : videos.length === 0 ? 'Здесь появятся видео, которые вы сохраните'
              : <>В коллекции <span className="phead__count tnum">{videos.length}</span> видео</>}
          </p>
        </div>
      </header>

      {loading ? (
        <CardSkeletonGrid count={8} />
      ) : videos.length === 0 ? (
        <EmptyState3D
          icon={HeartIcon}
          title="В избранном пока пусто"
          text="Нажимайте «Избранное» на странице видео — и оно появится здесь, в вашей личной коллекции."
          ctaText="Открыть каталог"
          ctaTo="/"
        />
      ) : (
        <div className="grid">
          {videos.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
        </div>
      )}
    </main>
  )
}
