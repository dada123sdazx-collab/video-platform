import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../utils/admin'

/**
 * Защита админских маршрутов. Неавторизованных отправляет на /login,
 * обычных пользователей — на главную. Проверка прав централизована в
 * utils/admin.js (см. isAdmin / isDemoAdmin).
 */
export default function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin(user)) return <Navigate to="/" replace />
  return children
}
