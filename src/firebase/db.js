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
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore'
import { db } from './config'

// ── Videos ──────────────────────────────────────────────────────────────────

export async function getVideos() {
  const snap = await getDocs(collection(db, 'videos'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getVideoById(id) {
  const snap = await getDoc(doc(db, 'videos', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function addVideo(data) {
  return addDoc(collection(db, 'videos'), {
    ...data,
    likes: [],
    views: 0,
    date: serverTimestamp(),
  })
}

export async function incrementViews(videoId) {
  await updateDoc(doc(db, 'videos', videoId), { views: increment(1) })
}

export async function toggleLike(videoId, uid) {
  const ref = doc(db, 'videos', videoId)
  const snap = await getDoc(ref)
  const likes = snap.data()?.likes ?? []
  if (likes.includes(uid)) {
    await updateDoc(ref, { likes: arrayRemove(uid) })
  } else {
    await updateDoc(ref, { likes: arrayUnion(uid) })
  }
}

// ── Favorites ────────────────────────────────────────────────────────────────

export async function getFavorites(uid) {
  const q = query(collection(db, 'favorites'), where('userId', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addFavorite(uid, videoId) {
  return addDoc(collection(db, 'favorites'), { userId: uid, videoId })
}

export async function removeFavorite(favoriteId) {
  await deleteDoc(doc(db, 'favorites', favoriteId))
}

export async function isFavorite(uid, videoId) {
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', uid),
    where('videoId', '==', videoId)
  )
  const snap = await getDocs(q)
  return snap.docs.length > 0 ? snap.docs[0].id : null
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(videoId) {
  const q = query(
    collection(db, 'comments'),
    where('videoId', '==', videoId)
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const aTime = a.date?.toMillis ? a.date.toMillis() : 0
    const bTime = b.date?.toMillis ? b.date.toMillis() : 0
    return aTime - bTime
  })
}

export async function addComment(uid, userName, videoId, text) {
  return addDoc(collection(db, 'comments'), {
    userId: uid,
    userName,
    videoId,
    text,
    date: serverTimestamp(),
  })
}

// ── Watch History ────────────────────────────────────────────────────────────

export async function addToHistory(uid, videoId) {
  const q = query(
    collection(db, 'watchHistory'),
    where('userId', '==', uid),
    where('videoId', '==', videoId)
  )
  const existing = await getDocs(q)
  if (!existing.empty) {
    await updateDoc(doc(db, 'watchHistory', existing.docs[0].id), {
      date: serverTimestamp(),
    })
  } else {
    await addDoc(collection(db, 'watchHistory'), {
      userId: uid,
      videoId,
      date: serverTimestamp(),
    })
  }
}

export async function getHistory(uid) {
  const q = query(
    collection(db, 'watchHistory'),
    where('userId', '==', uid)
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const aTime = a.date?.toMillis ? a.date.toMillis() : 0
    const bTime = b.date?.toMillis ? b.date.toMillis() : 0
    return bTime - aTime
  })
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function saveUser(uid, name, email) {
  await updateDoc(doc(db, 'users', uid), { name, email }).catch(() =>
    addDoc(collection(db, 'users'), { uid, name, email })
  )
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function getAllVideos() {
  const snap = await getDocs(collection(db, 'videos'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateVideo(id, data) {
  await updateDoc(doc(db, 'videos', id), data)
}

export async function deleteVideo(id) {
  await deleteDoc(doc(db, 'videos', id))
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function deleteUserDoc(id) {
  await deleteDoc(doc(db, 'users', id))
}

export async function getAllComments() {
  const snap = await getDocs(collection(db, 'comments'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function deleteComment(id) {
  await deleteDoc(doc(db, 'comments', id))
}

export async function getAdminStats() {
  const [videos, users, comments] = await Promise.all([
    getDocs(collection(db, 'videos')),
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'comments')),
  ])
  const totalViews = videos.docs.reduce((acc, d) => acc + (d.data().views ?? 0), 0)
  return {
    videos: videos.size,
    users: users.size,
    comments: comments.size,
    views: totalViews,
  }
}
