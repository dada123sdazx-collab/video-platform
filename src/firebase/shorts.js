import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as qlimit,
  startAfter,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { uploadShortVideo, uploadShortThumbnail, deleteStoragePath } from './storage'
import { devError } from '../utils/log'
import { toMillis } from '../utils/formatters'
import {
  validateTitle,
  validateDescription,
  validateCategory,
  validateTags,
  validateShortVideoFile,
  validateThumbnailFile,
  validateDuration,
} from '../utils/validation'

const COL = 'shorts'

/**
 * Приводит документ short к безопасному виду: ни одно обращение к полю
 * не должно ронять UI, даже если данные неполные.
 */
export function normalizeShort(id, data = {}) {
  return {
    id,
    title: data.title || 'Без названия',
    description: data.description || '',
    authorId: data.authorId || null,
    authorName: data.authorName || 'Аноним',
    authorAvatar: data.authorAvatar || null,
    videoUrl: data.videoUrl || '',
    videoPath: data.videoPath || null,
    thumbnail: data.thumbnail || null,
    thumbnailPath: data.thumbnailPath || null,
    duration: Number(data.duration) || 0,
    category: data.category || 'Без категории',
    tags: Array.isArray(data.tags) ? data.tags : [],
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : (Array.isArray(data.tags) ? data.tags : []),
    likesCount: Number(data.likesCount) || 0,
    commentsCount: Number(data.commentsCount) || 0,
    viewsCount: Number(data.viewsCount) || 0,
    sharesCount: Number(data.sharesCount) || 0,
    savesCount: Number(data.savesCount) || 0,
    status: data.status || 'published',
    visibility: data.visibility || 'public',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    publishedAt: data.publishedAt || null,
    moderation: {
      isReported: data.moderation?.isReported || false,
      reportsCount: Number(data.moderation?.reportsCount) || 0,
      lastReportAt: data.moderation?.lastReportAt || null,
    },
  }
}

function mapSnap(d) {
  return normalizeShort(d.id, d.data())
}

// ── Лента ─────────────────────────────────────────────────────────────

/**
 * Постраничная лента опубликованных публичных shorts.
 * Возвращает { items, cursor, hasMore }. cursor — последний QueryDocumentSnapshot.
 *
 * Требует составной индекс (status ASC, createdAt DESC) — см. firestore.indexes.json.
 * Если индекс ещё не создан, срабатывает безопасный fallback без пагинации.
 */
export async function getShortsFeed({ cursor = null, limit = 5 } = {}) {
  try {
    const parts = [
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      ...(cursor ? [startAfter(cursor)] : []),
      qlimit(limit),
    ]
    const snap = await getDocs(query(collection(db, COL), ...parts))
    const items = snap.docs.map(mapSnap).filter((s) => s.visibility === 'public')
    const last = snap.docs[snap.docs.length - 1] || null
    return { items, cursor: last, hasMore: snap.docs.length === limit }
  } catch (err) {
    devError('getShortsFeed', err)
    // Fallback: индекс отсутствует/строится — грузим без orderBy и сортируем на клиенте.
    try {
      const snap = await getDocs(query(collection(db, COL), where('status', '==', 'published')))
      const items = snap.docs
        .map(mapSnap)
        .filter((s) => s.visibility === 'public')
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      return { items, cursor: null, hasMore: false }
    } catch (err2) {
      devError('getShortsFeed:fallback', err2)
      return { items: [], cursor: null, hasMore: false }
    }
  }
}

export async function getShortById(shortId) {
  try {
    const snap = await getDoc(doc(db, COL, shortId))
    return snap.exists() ? normalizeShort(snap.id, snap.data()) : null
  } catch (err) {
    devError('getShortById', err)
    return null
  }
}

/** Популярные shorts для главной (по просмотрам). */
export async function getPopularShorts(limit = 10) {
  try {
    const snap = await getDocs(query(
      collection(db, COL),
      where('status', '==', 'published'),
      orderBy('viewsCount', 'desc'),
      qlimit(limit),
    ))
    return snap.docs.map(mapSnap).filter((s) => s.visibility === 'public')
  } catch (err) {
    devError('getPopularShorts', err)
    try {
      const snap = await getDocs(query(collection(db, COL), where('status', '==', 'published')))
      return snap.docs.map(mapSnap)
        .filter((s) => s.visibility === 'public')
        .sort((a, b) => b.viewsCount - a.viewsCount)
        .slice(0, limit)
    } catch (err2) {
      devError('getPopularShorts:fallback', err2)
      return []
    }
  }
}

/** Все shorts пользователя (для профиля «Мои Shorts»). */
export async function getUserShorts(uid) {
  if (!uid) return []
  try {
    const snap = await getDocs(query(
      collection(db, COL),
      where('authorId', '==', uid),
      orderBy('createdAt', 'desc'),
    ))
    return snap.docs.map(mapSnap)
  } catch (err) {
    devError('getUserShorts', err)
    try {
      const snap = await getDocs(query(collection(db, COL), where('authorId', '==', uid)))
      return snap.docs.map(mapSnap).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    } catch (err2) {
      devError('getUserShorts:fallback', err2)
      return []
    }
  }
}

