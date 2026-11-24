import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// GitHub Pages（サブパス配信）でも動くよう、相対パスでビルドする
export default defineConfig({
  base: './',
  plugins: [svelte()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
