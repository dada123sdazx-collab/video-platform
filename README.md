# ViewTube — Видеоплатформа

Учебный проект: веб-приложение для каталога и просмотра видео. Аналог YouTube/Stepik.

**Стек:** React 18 · Vite · Tailwind CSS v4 · Firebase Auth · Cloud Firestore · React Router v6

---

## Как запустить локально

**1. Клонировать репозиторий**
```bash
git clone https://github.com/dada123sdazx-collab/video-platform.git
cd video-platform
npm install
```

**2. Создать `.env` из шаблона**
```bash
cp .env.example .env
```
Заполните `.env` данными из Firebase Console → Project Settings → Your apps.

**3. Запустить**
```bash
npm run dev
# → http://localhost:5173
```

---

## Наполнение базы данных (первый запуск)

Скрипты читают ключи Firebase из `.env` (флаг `--env-file`, нужен Node 20+):

```bash
# Заполнить Firestore 12 тестовыми видео
node --env-file=.env src/utils/seedFirestore.js

# Если видео не воспроизводятся — обновить URL в Firestore
node --env-file=.env src/utils/fixVideoUrls.js
```

---

## Деплой на Firebase Hosting

```bash
npm run build
npx firebase-tools login         # откроется браузер, войдите через Google
npx firebase-tools deploy --only hosting
```

Приложение будет доступно по адресу: `https://video-b2a2b.web.app`

---

## Структура страниц

| Маршрут       | Описание                                        |
|---------------|-------------------------------------------------|
| `/`           | Главная — каталог с поиском и фильтрами         |
| `/video/:id`  | Просмотр видео — плеер, комментарии, лайки      |
| `/search`     | Результаты поиска                               |
| `/login`      | Вход                                            |
| `/register`   | Регистрация                                     |
| `/favorites`  | Избранное (требует авторизации)                 |
| `/author`     | Добавить видео (требует авторизации)            |
| `/history`    | История просмотров (требует авторизации)        |
| `/profile`    | Профиль пользователя — статистика и вкладки     |
| `/admin`      | Панель администратора (только для admin)        |

---

## Доступ в панель администратора

Администратором считается пользователь, чей `email` совпадает со значением `VITE_ADMIN_EMAIL` в файле `.env`.

### Данные для входа в админку:

| | |
|---|---|
| **Email** | `admin@viewtube.ru` |
| **Пароль** | `admin123` |

Перейдите на `/register`, зарегистрируйтесь с этими данными — ссылка на `/admin` появится в navbar автоматически.

### Что умеет администратор:

- Просматривать статистику (видео / пользователи / просмотры / комментарии)
- Добавлять, редактировать и удалять видео
- Просматривать список пользователей
- Удалять комментарии

---

## Переменные окружения

| Переменная                       | Описание                                      |
|----------------------------------|-----------------------------------------------|
| `VITE_FIREBASE_API_KEY`          | Firebase API ключ                             |
| `VITE_FIREBASE_AUTH_DOMAIN`      | Firebase Auth домен                           |
| `VITE_FIREBASE_PROJECT_ID`       | ID проекта Firebase                           |
| `VITE_FIREBASE_STORAGE_BUCKET`   | Firebase Storage bucket                       |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID                                  |
| `VITE_FIREBASE_APP_ID`           | App ID                                        |
| `VITE_ADMIN_EMAIL`               | Email администратора (по умолчанию `admin@viewtube.ru`) |

> ⚠️ Файл `.env` не коммитится в git. Для деплоя укажите переменные в настройках хостинга.

---

## Модели данных Firestore

```
users/{uid}          { name, email }
videos/{id}          { title, description, category, author, videoUrl, thumbnail, date, likes[], views }
favorites/{id}       { userId, videoId }
comments/{id}        { userId, videoId, userName, text, date }
watchHistory/{id}    { userId, videoId, date }
```
