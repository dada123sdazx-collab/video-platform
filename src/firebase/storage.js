import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { auth } from './config'

const storage = getStorage()

export function uploadFile(file, folder, onProgress) {
  const ext = file.name.split('.').pop()
  const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const storageRef = ref(storage, name)
  const task = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    )
  })
}
