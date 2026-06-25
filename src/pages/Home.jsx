import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getVideos } from '../firebase/db'
import { getPopularShorts } from '../firebase/shorts'
import VideoCard from '../components/VideoCard'
import CategoryFilter from '../components/CategoryFilter'
import ShortPreviewCard from '../components/shorts/ShortPreviewCard'
import Particles from '../components/visuals/Particles'
import MediaOrb from '../components/visuals/MediaOrb'
import EmptyState3D from '../components/visuals/EmptyState3D'
import CountUp from '../components/visuals/CountUp'
import IridescentButton from '../components/visuals/IridescentButton'

// Тяжёлый 3D-портал грузим лениво (lazy) — не блокирует первый рендер.
const HeroPortal = lazy(() => import('../components/visuals/HeroPortal'))

function CardSkeleton() {
  return (
    <div className="card skeleton">
      <div className="sk sk--poster" />
      <div className="card__body" style={{ gap:10 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div className="sk" style={{ width:34, height:34, borderRadius:'50%', flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div className="sk sk--title" style={{ marginBottom:8 }} />
            <div className="sk sk--line" style={{ width:'60%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [videos, setVideos] = useState([])
  const [shorts, setShorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Все')

  useEffect(() => {
    getVideos().then(v => { setVideos(v); setLoading(false) })
    getPopularShorts(10).then(setShorts).catch(() => setShorts([]))
  }, [])

  const filtered = useMemo(() => videos.filter(v => {
    const matchCat = category === 'Все' || v.category === category
    const matchQ = v.title.toLowerCase().includes(search.toLowerCase()) || (v.description||'').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchQ
  }), [videos, search, category])

  const featured = videos[0]
  const totalViews = videos.reduce((a, v) => a + (v.views || 0), 0)

  return (
    <div className="shell">
      {/* HERO — cinematic, виден всегда (даже когда каталог пуст) */}
      <section className="hero wrap">
        <div className="hero__bg" aria-hidden="true"><i /><i /><i /></div>
        <Particles count={28} />
        <div className="hero__grid">
          <div className="hero__copy">
            <span className="eyebrow reveal" style={{ '--d': '40ms' }}>Cinematic streaming experience</span>
            <h1 className="hero__title reveal" style={{ '--d': '120ms' }}>
              Смотри видео<br />в <span className="grad">новом измерении</span>
            </h1>
            <p className="hero__lead reveal" style={{ '--d': '220ms' }}>
              Премиальная видеоплатформа: глубокий тёмный интерфейс, умный поиск,
              вертикальные Shorts и плавные cinematic-анимации.
            </p>
            <div className="hero__cta reveal" style={{ '--d': '320ms' }}>
              {featured ? (
                <IridescentButton to={`/video/${featured.id}`}>
                  <svg viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" fill="currentColor"/></svg>
                  Смотреть видео
                </IridescentButton>
              ) : (
                <IridescentButton href="#catalog">
                  <svg viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" fill="currentColor"/></svg>
                  Смотреть видео
                </IridescentButton>
              )}
              <Link to="/shorts" className="btn btn--secondary btn--lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="3" width="12" height="18" rx="3"/><path d="M11 9l3 2-3 2z" fill="currentColor"/></svg>
                Открыть Shorts
              </Link>
            </div>
            <div className="hero__stats reveal" style={{ '--d': '420ms' }}>
              <div className="hero__stat"><div className="n tnum"><CountUp className="accent" value={videos.length} /></div><div className="l">видео в каталоге</div></div>
              <div className="hero__stat"><div className="n tnum"><CountUp value={shorts.length} /></div><div className="l">Shorts в ленте</div></div>
              <div className="hero__stat"><div className="n">4K</div><div className="l">cinematic UI</div></div>
            </div>
          </div>

          {/* 3D-СЦЕНА: сюда можно подложить свой ассет — <MediaOrb asset="/your-3d.png" /> */}
          <div className="hero__stage reveal" style={{ '--d': '240ms' }}>
            <div className="hero__glow" aria-hidden="true" />
            <Suspense fallback={<MediaOrb size="clamp(260px, 34vw, 440px)" particles={false} />}>
              <HeroPortal />
            </Suspense>

            <div className="hero__float hero__float--tl">
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>
              <div><div className="t tnum"><CountUp value={totalViews} /> просмотров</div><div className="s">всего на платформе</div></div>
            </div>

            <div className="hero__float hero__float--br">
              {featured ? (
                <>
                  <span className="ic"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z"/></svg></span>
                  <div><div className="t">{featured.title?.slice(0, 22)}</div><div className="s">{featured.category}</div></div>
                </>
              ) : (
                <>
                  <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3l1.9 5.8L20 9l-4.6 3.9L17 19l-5-3.4L7 19l1.6-6.1L4 9l6.1-.2z"/></svg></span>
                  <div><div className="t">Cinematic feed</div><div className="s">purple · cyan · neon</div></div>
                </>
              )}
            </div>
          </div>
        </div>
        <a href="#catalog" className="hero__scroll" aria-label="Листать к каталогу"><span /></a>
      </section>

      {/* DISCOVER */}
      <section className="wrap section" style={{ paddingBottom:0 }}>
        <div className="discover reveal">
          <div className="discover__top">
            <div>
              <h2>Что смотрим <span style={{ color:'var(--accent)' }}>сегодня?</span></h2>
              <p className="section__sub" style={{ marginTop:6 }}>Найди нужное видео или выбери категорию</p>
            </div>
            <form className="search" onSubmit={e => { e.preventDefault() }} style={{ flex:1, minWidth:240, maxWidth:440 }}>
              <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
              <input type="search" placeholder="Например: React, музыка, кулинария…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </form>
          </div>
          <CategoryFilter active={category} onChange={setCategory} />
        </div>
      </section>

      {/* POPULAR SHORTS */}
      {shorts.length > 0 && (
        <section className="wrap section" style={{ paddingBottom: 0 }}>
          <div className="section__head">
            <div>
              <h2 className="section__title">Популярные <span className="accent">Shorts</span></h2>
              <p className="section__sub">Короткие вертикальные видео</p>
            </div>
            <Link to="/shorts" className="section__more">Смотреть ленту →</Link>
          </div>
          <div className="scroller shorts-rail">
            {shorts.map(s => <ShortPreviewCard key={s.id} short={s} />)}
          </div>
        </section>
      )}

      {/* CATALOG */}
      <section className="wrap section" id="catalog">
        <div className="section__head reveal">
          <div>
            <h2 className="section__title">Популярные <span className="accent">видео</span></h2>
            <p className="section__sub">{loading ? '…' : `${filtered.length} видео по запросу`}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid">
            {Array.from({length:8}).map((_,i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState3D
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>}
            title={videos.length === 0 ? 'Каталог пока пуст' : 'Ничего не найдено'}
            text={videos.length === 0
              ? 'Здесь появятся видео, как только они будут добавлены. Загрузите первое или откройте Shorts.'
              : 'Попробуйте изменить запрос или выбрать другую категорию.'}
            ctaText={videos.length === 0 ? 'Добавить видео' : 'Сбросить фильтры'}
            {...(videos.length === 0
              ? { ctaTo: '/author' }
              : { onCta: () => { setSearch(''); setCategory('Все') } })}
          />
        ) : (
          <div className="grid">
            {filtered.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer__grid">
            <div className="footer__brand">
              <Link to="/" className="brand"><span className="brand__mark"><svg viewBox="0 0 24 24"><path d="M9 6.3v11.4a1 1 0 0 0 1.5.86l9.4-5.7a1 1 0 0 0 0-1.72l-9.4-5.7A1 1 0 0 0 9 6.3Z" fill="#fff"/></svg></span><span className="brand__name">VIEW<b>·</b>TUBE</span></Link>
              <p>Современная видеоплатформа на React. Смотри, ищи и сохраняй лучшее видео.</p>
            </div>
            <div className="footer__col"><h5>Платформа</h5><Link to="/">Главная</Link><a href="#catalog">Каталог</a></div>
            <div className="footer__col"><h5>Аккаунт</h5><Link to="/login">Войти</Link><Link to="/register">Регистрация</Link><Link to="/favorites">Избранное</Link></div>
          </div>
          <div className="footer__bottom"><span>© 2026 ViewTube</span><span>Cinematic streaming UI · React + Firebase</span></div>
        </div>
      </footer>
    </div>
  )
}
