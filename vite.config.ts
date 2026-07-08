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
})