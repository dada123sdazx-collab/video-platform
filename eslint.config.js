import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  // Браузерный код приложения (React)
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/utils/seedFirestore.js', 'src/utils/fixVideoUrls.js', 'src/utils/seedShorts.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // В проекте принят паттерн «Provider + хук useX в одном файле».
      // Разрешаем экспорт констант/хуков рядом с компонентом.
      'react-refresh/only-export-components': 'off',
      // Канонический паттерн «setLoading(true) перед async-fetch в effect»
      // используется по всему приложению; правило (RC) считает это анти-паттерном.
      'react-hooks/set-state-in-effect': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Node-скрипты (конфиг Vite и сиды Firestore)
  {
    files: ['vite.config.js', 'eslint.config.js', 'src/utils/seedFirestore.js', 'src/utils/fixVideoUrls.js', 'src/utils/seedShorts.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
