import { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { MotionConfig, AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import VideoPage from './pages/VideoPage'
import SearchResults from './pages/SearchResults'
import Login from './pages/Login'
import Register from './pages/Register'
import Favorites from './pages/Favorites'
import AuthorPanel from './pages/AuthorPanel'
import WatchHistory from './pages/WatchHistory'
import AdminPanel from './pages/AdminPanel'
import Profile from './pages/Profile'

// Тяжёлые разделы shorts грузим лениво (code-splitting)
const ShortsFeed = lazy(() => import('./pages/ShortsFeed'))
const ShortUpload = lazy(() => import('./pages/ShortUpload'))

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function PageFallback() {
  return (
    <div className="page-loader" role="status" aria-label="Загрузка">
      <span className="page-loader__orb" />
      <span className="page-loader__text">Загрузка…</span>
    </div>
  )
}

function CinematicIntro() {
  // показываем заставку только раз за сессию вкладки
  const [stage, setStage] = useState(() => {
    try { return sessionStorage.getItem('vt_intro') === '1' ? 'done' : 'show' } catch { return 'show' }
  })
  useEffect(() => {
    if (stage !== 'show') return
    const t1 = setTimeout(() => setStage('leaving'), 1900)
    const t2 = setTimeout(() => {
      setStage('done')
      try { sessionStorage.setItem('vt_intro', '1') } catch { /* noop */ }
    }, 2600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [stage])
  if (stage === 'done') return null
  return (
    <div className={`intro${stage === 'leaving' ? ' is-hidden' : ''}`}>
      <div className="intro__inner">
        <div className="intro__logo">
          <span className="intro__mark">
            <svg viewBox="0 0 24 24"><path d="M9 6.3v11.4a1 1 0 0 0 1.5.86l9.4-5.7a1 1 0 0 0 0-1.72l-9.4-5.7A1 1 0 0 0 9 6.3Z"/></svg>
          </span>
          <span className="intro__word">VIEW<b>·</b>TUBE</span>
        </div>
        <div className="intro__bar" />
        <div className="intro__tag">cinematic streaming experience</div>
      </div>
    </div>
  )
}

// Плавный fade-переход между страницами. Только opacity — без transform,
// чтобы не ломать position:fixed оверлеи (shorts-лист, модалки, тосты).
const pageVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="pt"
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/video/:id" element={<VideoPage />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/shorts" element={<ShortsFeed />} />
            <Route path="/shorts/:id" element={<ShortsFeed />} />
            <Route path="/upload-short" element={<ProtectedRoute><ShortUpload /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/author" element={<ProtectedRoute><AuthorPanel /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><WatchHistory /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={
              <main className="wrap" style={{ paddingTop: 80, textAlign: 'center' }}>
                <div className="empty">
                  <div className="empty__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>
                  <h3 style={{ fontSize: 48, fontFamily: 'Space Grotesk' }}>404</h3>
                  <p>Страница не найдена</p>
                  <a href="/" className="btn btn--secondary" style={{ marginTop: 16 }}>На главную</a>
                </div>
              </main>
            } />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

// Глобальный reveal-on-scroll: один IntersectionObserver на всё приложение
// + MutationObserver, чтобы подхватывать карточки, добавленные асинхронно
// (после загрузки данных) на любой странице — разметка остаётся чистой.
function useGlobalReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

    let raf = 0
    const scan = () => {
      raf = 0
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el))
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(scan) }

    scan()
    const mo = new MutationObserver(schedule)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect(); if (raf) cancelAnimationFrame(raf) }
  }, [])
}

function AppLayout() {
  useGlobalReveal()
  return (
    <div style={{ minHeight: '100vh' }}>
      <CinematicIntro />
      <Navbar />
      <AnimatedRoutes />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <AuthProvider>
            <AppLayout />
          </AuthProvider>
        </ToastProvider>
      </MotionConfig>
    </BrowserRouter>
  )
}
