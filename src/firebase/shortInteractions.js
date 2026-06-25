import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as qlimit,
  startAfter,
  serverTimestamp,
  increment,
  runTransaction,
} from 'firebase/firestore'
import { db } from './config'
import { devError } from '../utils/log'
import { toMillis } from '../utils/formatters'
import { validateComment } from '../utils/validation'
import { getShortById } from './shorts'

const pairId = (uid, shortId) => `${uid}_${shortId}`

// ── Лайки (отдельная коллекция + счётчик, без массива в документе) ─────

export async function likeShort(userId, shortId) {
  if (!userId) throw new Error('Войдите, чтобы поставить лайк')
  const likeRef = doc(db, 'shortLikes', pairId(userId, shortId))
  const shortRef = doc(db, 'shorts', shortId)
  await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef)
    if (likeSnap.exists()) return // защита от двойного лайка
    tx.set(likeRef, { userId, shortId, createdAt: serverTimestamp() })
    tx.update(shortRef, { likesCount: increment(1) })
  })
}

export async function unlikeShort(userId, shortId) {
  if (!userId) return
  const likeRef = doc(db, 'shortLikes', pairId(userId, shortId))
  const shortRef = doc(db, 'shorts', shortId)
  await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef)
    if (!likeSnap.exists()) return
    tx.delete(likeRef)
    tx.update(shortRef, { likesCount: increment(-1) })
  })
}

export async function checkShortLiked(userId, shortId) {
  if (!userId) return false
  try {
    const snap = await getDoc(doc(db, 'shortLikes', pairId(userId, shortId)))
    return snap.exists()
  } catch (err) {
    devError('checkShortLiked', err)
    return false
  }
}

// ── Сохранения ────────────────────────────────────────────────────────

export async function saveShort(userId, shortId) {
  if (!userId) throw new Error('Войдите, чтобы сохранить short')
  const saveRef = doc(db, 'shortSaves', pairId(userId, shortId))
  const shortRef = doc(db, 'shorts', shortId)
  await runTransaction(db, async (tx) => {
    const saveSnap = await tx.get(saveRef)
    if (saveSnap.exists()) return
    tx.set(saveRef, { userId, shortId, createdAt: serverTimestamp() })
    tx.update(shortRef, { savesCount: increment(1) })
  })
}

export async function unsaveShort(userId, shortId) {
  if (!userId) return
  const saveRef = doc(db, 'shortSaves', pairId(userId, shortId))
  const shortRef = doc(db, 'shorts', shortId)
  await runTransaction(db, async (tx) => {
    const saveSnap = await tx.get(saveRef)
    if (!saveSnap.exists()) return
    tx.delete(saveRef)
    tx.update(shortRef, { savesCount: increment(-1) })
  })
}

export async function checkShortSaved(userId, shortId) {
  if (!userId) return false
  try {
    const snap = await getDoc(doc(db, 'shortSaves', pairId(userId, shortId)))
    return snap.exists()
  } catch (err) {
    devError('checkShortSaved', err)
    return false
  }
}

/** Сохранённые пользователем shorts (для профиля). */
export async function getSavedShorts(uid) {
  if (!uid) return []
  try {
    let saves
    try {
      const snap = await getDocs(query(
        collection(db, 'shortSaves'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
      ))
      saves = snap.docs.map((d) => d.data())
    } catch {
      const snap = await getDocs(query(collection(db, 'shortSaves'), where('userId', '==', uid)))
      saves = snap.docs.map((d) => d.data()).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    }
    const shorts = await Promise.all(saves.map((s) => getShortById(s.shortId)))
    return shorts.filter((s) => s && s.status !== 'deleted')
  } catch (err) {
    devError('getSavedShorts', err)
    return []
  }
}

// ── Комментарии ───────────────────────────────────────────────────────

/** Возвращает добавленный комментарий (с локальной датой для optimistic UI). */
export async function addShortComment(user, shortId, text) {
  if (!user?.uid) throw new Error('Войдите, чтобы комментировать')
  const r = validateComment(text)
  if (!r.ok) throw new Error(r.error)
  const payload = {
    shortId,
    userId: user.uid,
    userName: user.displayName || user.email || 'Аноним',
    userAvatar: user.photoURL || null,
    text: r.value,
    status: 'visible',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, 'shortComments'), payload)
  await updateDoc(doc(db, 'shorts', shortId), { commentsCount: increment(1) })
  return { id: ref.id, ...payload, createdAt: new Date() }
}

export async function deleteShortComment(commentId, shortId) {
  await deleteDoc(doc(db, 'shortComments', commentId))
  try {
    await updateDoc(doc(db, 'shorts', shortId), { commentsCount: increment(-1) })
  } catch (err) {
    devError('deleteShortComment:count', err)
  }
}

export async function getShortComments(shortId, { cursor = null, limit = 30 } = {}) {
  try {
    const parts = [
      where('shortId', '==', shortId),
      orderBy('createdAt', 'desc'),
      ...(cursor ? [startAfter(cursor)] : []),
      qlimit(limit),
    ]
    const snap = await getDocs(query(collection(db, 'shortComments'), ...parts))
    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => (c.status || 'visible') === 'visible')
    const last = snap.docs[snap.docs.length - 1] || null
    return { items, cursor: last, hasMore: snap.docs.length === limit }
  } catch (err) {
    devError('getShortComments', err)
    try {
      const snap = await getDocs(query(collection(db, 'shortComments'), where('shortId', '==', shortId)))
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => (c.status || 'visible') === 'visible')
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      return { items, cursor: null, hasMore: false }
    } catch (err2) {
      devError('getShortComments:fallback', err2)
      return { items: [], cursor: null, hasMore: false }
    }
  }
}

// ── Просмотры ─────────────────────────────────────────────────────────

/**
 * Засчитывает просмотр. Вызывать после реального просмотра (≥2-3 сек),
 * один раз на показ — антинакрутка реализована в хуке useDebouncedView.
 */
export async function registerShortView({ userId = null, anonId = null, shortId, watchMs = 0, completed = false }) {
  if (!shortId) return
  try {
    await addDoc(collection(db, 'shortViews'), {
      shortId,
      userId,
      anonId,
      watchMs,
      completed,
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'shorts', shortId), { viewsCount: increment(1) })
  } catch (err) {
    devError('registerShortView', err)
  }
}

// ── Поделиться ────────────────────────────────────────────────────────

export async function shareShort(shortId) {
  try {
    await updateDoc(doc(db, 'shorts', shortId), { sharesCount: increment(1) })
  } catch (err) {
    devError('shareShort', err)
  }
}
