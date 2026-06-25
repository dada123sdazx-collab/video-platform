/**
 * Единые правила валидации пользовательского ввода.
 * Каждая функция возвращает { ok: boolean, value?: any, error?: string }.
 * Используется в формах добавления видео, загрузки shorts и комментариях.
 */

// ── Лимиты (продублированы в README и Storage Rules) ─────────────────
export const LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descriptionMax: 1000,
  commentMax: 500,
  tagsMax: 10,
  tagMax: 30,
  shortDurationMax: 60, // секунд
  videoMaxBytes: 100 * 1024 * 1024, // 100 МБ
  thumbMaxBytes: 5 * 1024 * 1024, // 5 МБ
}

export const ALLOWED_CATEGORIES = ['Технологии', 'Музыка', 'Спорт', 'Кулинария']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const ALLOWED_VIDEO_EXT = ['mp4', 'webm', 'mov']
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const ok = (value) => ({ ok: true, value })
const fail = (error) => ({ ok: false, error })

export function validateTitle(title) {
  const v = (title ?? '').trim()
  if (v.length < LIMITS.titleMin) return fail(`Название — минимум ${LIMITS.titleMin} символа`)
  if (v.length > LIMITS.titleMax) return fail(`Название — максимум ${LIMITS.titleMax} символов`)
  return ok(v)
}

export function validateDescription(description) {
  const v = (description ?? '').trim()
  if (v.length > LIMITS.descriptionMax) return fail(`Описание — максимум ${LIMITS.descriptionMax} символов`)
  return ok(v)
}

export function validateComment(text) {
  const v = (text ?? '').trim()
  if (!v) return fail('Комментарий не может быть пустым')
  if (v.length > LIMITS.commentMax) return fail(`Комментарий — максимум ${LIMITS.commentMax} символов`)
  return ok(v)
}

/**
 * Принимает строку («react, js #web») или массив, нормализует в массив
 * тегов без пробелов и решёток, не длиннее tagsMax.
 */
export function validateTags(tags) {
  let arr = []
  if (Array.isArray(tags)) arr = tags
  else if (typeof tags === 'string') arr = tags.split(/[,\s]+/)
  const cleaned = arr
    .map((t) => String(t).trim().replace(/^#+/, '').toLowerCase())
    .filter(Boolean)
  const unique = [...new Set(cleaned)]
  if (unique.length > LIMITS.tagsMax) return fail(`Максимум ${LIMITS.tagsMax} тегов`)
  if (unique.some((t) => t.length > LIMITS.tagMax)) return fail(`Тег — максимум ${LIMITS.tagMax} символов`)
  if (unique.some((t) => /\s/.test(t))) return fail('Хэштег не должен содержать пробелов')
  return ok(unique)
}

export function validateCategory(category, allowed = ALLOWED_CATEGORIES) {
  if (!allowed.includes(category)) return fail('Выберите категорию из списка')
  return ok(category)
}

function extOf(name) {
  return (name?.split('.').pop() || '').toLowerCase()
}

export function validateShortVideoFile(file) {
  if (!file) return fail('Файл видео обязателен')
  const typeOk = ALLOWED_VIDEO_TYPES.includes(file.type) || ALLOWED_VIDEO_EXT.includes(extOf(file.name))
  if (!typeOk) return fail('Поддерживаются форматы: mp4, webm, mov')
  if (file.size > LIMITS.videoMaxBytes) {
    return fail(`Файл слишком большой (макс. ${Math.round(LIMITS.videoMaxBytes / 1024 / 1024)} МБ)`)
  }
  return ok(file)
}

export function validateThumbnailFile(file) {
  if (!file) return ok(null) // обложка не обязательна
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return fail('Обложка: только JPG, PNG или WebP')
  if (file.size > LIMITS.thumbMaxBytes) {
    return fail(`Обложка слишком большая (макс. ${Math.round(LIMITS.thumbMaxBytes / 1024 / 1024)} МБ)`)
  }
  return ok(file)
}

/** Длительность видео (после чтения metadata) в секундах. */
export function validateDuration(seconds) {
  const s = Number(seconds) || 0
  if (s > LIMITS.shortDurationMax) return fail(`Видео длиннее ${LIMITS.shortDurationMax} сек`)
  return ok(s)
}
