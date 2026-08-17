/// <reference types="vitest" />
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  base: process.env['NODE_ENV'] === 'production'
    ? '/insane-soccer/'
    : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/learning/**',
      ],
    },
  },
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