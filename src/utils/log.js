/** Логирование технических ошибок только в dev-режиме. */
export function devError(scope, error) {
  if (import.meta.env.DEV) {
    console.error(`[${scope}]`, error)
  }
}
