import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useProtectedRoute } from '../hooks/useProtectedRoute'
import { getFavorites, getHistory, getVideoById } from '../firebase/db'
import { getUserShorts, deleteShort } from '../firebase/shorts'
import { getSavedShorts } from '../firebase/shortInteractions'
import VideoCard from '../components/VideoCard'
import ShortPreviewCard from '../components/shorts/ShortPreviewCard'

const TABS = ['Избранное', 'История', 'Мои Shorts', 'Сохранённые', 'Настройки']

function ShortsGridSkeleton() {
  return (
    <div className="shorts-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="sk" style={{ aspectRatio: '9/16', borderRadius: 'var(--r-card)' }} />
      ))}
    </div>
  )
}

export default function Profile() {
  const user = useProtectedRoute()
  const { logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Избранное')
  const [favVideos, setFavVideos] = useState([])
  const [histVideos, setHistVideos] = useState([])
  const [myShorts, setMyShorts] = useState([])
  const [savedShorts, setSavedShorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [shortsLoading, setShortsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [favs, hist] = await Promise.all([getFavorites(user.uid), getHistory(user.uid)])
      const [fv, hv] = await Promise.all([
        Promise.all(favs.map(f => getVideoById(f.videoId))),
        Promise.all(hist.map(h => getVideoById(h.videoId))),
      ])
      setFavVideos(fv.filter(Boolean))
      setHistVideos(hv.filter(Boolean))
      setLoading(false)
    }
    load()
  }, [user])

  useEffect(() => {
    if (!user) return
    Promise.all([getUserShorts(user.uid), getSavedShorts(user.uid)])
      .then(([mine, saved]) => { setMyShorts(mine); setSavedShorts(saved) })
      .finally(() => setShortsLoading(false))
  }, [user])

  async function handleDeleteShort(id, title) {
    if (!confirm(`Удалить short «${title}»?`)) return
    try {
      await deleteShort(id)
      setMyShorts(list => list.filter(s => s.id !== id))
      toast.success('Short удалён')
    } catch {
      toast.error('Не удалось удалить')
    }
  }

  if (!user) return null

  const initial = (user.displayName || user.email)?.[0]?.toUpperCase()
  const joined = user.metadata?.creationTime ? new Date(user.metadata.creationTime).getFullYear() : 2024
  const currentVideos = tab === 'Избранное' ? favVideos : histVideos

  return (
    <main className="wrap" style={{ paddingBottom: 60 }}>

      {/* ── Profile header ── */}
      <div style={{ position:'relative', marginTop:18, borderRadius:'var(--r-lg)', overflow:'hidden', border:'1px solid var(--line-2)' }}>
        {/* Cover */}
        <div style={{ height:200, position:'relative' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, oklch(0.25 0.08 280) 0%, oklch(0.2 0.1 320) 50%, oklch(0.18 0.06 28) 100%)' }} />
          <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(115deg,rgba(255,255,255,0.04) 0 2px,transparent 2px 9px)', mixBlendMode:'overlay' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 30%,var(--card) 100%)' }} />
        </div>

        {/* Body */}
        <div style={{ position:'relative', marginTop:-52, padding:'0 clamp(22px,3vw,34px) 28px', display:'flex', alignItems:'flex-end', gap:22, flexWrap:'wrap', background:'var(--card)' }}>
          <div style={{ width:104, height:104, borderRadius:26, border:'3px solid var(--card)', background:'linear-gradient(150deg,oklch(0.45 0.13 280),oklch(0.4 0.15 330))', display:'grid', placeItems:'center', fontFamily:'Space Grotesk', fontWeight:600, fontSize:38, color:'#fff', flexShrink:0, boxShadow:'0 8px 32px rgba(0,0,0,.5)' }}>
            {initial}
          </div>
          <div style={{ paddingBottom:6, flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, fontFamily:'Space Grotesk', fontWeight:600, fontSize:'clamp(22px,3vw,32px)', letterSpacing:'-0.02em' }}>
              {user.displayName || 'Пользователь'}
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" style={{ width:22, height:22, flexShrink:0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            </div>
            <div style={{ color:'var(--faint)', marginTop:4, fontSize:14 }}>{user.email} · на платформе с {joined}</div>
          </div>
          <div style={{ display:'flex', gap:10, paddingBottom:8 }}>
            <button className="btn btn--secondary btn--sm" onClick={() => navigate('/')}>← Главная</button>
            <button className="btn btn--ghost btn--sm" onClick={() => { logout(); navigate('/') }}>Выйти</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:28, padding:'18px clamp(22px,3vw,34px)', background:'var(--card)', borderTop:'1px solid var(--line)', flexWrap:'wrap' }}>
          {[
            { n: histVideos.length || (loading ? '…' : 0), l: 'просмотрено' },
            { n: favVideos.length || (loading ? '…' : 0), l: 'в избранном' },
            { n: 0, l: 'подписок' },
          ].map(({ n, l }) => (
            <div key={l}>
              <div style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:24, letterSpacing:'-0.02em' }}>{n}</div>
              <div style={{ color:'var(--faint)', fontSize:13, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="scroller" style={{ display:'flex', gap:4, marginTop:30, borderBottom:'1px solid var(--line)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex:'none', padding:'13px 18px', color: tab===t ? 'var(--text)' : 'var(--muted)', fontWeight:600, fontSize:14.5, marginBottom:-1, transition:'.2s', background:'none', border:'none', borderBottom: tab===t ? '2px solid var(--accent)' : '2px solid transparent', cursor:'pointer', whiteSpace:'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ paddingTop:26 }}>
        {tab === 'Настройки' ? (
          <div style={{ display:'grid', gap:12, maxWidth:640 }}>
            {[
              { icon:'🔔', title:'Уведомления', sub:'Настройки push-уведомлений' },
              { icon:'🎨', title:'Внешний вид', sub:'Тема и отображение' },
              { icon:'🔒', title:'Приватность', sub:'Управление данными' },
            ].map(({ icon, title, sub }) => (
              <div key={title} style={{ display:'flex', alignItems:'center', gap:16, padding:'18px 20px', borderRadius:'var(--r-card)', border:'1px solid var(--line)', background:'var(--card)' }}>
                <div style={{ width:42, height:42, borderRadius:12, display:'grid', placeItems:'center', background:'var(--accent-soft)', color:'var(--accent)', flexShrink:0, fontSize:20 }}>{icon}</div>
                <div>
                  <div style={{ fontWeight:600 }}>{title}</div>
                  <div style={{ color:'var(--faint)', fontSize:13, marginTop:2 }}>{sub}</div>
                </div>
                <div style={{ marginLeft:'auto', width:46, height:27, borderRadius:99, background:'var(--line-2)', position:'relative', cursor:'pointer', flexShrink:0 }}
                  onClick={e => { const el=e.currentTarget; el.style.background = el.style.background === 'var(--accent)' ? 'var(--line-2)' : 'var(--accent)' }}>
                  <div style={{ position:'absolute', top:3, left:3, width:21, height:21, borderRadius:99, background:'#fff', transition:'.25s' }} />
                </div>
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:16, padding:'18px 20px', borderRadius:'var(--r-card)', border:'1px solid var(--line)', background:'var(--card)', cursor:'pointer', marginTop:8 }} onClick={() => { logout(); navigate('/') }}>
              <div style={{ width:42, height:42, borderRadius:12, display:'grid', placeItems:'center', background:'oklch(0.3 0.15 25 / .2)', color:'oklch(0.65 0.18 25)', flexShrink:0, fontSize:20 }}>🚪</div>
              <div>
                <div style={{ fontWeight:600, color:'oklch(0.65 0.18 25)' }}>Выйти из аккаунта</div>
                <div style={{ color:'var(--faint)', fontSize:13, marginTop:2 }}>{user.email}</div>
              </div>
            </div>
          </div>
        ) : tab === 'Мои Shorts' ? (
          shortsLoading ? <ShortsGridSkeleton /> : myShorts.length === 0 ? (
            <div className="empty">
              <div className="empty__icon" style={{fontSize:28}}>🎬</div>
              <h3>У вас пока нет shorts</h3>
              <p>Загрузите первое короткое видео — оно появится здесь</p>
              <Link to="/upload-short" className="btn btn--primary" style={{marginTop:16}}>Загрузить short</Link>
            </div>
          ) : (
            <div className="shorts-grid">
              {myShorts.map(s => (
                <div key={s.id} className="shorts-grid__item">
                  <ShortPreviewCard short={s} showStatus />
                  <button className="btn btn--ghost btn--sm shorts-grid__del" onClick={() => handleDeleteShort(s.id, s.title)}>Удалить</button>
                </div>
              ))}
            </div>
          )
        ) : tab === 'Сохранённые' ? (
          shortsLoading ? <ShortsGridSkeleton /> : savedShorts.length === 0 ? (
            <div className="empty">
              <div className="empty__icon" style={{fontSize:28}}>🔖</div>
              <h3>Нет сохранённых shorts</h3>
              <p>Сохраняйте короткие видео — они появятся здесь</p>
              <Link to="/shorts" className="btn btn--secondary" style={{marginTop:16}}>Открыть ленту</Link>
            </div>
          ) : (
            <div className="shorts-grid">
              {savedShorts.map(s => <ShortPreviewCard key={s.id} short={s} />)}
            </div>
          )
        ) : loading ? (
          <div className="grid">
            {Array.from({length:4}).map((_,i) => (
              <div key={i} className="card">
                <div className="sk sk--poster" />
                <div className="card__body"><div className="sk sk--title" /><div className="sk sk--line" style={{width:'60%',marginTop:8}} /></div>
              </div>
            ))}
          </div>
        ) : currentVideos.length === 0 ? (
          <div className="empty">
            <div className="empty__icon" style={{fontSize:28}}>{tab==='Избранное' ? '♥' : '⏱'}</div>
            <h3>{tab==='Избранное' ? 'Нет избранных' : 'История пуста'}</h3>
            <p>{tab==='Избранное' ? 'Добавляй видео в избранное — они появятся здесь' : 'Смотри видео — они будут сохраняться в историю'}</p>
            <Link to="/" className="btn btn--secondary" style={{marginTop:16}}>В каталог</Link>
          </div>
        ) : (
          <div className="grid">
            {currentVideos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </div>
    </main>
  )
}
