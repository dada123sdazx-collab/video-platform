import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/') }
    catch (err) { setError(getMsg(err.code)) }
    finally { setLoading(false) }
  }

  return (
    <main style={{ minHeight:'85vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 16px' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(150deg,var(--accent),var(--glow))', display:'grid', placeItems:'center', margin:'0 auto 16px', boxShadow:'0 14px 50px -8px var(--glow)' }}>
            <svg viewBox="0 0 24 24" style={{ width:28, height:28, fill:'#1a1206' }}><path d="M9 6.3v11.4a1 1 0 0 0 1.5.86l9.4-5.7a1 1 0 0 0 0-1.72l-9.4-5.7A1 1 0 0 0 9 6.3Z"/></svg>
          </div>
          <h1 style={{ fontFamily:'Space Grotesk', fontSize:28, letterSpacing:-'.02em', marginBottom:8 }}>Добро пожаловать</h1>
          <p style={{ color:'var(--faint)', fontSize:15 }}>Войдите в аккаунт ViewTube</p>
        </div>

        <div style={{ background:'var(--card)', border:'1px solid var(--line-2)', borderRadius:'var(--r-lg)', padding:28 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {error && <div style={{ padding:'12px 16px', borderRadius:'var(--r-md)', background:'oklch(0.3 0.15 25 / .2)', border:'1px solid oklch(0.5 0.18 25 / .4)', color:'oklch(0.75 0.16 25)', fontSize:14 }}>{error}</div>}
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--faint)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8 }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="vt-input" placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--faint)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8 }}>Пароль</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="vt-input" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn btn--primary btn--block" style={{ marginTop:4 }}>
              {loading ? 'Входим…' : 'Войти'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:20, color:'var(--faint)', fontSize:14 }}>
          Нет аккаунта?{' '}
          <Link to="/register" style={{ color:'var(--accent)', fontWeight:600 }}>Зарегистрироваться</Link>
        </p>
      </div>
    </main>
  )
}

function getMsg(code) {
  switch(code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password': return 'Неверный email или пароль'
    case 'auth/user-not-found':  return 'Пользователь не найден'
    case 'auth/too-many-requests': return 'Слишком много попыток. Попробуйте позже'
    default: return 'Ошибка входа. Проверьте данные'
  }
}
