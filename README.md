# ViewTube — Видеоплатформа

Учебный проект: веб-приложение для каталога и просмотра видео + раздел
коротких вертикальных видео **Shorts** (по типу YouTube Shorts / TikTok / Reels).

**Стек:** React 19 · Vite · Tailwind CSS v4 · Firebase Auth · Cloud Firestore · Firebase Storage · React Router v7 · lucide-react

> ⚠️ **Внимание: это демонстрационные данные для учебной презентации.**
> Не использовать эти данные в production. В реальном проекте пароль
> администратора нельзя публиковать в README. См. раздел
> [«Demo-режим и production»](#demo-режим-и-production).

---

## Как запустить локально

```bash
git clone https://github.com/dada123sdazx-collab/video-platform.git
cd video-platform
npm install
cp .env.example .env     # заполните своими ключами Firebase
npm run dev              # → http://localhost:5173
```

Заполните `.env` данными из Firebase Console → Project Settings → Your apps.

### Проверка сборки и линтера

```bash
npm run build    # production-сборка
npm run lint     # ESLint (должен проходить без ошибок)
npm run preview  # предпросмотр собранного билда
```

---

## Переменные окружения

| Переменная | Описание |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API ключ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth домен |
| `VITE_FIREBASE_PROJECT_ID` | ID проекта Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket (нужен для загрузки shorts) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_DEMO_MODE` | `true` — включает учебный demo-режим (demo-админ) |
| `VITE_ADMIN_EMAIL` | Email demo-администратора (`admin@viewtube.ru`) |

> Файл `.env` **не коммитится** в git (`.gitignore`). `.env.example` содержит
> demo-значения, чтобы проект можно было быстро запустить для презентации.

---

## Наполнение базы данных

Скрипты читают ключи Firebase из `.env` (флаг `--env-file`, нужен Node 20+):

```bash
# 12 тестовых обычных видео
node --env-file=.env src/utils/seedFirestore.js

# 8 демонстрационных shorts
node --env-file=.env src/utils/seedShorts.js

# Если обычные видео не воспроизводятся — заменить URL на публичный mp4
node --env-file=.env src/utils/fixVideoUrls.js
```

---

## Маршруты

| Маршрут | Описание | Доступ |
|---|---|---|
| `/` | Главная — каталог + блок «Популярные Shorts» | все |
| `/video/:id` | Просмотр видео — плеер, комментарии, лайки | все |
| `/search` | Результаты поиска | все |
| `/shorts` | Лента коротких видео (вертикальная) | все |
| `/shorts/:id` | Конкретный short (открывается первым в ленте) | все |
| `/upload-short` | Загрузка short | авторизованные |
| `/login`, `/register` | Вход / регистрация | гости |
| `/favorites` | Избранное | авторизованные |
| `/author` | Добавить обычное видео | авторизованные |
| `/history` | История просмотров | авторизованные |
| `/profile` | Профиль: Избранное / История / **Мои Shorts** / **Сохранённые** / Настройки | авторизованные |
| `/admin` | Админка (видео, **Shorts-модерация**, пользователи, комментарии) | только админ |

---

## Что нового (раздел Shorts)

- **Лента `/shorts`** — вертикальный scroll-snap, автоплей активного видео,
  свайп/скролл и стрелки вверх-вниз, бесконечная курсорная пагинация.
- **Плеер** — `playsInline`, автостарт активного и пауза остальных, обход
  autoplay-ограничений (при блокировке звука стартует без звука), состояния
  загрузки/ошибки, в DOM держится не более 3 плееров (active ± 1).
- **Взаимодействия** — лайк (двойной тап + анимация сердечка), комментарии
  (bottom sheet), сохранение, «Поделиться» (Web Share API / копирование
  ссылки), жалобы. Лайки/сохранения — в отдельных коллекциях со счётчиками
  (не массивом в документе), atomic-инкременты, optimistic UI с откатом.
- **Просмотры** — засчитываются только после 2–3 сек активного показа
  (для очень коротких — после 50%), без накрутки при быстром скролле,
  гостям выдаётся анонимный id.
- **Загрузка** `/upload-short` — валидация (формат mp4/webm/mov, ≤ 100 МБ,
  ≤ 60 сек), прогресс, файлы в Storage по пути `shorts/{uid}/{fileName}`.
- **Профиль** — вкладки «Мои Shorts» (со статусом + удаление) и «Сохранённые».
- **Админка** — раздел «Shorts moderation»: фильтры (опубликованные / скрытые /
  с жалобами), поиск, скрыть/восстановить/удалить, просмотр жалоб и
  комментариев, пометка жалоб обработанными.
- **Горячие клавиши** — `↓`/`Space` дальше, `↑` назад, `M` звук, `L` лайк,
  `F` сохранить, `C` комментарии, `Esc` закрыть.

---

## Как протестировать Shorts

1. Заполните демо-данные: `node --env-file=.env src/utils/seedShorts.js`.
2. Откройте `/shorts` — листайте колесом/свайпом/стрелками, активное видео
   проигрывается само, остальные на паузе.
3. **Гость:** может смотреть и делиться; при попытке лайка/комментария —
   предложение войти.
4. **Пользователь:** лайк (или двойной тап), сохранение, комментарий,
   жалоба; загрузка своего short на `/upload-short`; «Мои Shorts» и
   «Сохранённые» в профиле.
5. **Demo-админ:** на `/admin` → вкладка **Shorts** — скрыть/восстановить/
   удалить, посмотреть жалобы и комментарии.
6. **Мобильный режим** (DevTools): вертикальное видео на весь экран, свайп,
   нет горизонтального скролла, bottom sheet комментариев.

---

## Demo-режим и production

### Вход в demo-админку (только для презентации)

| | |
|---|---|
| **Email** | `admin@viewtube.ru` |
| **Пароль** | `admin123` |

Зарегистрируйтесь с этими данными на `/register` — пункт «Админка» появится
в навигации автоматически. Проверка прав централизована в
[`src/utils/admin.js`](src/utils/admin.js) (`isDemoAdmin` / `isAdmin`), маршрут
`/admin` защищён компонентом [`AdminRoute`](src/components/AdminRoute.jsx).

> **Проект работает в demo-mode для учебной презентации.**
> Для production нужно заменить demo-admin на Firebase Custom Claims,
> усилить Firestore Rules и убрать публичные пароли.

Конкретно для production:
- Раздавать роль админа через **Firebase Custom Claims** (`request.auth.token.admin`),
  а не по email из публичного `.env`.
- Перенести инкременты счётчиков в **Cloud Functions** (а не доверять клиенту).
- Включить строгие **Firestore / Storage Security Rules** (см. ниже).

---

## Безопасность: правила и индексы

Примеры правил и индексов лежат в корне репозитория:

- [`firestore.rules.example`](firestore.rules.example) — правила Firestore
  (публичное чтение только опубликованных public shorts; запись контента
  только от своего `uid`; модерация — админ).
- [`storage.rules.example`](storage.rules.example) — правила Storage
  (запись только в свою папку `shorts/{uid}`, лимиты размера и contentType).
- [`firestore.indexes.json`](firestore.indexes.json) — составные индексы.

Применение:

```bash
cp firestore.rules.example firestore.rules
cp storage.rules.example storage.rules
firebase deploy --only firestore:rules,storage,firestore:indexes
```

> Если Firebase в консоли предложит создать индекс по ссылке из ошибки —
> это те же индексы, что и в `firestore.indexes.json`. До создания индексов
> лента работает через безопасный fallback (сортировка на клиенте).

---

## Модели данных Firestore

```
users/{uid}          { uid, name, email }
videos/{id}          { title, description, category, author, videoUrl, thumbnail, date, likes[], views }
favorites/{id}       { userId, videoId }
comments/{id}        { userId, videoId, userName, text, date }
watchHistory/{id}    { userId, videoId, date }

shorts/{id}          { title, description, authorId, authorName, authorAvatar,
                       videoUrl, videoPath, thumbnail, thumbnailPath, duration,
                       category, tags[], hashtags[],
                       likesCount, commentsCount, viewsCount, sharesCount, savesCount,
                       status, visibility, createdAt, updatedAt, publishedAt,
                       moderation: { isReported, reportsCount, lastReportAt } }
shortLikes/{uid_shortId}     { userId, shortId, createdAt }
shortSaves/{uid_shortId}     { userId, shortId, createdAt }
shortComments/{id}           { shortId, userId, userName, userAvatar, text, status, createdAt, updatedAt }
shortViews/{id}              { shortId, userId|null, anonId|null, watchMs, completed, createdAt }
shortReports/{uid_shortId}   { shortId, userId, reason, details, status, createdAt, reviewedAt }
```

**Storage:** `shorts/{uid}/{fileName}` (видео), `shorts/{uid}/thumbs/{fileName}` (обложки).

---

## Деплой на Firebase Hosting

```bash
npm run build
npx firebase-tools deploy --only hosting
```
