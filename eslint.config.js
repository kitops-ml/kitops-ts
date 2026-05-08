import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { includeIgnoreFile } from '@eslint/config-helpers'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, '.gitignore')

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  { ignores: ['dist/', 'node_modules/'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: globals.node,
    },
    plugins: {
      '@stylistic': stylistic,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Formatting
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/operator-linebreak': ['error', 'before'],

      // Linting
      curly: 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Relax some defaults
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
)
