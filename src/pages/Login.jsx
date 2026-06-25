import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthVisual from '../components/visuals/AuthVisual'

const PlayMark = (
  <svg viewBox="0 0 24 24"><path d="M9 6.3v11.4a1 1 0 0 0 1.5.86l9.4-5.7a1 1 0 0 0 0-1.72l-9.4-5.7A1 1 0 0 0 9 6.3Z"/></svg>
)

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
    <main className="auth-wrap">
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-head">
            <div className="auth-logo">{PlayMark}</div>
            <h1>С возвращением</h1>
            <p>Войдите в аккаунт ViewTube</p>
          </div>

          <div className="auth-panel">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div className="form-error" role="alert">{error}</div>}
              <div>
                <label htmlFor="login-email" className="auth-label">Email</label>
                <input id="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="vt-input" placeholder="you@example.com" autoComplete="email" />
              </div>
              <div>
                <label htmlFor="login-pass" className="auth-label">Пароль</label>
                <input id="login-pass" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="vt-input" placeholder="••••••••" autoComplete="current-password" />
              </div>
              <button type="submit" disabled={loading} className="btn btn--primary btn--block" style={{ marginTop: 4 }}>
                {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
                {loading ? 'Входим…' : 'Войти'}
              </button>
            </form>
          </div>

          <p className="auth-alt">
            Нет аккаунта?{' '}
            <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>

      <AuthVisual />
    </main>
  )
}

function getMsg(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password': return 'Неверный email или пароль'
    case 'auth/user-not-found': return 'Пользователь не найден'
    case 'auth/too-many-requests': return 'Слишком много попыток. Попробуйте позже'
    default: return 'Не удалось войти. Проверьте данные'
  }
}
