import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthVisual from '../components/visuals/AuthVisual'

const PlayMark = (
  <svg viewBox="0 0 24 24"><path d="M9 6.3v11.4a1 1 0 0 0 1.5.86l9.4-5.7a1 1 0 0 0 0-1.72l-9.4-5.7A1 1 0 0 0 9 6.3Z"/></svg>
)

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Пароли не совпадают'); return }
    if (password.length < 6) { setError('Пароль — минимум 6 символов'); return }
    setError(''); setLoading(true)
    try { await register(name.trim(), email, password); navigate('/') }
    catch (err) { setError(getMsg(err.code)) }
    finally { setLoading(false) }
  }

  const fields = [
    { id: 'reg-name', label: 'Имя', type: 'text', value: name, set: setName, ph: 'Ваше имя', ac: 'name' },
    { id: 'reg-email', label: 'Email', type: 'email', value: email, set: setEmail, ph: 'you@example.com', ac: 'email' },
    { id: 'reg-pass', label: 'Пароль', type: 'password', value: password, set: setPassword, ph: 'Минимум 6 символов', ac: 'new-password' },
    { id: 'reg-confirm', label: 'Подтвердите пароль', type: 'password', value: confirm, set: setConfirm, ph: '••••••••', ac: 'new-password' },
  ]

  return (
    <main className="auth-wrap">
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-head">
            <div className="auth-logo">{PlayMark}</div>
            <h1>Создать аккаунт</h1>
            <p>Присоединяйтесь к ViewTube</p>
          </div>

          <div className="auth-panel">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div className="form-error" role="alert">{error}</div>}
              {fields.map(({ id, label, type, value, set, ph, ac }) => (
                <div key={id}>
                  <label htmlFor={id} className="auth-label">{label}</label>
                  <input id={id} type={type} required value={value} onChange={e => set(e.target.value)} className="vt-input" placeholder={ph} autoComplete={ac} />
                </div>
              ))}
              <button type="submit" disabled={loading} className="btn btn--primary btn--block" style={{ marginTop: 4 }}>
                {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
                {loading ? 'Регистрация…' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>

          <p className="auth-alt">
            Уже есть аккаунт?{' '}
            <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>

      <AuthVisual />
    </main>
  )
}

function getMsg(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'Этот email уже используется'
    case 'auth/invalid-email': return 'Некорректный email'
    case 'auth/weak-password': return 'Пароль слишком простой'
    default: return 'Не удалось зарегистрироваться'
  }
}
