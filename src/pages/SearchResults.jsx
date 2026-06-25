import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getVideos } from '../firebase/db'
import VideoCard from '../components/VideoCard'
import CategoryFilter from '../components/CategoryFilter'
import { CardSkeletonGrid } from '../components/CardSkeleton'
import EmptyState3D from '../components/visuals/EmptyState3D'

const SearchIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
)

function dateVal(v) {
  if (v.date?.toMillis) return v.date.toMillis()
  if (v.date) return new Date(v.date).getTime()
  return 0
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [term, setTerm] = useState(q)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('Все')
  const [sort, setSort] = useState('relevance')

  useEffect(() => { setTerm(q) }, [q])
  useEffect(() => { getVideos().then(v => { setVideos(v); setLoading(false) }) }, [])

  const results = useMemo(() => {
    const ql = q.toLowerCase()
    let r = videos.filter(v => {
      const matchSearch = !ql ||
        v.title.toLowerCase().includes(ql) ||
        (v.description || '').toLowerCase().includes(ql)
      const matchCat = category === 'Все' || v.category === category
      return matchSearch && matchCat
    })
    if (sort === 'views') r = [...r].sort((a, b) => (b.views || 0) - (a.views || 0))
    else if (sort === 'newest') r = [...r].sort((a, b) => dateVal(b) - dateVal(a))
    return r
  }, [videos, q, category, sort])

  function submit(e) {
    e.preventDefault()
    setSearchParams(term.trim() ? { q: term.trim() } : {})
  }

  return (
    <main className="wrap" style={{ paddingBottom: 64 }}>
      <section className="search-hero glass reveal">
        <span className="eyebrow">Поиск по платформе</span>
        <h1 className="search-hero__title">Найди что-то <span className="grad-text">особенное</span></h1>
        <form className="search-bar" onSubmit={submit}>
          <div className="search search--big">
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
            <input type="search" value={term} onChange={e => setTerm(e.target.value)} placeholder="Например: React, музыка, кулинария…" aria-label="Поисковый запрос" />
          </div>
          <button type="submit" className="btn btn--primary btn--lg">Искать</button>
        </form>
      </section>

      <div className="search-toolbar reveal">
        <CategoryFilter active={category} onChange={setCategory} />
        <label className="sort">
          <span className="sort__label">Сортировка</span>
          <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Сортировка результатов">
            <option value="relevance">По релевантности</option>
            <option value="views">По просмотрам</option>
            <option value="newest">Сначала новые</option>
          </select>
        </label>
      </div>

      {q && !loading && (
        <p className="section__sub reveal" style={{ marginBottom: 18 }}>
          По запросу «{q}» найдено: <span className="phead__count tnum">{results.length}</span>
        </p>
      )}

      {loading ? (
        <CardSkeletonGrid count={8} />
      ) : results.length === 0 ? (
        <EmptyState3D
          icon={SearchIcon}
          title="Ничего не найдено"
          text={q ? `По запросу «${q}» ничего нет. Попробуйте другой запрос или категорию.` : 'Введите запрос, чтобы начать поиск по каталогу.'}
          ctaText="Перейти в каталог"
          ctaTo="/"
        />
      ) : (
        <div className="grid">
          {results.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
        </div>
      )}
    </main>
  )
}
