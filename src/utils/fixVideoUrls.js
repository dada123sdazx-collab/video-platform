/**
 * Скрипт обновления videoUrl для всех видео в Firestore.
 * Заменяет локальные пути /videos/*.mp4 на рабочий публичный URL.
 *
 * Запуск (ключи читаются из .env, в репозиторий не попадают):
 *   node --env-file=.env src/utils/fixVideoUrls.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey) {
  console.error('Ключи Firebase не найдены. Запускайте так: node --env-file=.env src/utils/fixVideoUrls.js')
  process.exit(1)
}

// Публичный тестовый mp4 — работает отовсюду
const PUBLIC_VIDEO_URL = 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function fix() {
  const snap = await getDocs(collection(db, 'videos'))
  let updated = 0
  for (const d of snap.docs) {
    const url = d.data().videoUrl ?? ''
    if (url.startsWith('/videos/') || !url.startsWith('http')) {
      await updateDoc(doc(db, 'videos', d.id), { videoUrl: PUBLIC_VIDEO_URL })
      console.log(`✓ ${d.data().title}`)
      updated++
    }
  }
  console.log(`\n✅ Обновлено ${updated} видео.`)
  process.exit(0)
}

fix().catch(e => { console.error(e); process.exit(1) })
