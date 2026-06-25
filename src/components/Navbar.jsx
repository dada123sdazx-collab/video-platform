import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../utils/admin'

const SVG = {
  play: <svg viewBox="0 0 24 24"><path d="M9 6.3v11.4a1 1 0 0 0 1.5.86l9.4-5.7a1 1 0 0 0 0-1.72l-9.4-5.7A1 1 0 0 0 9 6.3Z" fill="currentColor"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>,
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [stuck, setStuck] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const admin = isAdmin(user)

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setQuery('') }
  }

  async function handleLogout() {
    await logout(); navigate('/'); setMobileOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <header className={`header${stuck ? ' is-stuck' : ''}`}>
        <div className="wrap">
          <div className="header__bar">
            <Link to="/" className="brand">
              <span className="brand__mark">{SVG.play}</span>
              <span className="brand__name">VIEW<b>·</b>TUBE</span>
            </Link>

            <nav className="nav">
              <Link to="/" className={`nav__link${isActive('/') ? ' is-active' : ''}`}>Главная</Link>
              <Link to="/shorts" className={`nav__link${isActive('/shorts') ? ' is-active' : ''}`}>Shorts</Link>
              {user && <Link to="/favorites" className={`nav__link${isActive('/favorites') ? ' is-active' : ''}`}>Избранное</Link>}
              {user && <Link to="/history" className={`nav__link${isActive('/history') ? ' is-active' : ''}`}>История</Link>}
              {user && <Link to="/author" className={`nav__link${isActive('/author') ? ' is-active' : ''}`}>Добавить</Link>}
              {admin && <Link to="/admin" className={`nav__link${isActive('/admin') ? ' is-active' : ''}`} style={{color:'var(--accent)'}}>Админка</Link>}
            </nav>

            <div className="header__right">
              <form className="search search--header" onSubmit={handleSearch}>
                <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск…" />
              </form>

              {user ? (
                <>
                  <button onClick={handleLogout} className="icon-btn" title="Выйти">{SVG.logout}</button>
                  <Link to="/profile" className="avatar" title="Профиль">
                    {(user.displayName || user.email)?.[0]?.toUpperCase()}
                  </Link>
                </>
              ) : (
                <Link to="/login" className="btn btn--primary btn--sm">Войти</Link>
              )}

              <button className="icon-btn burger" onClick={() => setMobileOpen(o => !o)}>
                {mobileOpen ? SVG.x : SVG.menu}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'var(--bg)', padding:'80px 24px 24px', display:'flex', flexDirection:'column', gap:8 }}>
          <form onSubmit={e => { handleSearch(e); setMobileOpen(false) }} className="search" style={{marginBottom:16}}>
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск видео…" />
          </form>
          {[
            { to:'/', label:'Главная' },
            { to:'/shorts', label:'Shorts' },
            ...(user ? [
              { to:'/favorites', label:'Избранное' },
              { to:'/history', label:'История просмотров' },
              { to:'/author', label:'Добавить видео' },
              { to:'/upload-short', label:'Загрузить short' },
              ...(admin ? [{ to:'/admin', label:'Панель администратора', accent:true }] : []),
            ] : [{ to:'/login', label:'Войти', accent:true }]),
          ].map(({ to, label, accent }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              style={{ padding:'14px 18px', borderRadius:'var(--r-md)', background:'var(--card)', color: accent ? 'var(--accent)' : 'var(--text)', fontWeight:600, fontSize:15 }}>
              {label}
            </Link>
          ))}
          {user && (
            <button onClick={handleLogout}
              style={{ padding:'14px 18px', borderRadius:'var(--r-md)', background:'var(--card)', color:'var(--muted)', fontWeight:600, fontSize:15, textAlign:'left', marginTop:8, borderTop:'1px solid var(--line)' }}>
              Выйти
            </button>
          )}
        </div>
      )}
    </>
  )
}
