/**
 * Скрипт начального заполнения Firestore демонстрационными shorts.
 *
 * ⚠️ DEMO-данные для учебной презентации.
 *
 * Запуск (ключи читаются из .env, в репозиторий не попадают):
 *   node --env-file=.env src/utils/seedShorts.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

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

// Публичный тестовый mp4 (работает отовсюду). Для настоящих вертикальных
// видео загружайте свои файлы через страницу /upload-short.
const SAMPLE = 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'

const DEMO = [
  { title: 'React за 30 секунд', category: 'Технологии', author: 'Алексей Петров', tags: ['react', 'js', 'frontend'], duration: 28, views: 1240, likes: 312 },
  { title: 'Гитарный риф дня', category: 'Музыка', author: 'Кирилл Фролов', tags: ['гитара', 'музыка'], duration: 19, views: 860, likes: 145 },
  { title: 'Планка: правильная техника', category: 'Спорт', author: 'Иван Волков', tags: ['фитнес', 'планка'], duration: 22, views: 2110, likes: 540 },
  { title: 'Карбонара без сливок', category: 'Кулинария', author: 'Андрей Лебедев', tags: ['паста', 'рецепт'], duration: 41, views: 3320, likes: 902 },
  { title: 'Git stash за минуту', category: 'Технологии', author: 'Дмитрий Козлов', tags: ['git', 'devtips'], duration: 33, views: 740, likes: 121 },
  { title: 'Аккорды для новичков', category: 'Музыка', author: 'Ольга Морозова', tags: ['аккорды', 'обучение'], duration: 24, views: 510, likes: 88 },
  { title: 'Растяжка после бега', category: 'Спорт', author: 'Анна Тихонова', tags: ['бег', 'растяжка'], duration: 36, views: 980, likes: 203 },
  { title: 'Идеальная яичница', category: 'Кулинария', author: 'Светлана Жукова', tags: ['завтрак', 'лайфхак'], duration: 17, views: 1530, likes: 377 },
]

async function seed() {
  console.log('Добавляем demo-shorts в Firestore…')
  let i = 0
  for (const s of DEMO) {
    const ref = await addDoc(collection(db, 'shorts'), {
      title: s.title,
      description: `Демонстрационный short: ${s.title.toLowerCase()}.`,
      authorId: 'demo-seed-user',
      authorName: s.author,
      authorAvatar: null,
      videoUrl: SAMPLE,
      videoPath: null,
      thumbnail: `https://picsum.photos/seed/short${i}/540/960`,
      thumbnailPath: null,
      duration: s.duration,
      category: s.category,
      tags: s.tags,
      hashtags: s.tags,
      likesCount: s.likes,
      commentsCount: 0,
      viewsCount: s.views,
      sharesCount: Math.floor(s.likes / 8),
      savesCount: Math.floor(s.likes / 5),
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
  console.log(`\n✅ Готово! Добавлено ${DEMO.length} demo-shorts.`)
  process.exit(0)
}

seed().catch((err) => { console.error('Ошибка:', err); process.exit(1) })
