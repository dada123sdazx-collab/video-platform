/**
 * Скрипт начального заполнения Firestore 12 видео.
 *
 * Запуск (ключи читаются из .env, в репозиторий не попадают):
 *   node --env-file=.env src/utils/seedFirestore.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey) {
  console.error('Ключи Firebase не найдены. Запускайте так: node --env-file=.env src/utils/seedFirestore.js')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const videos = [
  // Технологии
  {
    title: 'Введение в JavaScript: основы языка',
    description: 'Изучаем базовые концепции JavaScript: переменные, типы данных, функции и управляющие конструкции.',
    category: 'Технологии',
    author: 'Алексей Петров',
    videoUrl: '/videos/video-1.mp4',
    thumbnail: 'https://picsum.photos/seed/tech1/640/360',
    likes: [],
    views: 142,
    date: new Date('2024-09-01'),
  },
  {
    title: 'React для начинающих: компоненты и хуки',
    description: 'Разбираем компонентный подход в React, useState, useEffect и создаём первое приложение.',
    category: 'Технологии',
    author: 'Марина Сидорова',
    videoUrl: '/videos/video-2.mp4',
    thumbnail: 'https://picsum.photos/seed/tech2/640/360',
    likes: [],
    views: 98,
    date: new Date('2024-09-15'),
  },
  {
    title: 'Git и GitHub: работа с версиями кода',
    description: 'Команды git init, commit, push, pull request — полное руководство для новичков.',
    category: 'Технологии',
    author: 'Дмитрий Козлов',
    videoUrl: '/videos/video-3.mp4',
    thumbnail: 'https://picsum.photos/seed/tech3/640/360',
    likes: [],
    views: 203,
    date: new Date('2024-10-02'),
  },
  // Музыка
  {
    title: 'Как научиться играть на гитаре с нуля',
    description: 'Первые аккорды, постановка рук, базовые упражнения — всё что нужно начинающему гитаристу.',
    category: 'Музыка',
    author: 'Кирилл Фролов',
    videoUrl: '/videos/video-4.mp4',
    thumbnail: 'https://picsum.photos/seed/music1/640/360',
    likes: [],
    views: 317,
    date: new Date('2024-08-20'),
  },
  {
    title: 'Теория музыки: ноты и гаммы за 20 минут',
    description: 'Объясняем нотную грамоту простым языком. Гаммы до мажор и ля минор.',
    category: 'Музыка',
    author: 'Ольга Морозова',
    videoUrl: '/videos/video-5.mp4',
    thumbnail: 'https://picsum.photos/seed/music2/640/360',
    likes: [],
    views: 189,
    date: new Date('2024-09-05'),
  },
  {
    title: 'Сведение трека в FL Studio: основы микширования',
    description: 'EQ, компрессия, реверберация — базовый процесс сведения электронного трека.',
    category: 'Музыка',
    author: 'Никита Белов',
    videoUrl: '/videos/video-6.mp4',
    thumbnail: 'https://picsum.photos/seed/music3/640/360',
    likes: [],
    views: 256,
    date: new Date('2024-10-10'),
  },
  // Спорт
  {
    title: 'Утренняя зарядка: 10 минут для бодрости',
    description: 'Простой комплекс упражнений без инвентаря, подходит для любого уровня подготовки.',
    category: 'Спорт',
    author: 'Иван Волков',
    videoUrl: '/videos/video-7.mp4',
    thumbnail: 'https://picsum.photos/seed/sport1/640/360',
    likes: [],
    views: 421,
    date: new Date('2024-07-15'),
  },
  {
    title: 'Техника бега: как правильно ставить стопу',
    description: 'Разбираем технику бега, распространённые ошибки и упражнения для улучшения шага.',
    category: 'Спорт',
    author: 'Анна Тихонова',
    videoUrl: '/videos/video-8.mp4',
    thumbnail: 'https://picsum.photos/seed/sport2/640/360',
    likes: [],
    views: 178,
    date: new Date('2024-08-03'),
  },
  {
    title: 'Домашняя тренировка на всё тело без оборудования',
    description: '30-минутный комплекс: приседания, отжимания, планка и кардио блоки.',
    category: 'Спорт',
    author: 'Сергей Попов',
    videoUrl: '/videos/video-9.mp4',
    thumbnail: 'https://picsum.photos/seed/sport3/640/360',
    likes: [],
    views: 534,
    date: new Date('2024-09-20'),
  },
  // Кулинария
  {
    title: 'Борщ по классическому рецепту',
    description: 'Пошаговый рецепт традиционного борща с говядиной. Секреты насыщенного цвета и вкуса.',
    category: 'Кулинария',
    author: 'Светлана Жукова',
    videoUrl: '/videos/video-10.mp4',
    thumbnail: 'https://picsum.photos/seed/food1/640/360',
    likes: [],
    views: 612,
    date: new Date('2024-07-28'),
  },
  {
    title: 'Шоколадный торт за 1 час: простой рецепт',
    description: 'Влажный бисквит, шоколадный ганаш, украшение кремом — полный разбор по шагам.',
    category: 'Кулинария',
    author: 'Татьяна Романова',
    videoUrl: '/videos/video-11.mp4',
    thumbnail: 'https://picsum.photos/seed/food2/640/360',
    likes: [],
    views: 389,
    date: new Date('2024-09-12'),
  },
  {
    title: 'Паста Карбонара: итальянский оригинал',
    description: 'Настоящая Carbonara без сливок — только яйца, гуанчале, пекорино и паста.',
    category: 'Кулинария',
    author: 'Андрей Лебедев',
    videoUrl: '/videos/video-12.mp4',
    thumbnail: 'https://picsum.photos/seed/food3/640/360',
    likes: [],
    views: 741,
    date: new Date('2024-10-18'),
  },
]

async function seed() {
  console.log('Добавляем видео в Firestore...')
  for (const video of videos) {
    const ref = await addDoc(collection(db, 'videos'), video)
    console.log(`✓ ${video.title} (${ref.id})`)
  }
  console.log('\n✅ Готово! Добавлено', videos.length, 'видео.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Ошибка:', err)
  process.exit(1)
})