// ── Создание / изменение ──────────────────────────────────────────────

/**
 * Создание short: валидирует ввод, грузит файлы в Storage и пишет документ.
 * authorId/authorName берутся из user (не из формы) — см. требования безопасности.
 *
 * @param {object} p
 * @param {object} p.user        — currentUser (uid, displayName, email, photoURL)
 * @param {object} p.data        — { title, description, category, tags, duration, visibility }
 * @param {File}   p.videoFile
 * @param {File}   [p.thumbnailFile]
 * @param {(n:number)=>void} [p.onProgress]
 * @returns {Promise<string>} id созданного документа
 */
export async function createShort({ user, data = {}, videoFile, thumbnailFile, onProgress }) {
  if (!user?.uid) throw new Error('Войдите, чтобы загрузить short')

  const title = validateTitle(data.title)
  if (!title.ok) throw new Error(title.error)
  const description = validateDescription(data.description)
  if (!description.ok) throw new Error(description.error)
  const category = validateCategory(data.category)
  if (!category.ok) throw new Error(category.error)
  const tags = validateTags(data.tags)
  if (!tags.ok) throw new Error(tags.error)
  const videoCheck = validateShortVideoFile(videoFile)
  if (!videoCheck.ok) throw new Error(videoCheck.error)
  const thumbCheck = validateThumbnailFile(thumbnailFile)
  if (!thumbCheck.ok) throw new Error(thumbCheck.error)
  const duration = validateDuration(data.duration)
  if (!duration.ok) throw new Error(duration.error)

  // Файлы: видео занимает основную часть прогресса.
  const video = await uploadShortVideo(user.uid, videoFile, (p) => onProgress?.(Math.round(p * 0.85)))
  let thumbnail = null
  let thumbnailPath = null
  if (thumbnailFile) {
    const t = await uploadShortThumbnail(user.uid, thumbnailFile, (p) => onProgress?.(85 + Math.round(p * 0.1)))
    thumbnail = t.url
    thumbnailPath = t.path
  }
  onProgress?.(96)

  const visibility = ['public', 'private', 'unlisted'].includes(data.visibility) ? data.visibility : 'public'

  const ref = await addDoc(collection(db, COL), {
    title: title.value,
    description: description.value,
    authorId: user.uid,
    authorName: user.displayName || user.email || 'Аноним',
    authorAvatar: user.photoURL || null,
    videoUrl: video.url,
    videoPath: video.path,
    thumbnail,
    thumbnailPath,
    duration: duration.value,
    category: category.value,
    tags: tags.value,
    hashtags: tags.value,
    likesCount: 0,
    commentsCount: 0,
    viewsCount: 0,
    sharesCount: 0,
    savesCount: 0,
    status: 'published',
    visibility,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: serverTimestamp(),
    moderation: { isReported: false, reportsCount: 0, lastReportAt: null },
  })
  onProgress?.(100)
  return ref.id
}

/** Частичное обновление (только разрешённые поля). */
export async function updateShort(shortId, patch = {}) {
  const allowed = {}
  if (patch.title !== undefined) {
    const r = validateTitle(patch.title); if (!r.ok) throw new Error(r.error); allowed.title = r.value
  }
  if (patch.description !== undefined) {
    const r = validateDescription(patch.description); if (!r.ok) throw new Error(r.error); allowed.description = r.value
  }
  if (patch.category !== undefined) {
    const r = validateCategory(patch.category); if (!r.ok) throw new Error(r.error); allowed.category = r.value
  }
  if (patch.visibility !== undefined && ['public', 'private', 'unlisted'].includes(patch.visibility)) {
    allowed.visibility = patch.visibility
  }
  await updateDoc(doc(db, COL, shortId), { ...allowed, updatedAt: serverTimestamp() })
}

/** Полное удаление short (документ + файлы в Storage). Автор или админ. */
export async function deleteShort(shortId) {
  try {
    const snap = await getDoc(doc(db, COL, shortId))
    if (snap.exists()) {
      const d = snap.data()
      await deleteStoragePath(d.videoPath)
      await deleteStoragePath(d.thumbnailPath)
    }
  } catch (err) {
    devError('deleteShort:storage', err)
  }
  await deleteDoc(doc(db, COL, shortId))
}

// ── Модерация (админка) ───────────────────────────────────────────────

/** Все shorts для админ-модерации (без фильтра видимости). */
export async function getAllShorts() {
  try {
    const snap = await getDocs(collection(db, COL))
    return snap.docs.map(mapSnap).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
  } catch (err) {
    devError('getAllShorts', err)
    return []
  }
}

/** Скрыть short (status → blocked). */
export async function hideShort(shortId) {
  await updateDoc(doc(db, COL, shortId), { status: 'blocked', updatedAt: serverTimestamp() })
}

/** Восстановить short (status → published). */
export async function restoreShort(shortId) {
  await updateDoc(doc(db, COL, shortId), {
    status: 'published',
    'moderation.isReported': false,
    updatedAt: serverTimestamp(),
  })
}
