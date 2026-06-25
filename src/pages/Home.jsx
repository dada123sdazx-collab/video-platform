import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getVideos } from '../firebase/db'
import { getPopularShorts } from '../firebase/shorts'
import VideoCard from '../components/VideoCard'
import CategoryFilter from '../components/CategoryFilter'
import ShortPreviewCard from '../components/shorts/ShortPreviewCard'

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

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) } })
    }, { threshold: 0.08 })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [loading])

  const filtered = useMemo(() => videos.filter(v => {
    const matchCat = category === 'Все' || v.category === category
    const matchQ = v.title.toLowerCase().includes(search.toLowerCase()) || (v.description||'').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchQ
  }), [videos, search, category])

  const featured = videos[0]

  return (
    <div className="shell">
      {/* HERO */}
      {!loading && featured && (
        <section className="hero wrap">
          <div className="hero__grid">
            <div className="hero__copy">
              <span className="eyebrow reveal" style={{'--d':'60ms'}}>Новый формат просмотра</span>
              <h1 className="hero__title reveal" style={{'--d':'140ms'}}>
                Смотри видео<br />в <span className="grad">новом формате</span>
              </h1>
              <p className="hero__lead reveal" style={{'--d':'240ms'}}>
                Современная видеоплатформа с удобным каталогом, умным поиском и cinematic-интерфейсом.
              </p>
              <div className="hero__cta reveal" style={{'--d':'340ms'}}>
                <Link to={`/video/${featured.id}`} className="btn btn--primary btn--lg">
                  <svg viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" fill="currentColor"/></svg>
                  Смотреть сейчас
                </Link>
                <a href="#catalog" className="btn btn--secondary btn--lg">Открыть каталог</a>
              </div>
              <div className="hero__stats reveal" style={{'--d':'440ms'}}>
                <div className="hero__stat"><div className="n"><span className="accent">{videos.length}+</span></div><div className="l">видео в каталоге</div></div>
                <div className="hero__stat"><div className="n">5</div><div className="l">категорий</div></div>
                <div className="hero__stat"><div className="n">4.9★</div><div className="l">средний рейтинг</div></div>
              </div>
            </div>

            <div className="hero__previewwrap reveal" style={{'--d':'300ms'}}>
              <div className="hero__preview">
                <div className="hero__float hero__float--tl">
                  <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>
                  <div><div className="t">{videos.reduce((a,v) => a+(v.views||0), 0).toLocaleString('ru')} просмотров</div><div className="s">всего на платформе</div></div>
                </div>
                <div className="poster" style={{ aspectRatio:'16/10.5', borderRadius:0 }}>
                  <div className="poster__art" style={
                    featured.thumbnail
                      ? { backgroundImage:`url(${featured.thumbnail})`, backgroundSize:'cover', backgroundPosition:'center' }
                      : { background:'linear-gradient(135deg, oklch(0.22 0.04 50), oklch(0.18 0.06 28))' }
                  } />
                  <div className="poster__scrim" />
                  <div className="poster__tag"><span className="badge badge--featured">★ Featured</span></div>
                  <Link to={`/video/${featured.id}`} className="hero__bigplay" aria-label="Воспроизвести">
                    <svg viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" fill="currentColor"/></svg>
                  </Link>
                </div>
                <div className="hero__preview-bar">
                  <div className="hero__preview-meta">
                    <div className="t">{featured.title}</div>
                    <div className="s">{featured.category} · {(featured.views||0).toLocaleString('ru')} просмотров</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
          <div className="empty">
            <div className="empty__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg></div>
            <h3>Ничего не найдено</h3>
            <p>Попробуй изменить запрос или выбрать другую категорию.</p>
            <button className="btn btn--secondary" style={{ marginTop:14 }} onClick={() => { setSearch(''); setCategory('Все') }}>Сбросить фильтры</button>
          </div>
        ) : (
          <div className="grid reveal">
            {filtered.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer__grid">
            <div className="footer__brand">
              <Link to="/" className="brand"><span className="brand__mark"><svg viewBox="0 0 24 24"><path d="M9 6.3v11.4a1 1 0 0 0 1.5.86l9.4-5.7a1 1 0 0 0 0-1.72l-9.4-5.7A1 1 0 0 0 9 6.3Z" fill="#1a1206"/></svg></span><span className="brand__name">VIEW<b>·</b>TUBE</span></Link>
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
