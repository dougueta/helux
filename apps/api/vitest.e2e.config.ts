import { defineConfig } from 'vitest/config'

// Verificação de ponta a ponta (spec 017): API real + Supabase local + IA simulada.
export default defineConfig({
  test: {
    include: ['e2e/**/*.e2e.ts'],
    globalSetup: './e2e/global-setup.ts',
    testTimeout: 60_000,
    hookTimeout: 600_000,
    fileParallelism: false,
    reporters: ['verbose'],
  },
})
