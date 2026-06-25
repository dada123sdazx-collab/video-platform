/**
 * Централизованная проверка прав администратора.
 *
 * ⚠️ DEMO-РЕЖИМ (только для учебной презентации).
 * Администратором считается пользователь, чей email совпадает с
 * VITE_ADMIN_EMAIL, при включённом VITE_DEMO_MODE. Это НЕ безопасность
 * production-уровня — публичный пароль и проверка по email допустимы
 * только в учебном проекте. Для production используйте Firebase Custom
 * Claims / роли в Firestore и строгие Security Rules (см. README).
 */

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

/** Включён ли учебный demo-режим. */
export const isDemoMode = () => DEMO_MODE

/** Email demo-администратора из переменных окружения. */
export const adminEmail = () => ADMIN_EMAIL

/**
 * Является ли пользователь demo-администратором.
 * @param {object|null} user — объект Firebase Auth user.
 */
export const isDemoAdmin = (user) =>
  DEMO_MODE && !!user?.email && !!ADMIN_EMAIL && user.email === ADMIN_EMAIL

/**
 * Единая точка проверки админских прав по всему приложению.
 * Сейчас опирается на demo-режим; при переходе на Custom Claims
 * достаточно поменять реализацию здесь.
 */
export const isAdmin = (user) => isDemoAdmin(user)
