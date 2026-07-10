/// <reference types="vitest" />
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  base: process.env['NODE_ENV'] === 'production'
    ? '/insane-soccer/'
    : '/',
  plugins: [
    checker({
      typescript: true,
      eslint: { lintCommand: 'eslint src --ext .ts' },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
    },
  },
})