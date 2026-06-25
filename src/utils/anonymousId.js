/**
 * Стабильный анонимный идентификатор гостя (для учёта просмотров shorts
 * без авторизации). Хранится в localStorage и переживает перезагрузку.
 */

const KEY = 'vt_anon_id'

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function getAnonymousId() {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = makeId()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — разовый id
    return makeId()
  }
}
