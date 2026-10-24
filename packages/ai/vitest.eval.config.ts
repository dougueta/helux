import { defineConfig } from 'vitest/config'

// Evals com chamadas reais à Anthropic (spec 022, R10): só sob demanda.
export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/__evals__/**/*.eval.ts'],
    testTimeout: 900_000,
    maxConcurrency: 4,
  },
})
