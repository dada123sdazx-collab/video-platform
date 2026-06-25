import { useEffect, useState } from 'react'
import { getHistory, getVideoById, clearHistory } from '../firebase/db'
import { useProtectedRoute } from '../hooks/useProtectedRoute'
import { useToast } from '../context/ToastContext'
import VideoCard from '../components/VideoCard'
import { CardSkeletonGrid } from '../components/CardSkeleton'
import EmptyState3D from '../components/visuals/EmptyState3D'

const ClockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
)

function dayLabel(ms) {
  if (!ms) return 'Ранее'
  const d = new Date(ms)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yest = new Date(today); yest.setDate(yest.getDate() - 1)
  const day = new Date(d); day.setHours(0, 0, 0, 0)
  if (day.getTime() === today.getTime()) return 'Сегодня'
  if (day.getTime() === yest.getTime()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function WatchHistory() {
  const user = useProtectedRoute()
  const toast = useToast()
  const [groups, setGroups] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const history = await getHistory(user.uid)
      const videos = await Promise.all(history.map(async h => {
        const v = await getVideoById(h.videoId)
        return v ? { ...v, watchedAt: h.date?.toMillis ? h.date.toMillis() : 0 } : null
      }))
      const list = videos.filter(Boolean)
      setCount(list.length)
      // группируем по дням (история уже отсортирована новее→старее)
      const map = new Map()
      for (const v of list) {
        const key = dayLabel(v.watchedAt)
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(v)
      }
      setGroups([...map.entries()])
      setLoading(false)
    }
    load()
  }, [user])

  async function handleClear() {
    if (!user || clearing) return
    setClearing(true)
    try {
      await clearHistory(user.uid)
      setGroups([]); setCount(0); setConfirm(false)
      toast.success('История очищена')
    } catch {
      toast.error('Не удалось очистить историю')
    } finally {
      setClearing(false)
    }
  }

  return (
    <main className="wrap" style={{ paddingBottom: 64 }}>
      <header className="phead reveal">
        <span className="phead__icon">{ClockIcon}</span>
        <div className="phead__t">
          <span className="eyebrow">Лента активности</span>
          <h1>История просмотров</h1>
          <p>
            {loading ? 'Загружаем историю…'
              : count === 0 ? 'Просмотренные видео будут появляться здесь'
              : <><span className="phead__count tnum">{count}</span> видео в истории</>}
          </p>
        </div>
        {count > 0 && !loading && (
          <div className="phead__actions">
            <button className="btn btn--secondary btn--sm" onClick={() => setConfirm(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              Очистить
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <CardSkeletonGrid count={8} />
      ) : count === 0 ? (
        <EmptyState3D
          icon={ClockIcon}
          title="История пуста"
          text="Смотрите видео — и они будут сохраняться здесь, сгруппированные по дням, чтобы легко вернуться к ним."
          ctaText="Начать смотреть"
          ctaTo="/"
        />
      ) : (
        groups.map(([label, items]) => (
          <section key={label} className="hist-group">
            <div className="hist-group__label reveal"><span className="dot" /> {label}</div>
            <div className="grid">
              {items.map((v, i) => <VideoCard key={`${label}-${v.id}-${i}`} video={v} index={i} />)}
            </div>
          </section>
        ))
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => !clearing && setConfirm(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Очистить историю" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <h3>Очистить историю?</h3>
              <button className="icon-btn" onClick={() => setConfirm(false)} aria-label="Закрыть" disabled={clearing}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
              </button>
            </div>
            <div className="modal__body">
              <p style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
                Все {count} записей будут удалены без возможности восстановления. Сами видео останутся в каталоге.
              </p>
              <div className="modal__actions">
                <button className="btn btn--ghost" onClick={() => setConfirm(false)} disabled={clearing}>Отмена</button>
                <button className="btn btn--danger" onClick={handleClear} disabled={clearing}>
                  {clearing ? <span className="btn-spinner" aria-hidden="true" /> : null}
                  {clearing ? 'Очищаем…' : 'Очистить историю'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
