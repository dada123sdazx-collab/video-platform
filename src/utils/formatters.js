/**
 * Утилиты форматирования. Все функции терпимы к отсутствующим/битым
 * данным и никогда не бросают исключение — это защищает UI от падений
 * на неполных документах Firestore.
 */

/** Превращает Firestore Timestamp | Date | number | string в Date | null. */
export function toDate(value) {
  if (!value) return null
  try {
    if (typeof value?.toDate === 'function') return value.toDate()
    if (value instanceof Date) return value
    if (typeof value === 'number' || typeof value === 'string') {
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d
    }
    // Firestore timestamp-like { seconds }
    if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000)
  } catch {
    return null
  }
  return null
}

/** В миллисекундах для сортировки (0, если даты нет). */
export function toMillis(value) {
  const d = toDate(value)
  return d ? d.getTime() : 0
}

/** Короткая дата: «25 июн. 2026». */
export function formatDate(value) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Относительное время: «5 мин назад», «вчера», иначе дата. */
export function formatTimeAgo(value) {
  const d = toDate(value)
  if (!d) return ''
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'только что'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} мин назад`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} ч назад`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'вчера'
  if (day < 7) return `${day} дн назад`
  return formatDate(value)
}

/** Компактные числа: 1200 → «1,2K», 3_400_000 → «3,4M». */
export function formatCount(n) {
  const num = Number(n) || 0
  if (num < 1000) return String(num)
  if (num < 1_000_000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace('.', ',')}K`
  return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1).replace('.', ',')}M`
}

/** Длительность в секундах → «0:45» / «1:05». */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  const rest = s % 60
  return `${m}:${String(rest).padStart(2, '0')}`
}

/** Первая буква имени для аватара (с безопасным fallback). */
export function initialOf(str) {
  return (str || '?').trim()[0]?.toUpperCase() || '?'
}
