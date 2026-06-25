/**
 * Скрипт начального заполнения Firestore демонстрационными shorts.
 *
 * ⚠️ DEMO-данные для учебной презентации.
 *
 * Запуск (ключи читаются из .env, в репозиторий не попадают):
 *   node --env-file=.env src/utils/seedShorts.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey) {
  console.error('Ключи Firebase не найдены. Запускайте так: node --env-file=.env src/utils/seedShorts.js')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Публичные тестовые прямые .mp4 (проверены, отдают video/mp4). Для настоящих
// вертикальных видео загружайте свои файлы через страницу /upload-short.
const SAMPLES = [
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/bunny/movie.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
]

const DEMO = [
  { title: 'React за 30 секунд', category: 'Технологии', author: 'Алексей Петров', tags: ['react', 'js', 'frontend'], duration: 28 },
  { title: 'Гитарный риф дня', category: 'Музыка', author: 'Кирилл Фролов', tags: ['гитара', 'музыка'], duration: 19 },
  { title: 'Планка: правильная техника', category: 'Спорт', author: 'Иван Волков', tags: ['фитнес', 'планка'], duration: 22 },
  { title: 'Карбонара без сливок', category: 'Кулинария', author: 'Андрей Лебедев', tags: ['паста', 'рецепт'], duration: 41 },
  { title: 'Git stash за минуту', category: 'Технологии', author: 'Дмитрий Козлов', tags: ['git', 'devtips'], duration: 33 },
  { title: 'Аккорды для новичков', category: 'Музыка', author: 'Ольга Морозова', tags: ['аккорды', 'обучение'], duration: 24 },
  { title: 'Растяжка после бега', category: 'Спорт', author: 'Анна Тихонова', tags: ['бег', 'растяжка'], duration: 36 },
  { title: 'Идеальная яичница', category: 'Кулинария', author: 'Светлана Жукова', tags: ['завтрак', 'лайфхак'], duration: 17 },
]

const SEED_AUTHOR = 'demo-seed-user'

async function seed() {
  // Идемпотентность: сначала удаляем ранее засеянные demo-shorts.
  const existing = await getDocs(query(collection(db, 'shorts'), where('authorId', '==', SEED_AUTHOR)))
  if (!existing.empty) {
    console.log(`Удаляем ${existing.size} старых demo-shorts…`)
    for (const d of existing.docs) await deleteDoc(doc(db, 'shorts', d.id))
  }

  console.log('Добавляем demo-shorts в Firestore…')
  let i = 0
  for (const s of DEMO) {
    // Счётчики честно стартуют с 0 — наполняются реальными действиями пользователей.
    const ref = await addDoc(collection(db, 'shorts'), {
      title: s.title,
      description: `Демонстрационный short: ${s.title.toLowerCase()}.`,
      authorId: SEED_AUTHOR,
      authorName: s.author,
      authorAvatar: null,
      videoUrl: SAMPLES[i % SAMPLES.length],
      videoPath: null,
      thumbnail: `https://picsum.photos/seed/short${i}/540/960`,
      thumbnailPath: null,
      duration: s.duration,
      category: s.category,
      tags: s.tags,
      hashtags: s.tags,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      status: 'published',
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
      moderation: { isReported: false, reportsCount: 0, lastReportAt: null },
    })
    console.log(`✓ ${s.title} (${ref.id})`)
    i++
  }
  console.log(`\n✅ Готово! Пересеяно ${DEMO.length} demo-shorts (счётчики = 0).`)
  process.exit(0)
}

seed().catch((err) => { console.error('Ошибка:', err); process.exit(1) })
