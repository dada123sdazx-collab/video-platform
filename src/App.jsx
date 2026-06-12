import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
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

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function CinematicIntro() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 2200)
    return () => clearTimeout(t)
  }, [])
  if (hidden) return null
  return (
    <div className={`intro${hidden ? ' is-hidden' : ''}`}>
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

function AppLayout() {
  return (
    <div style={{ minHeight:'100vh' }}>
      <CinematicIntro />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video/:id" element={<VideoPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/author" element={<ProtectedRoute><AuthorPanel /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><WatchHistory /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={
          <main className="wrap" style={{ paddingTop:80, textAlign:'center' }}>
            <div className="empty">
              <div className="empty__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>
              <h3 style={{ fontSize:48, fontFamily:'Space Grotesk' }}>404</h3>
              <p>Страница не найдена</p>
              <a href="/" className="btn btn--secondary" style={{ marginTop:16 }}>На главную</a>
            </div>
          </main>
        } />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}
