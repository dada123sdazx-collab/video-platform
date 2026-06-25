import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  runTransaction,
} from 'firebase/firestore'
import { db } from './config'
import { devError } from '../utils/log'
import { toMillis } from '../utils/formatters'

export const REPORT_REASONS = [
  { value: 'spam', label: 'Спам' },
  { value: 'violence', label: 'Насилие' },
  { value: 'adult', label: '18+' },
  { value: 'hate', label: 'Оскорбления' },
  { value: 'copyright', label: 'Авторские права' },
  { value: 'other', label: 'Другое' },
]

const VALID_REASONS = REPORT_REASONS.map((r) => r.value)
const REPORT_THRESHOLD = 3 // после стольких жалоб short помечается isReported

/**
 * Жалоба на short. Один пользователь = одна жалоба на short
 * (детерминированный id), повторная отправка не накручивает счётчик.
 * @returns {Promise<{alreadyReported:boolean}>}
 */
export async function reportShort({ userId, shortId, reason, details = '' }) {
  if (!userId) throw new Error('Войдите, чтобы пожаловаться')
  if (!VALID_REASONS.includes(reason)) throw new Error('Выберите причину жалобы')

  const reportRef = doc(db, 'shortReports', `${userId}_${shortId}`)
  const shortRef = doc(db, 'shorts', shortId)
  let alreadyReported = false

  await runTransaction(db, async (tx) => {
    const rSnap = await tx.get(reportRef)
    if (rSnap.exists()) { alreadyReported = true; return }
    const sSnap = await tx.get(shortRef)
    const nextCount = (sSnap.data()?.moderation?.reportsCount || 0) + 1
    tx.set(reportRef, {
      shortId,
      userId,
      reason,
      details: String(details || '').slice(0, 500),
      status: 'new',
      createdAt: serverTimestamp(),
      reviewedAt: null,
    })
    tx.update(shortRef, {
      'moderation.reportsCount': increment(1),
      'moderation.lastReportAt': serverTimestamp(),
      'moderation.isReported': nextCount >= REPORT_THRESHOLD,
    })
  })

  return { alreadyReported }
}

/** Жалобы по конкретному short (для админки). */
export async function getShortReports(shortId) {
  try {
    let docs
    try {
      const snap = await getDocs(query(
        collection(db, 'shortReports'),
        where('shortId', '==', shortId),
        orderBy('createdAt', 'desc'),
      ))
      docs = snap.docs
    } catch {
      const snap = await getDocs(query(collection(db, 'shortReports'), where('shortId', '==', shortId)))
      docs = snap.docs
    }
    return docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
  } catch (err) {
    devError('getShortReports', err)
    return []
  }
}

/** Пометить жалобу обработанной/отклонённой. */
export async function markReportReviewed(reportId, status = 'reviewed') {
  const next = ['reviewed', 'rejected'].includes(status) ? status : 'reviewed'
  await updateDoc(doc(db, 'shortReports', reportId), {
    status: next,
    reviewedAt: serverTimestamp(),
  })
}
