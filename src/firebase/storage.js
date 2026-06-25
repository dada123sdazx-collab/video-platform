import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'
import { devError } from '../utils/log'

/** Безопасное имя файла (без пробелов и спецсимволов). */
function safeName(name) {
  const ext = (name?.split('.').pop() || 'bin').toLowerCase()
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`
}

/**
 * Универсальная загрузка с прогрессом. Возвращает { url, path }.
 * onProgress(0..100).
 */
export function uploadFile(file, folder, onProgress) {
  const path = `${folder}/${safeName(file.name)}`
  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type })

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { devError('uploadFile', err); reject(err) },
      async () => resolve({ url: await getDownloadURL(task.snapshot.ref), path }),
    )
  })
}

/**
 * Загрузка short-видео в личную папку пользователя:
 *   shorts/{uid}/{fileName}
 */
export function uploadShortVideo(uid, file, onProgress) {
  if (!uid) return Promise.reject(new Error('uid обязателен для загрузки'))
  return uploadFile(file, `shorts/${uid}`, onProgress)
}

/** Загрузка обложки short в shorts/{uid}/thumbs/{fileName}. */
export function uploadShortThumbnail(uid, file, onProgress) {
  if (!uid) return Promise.reject(new Error('uid обязателен для загрузки'))
  return uploadFile(file, `shorts/${uid}/thumbs`, onProgress)
}

/** Удаление файла по storage-пути (молча игнорирует отсутствие). */
export async function deleteStoragePath(path) {
  if (!path) return
  try {
    await deleteObject(ref(storage, path))
  } catch (err) {
    devError('deleteStoragePath', err)
  }
}
