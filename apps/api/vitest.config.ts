import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // Suíte e2e (spec 017) roda só via `pnpm test:e2e` — exige Docker/Supabase local.
    exclude: [...configDefaults.exclude, 'e2e/**/*.e2e.ts'],
  },
})
