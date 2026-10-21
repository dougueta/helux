import { describe, it, expect } from 'vitest'
import type { UsageRecord } from '@helux/types'
import { computeCostUsd, PRICING_VERSION } from '../../agents/cost'

const usage = (over: Partial<UsageRecord> = {}): UsageRecord => ({
  model: 'claude-opus-5-5',
  input_tokens: 0,
  output_tokens: 0,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  cacheTtl: null,
  operation: 'chat',
  agent: 'treino',
  ...over,
})

describe('computeCostUsd (R11)', () => {
  it('entrada US$ 4 e saída US$ 20 por MTok no Opus 5.5', () => {
    expect(computeCostUsd(usage({ input_tokens: 1_000_000 }))).toBeCloseTo(4)
    expect(computeCostUsd(usage({ output_tokens: 1_000_000 }))).toBeCloseTo(20)
  })

  it('leitura de cache US$ 0,20/MTok; escrita 1,25× (5 min) ou 2× (1 h)', () => {
    expect(computeCostUsd(usage({ cache_read_input_tokens: 1_000_000 }))).toBeCloseTo(0.2)
    expect(computeCostUsd(usage({ cache_creation_input_tokens: 1_000_000, cacheTtl: '5m' }))).toBeCloseTo(5)
    expect(computeCostUsd(usage({ cache_creation_input_tokens: 1_000_000, cacheTtl: '1h' }))).toBeCloseTo(8)
    expect(computeCostUsd(usage({ cache_creation_input_tokens: 1_000_000, cacheTtl: null }))).toBeCloseTo(5)
  })

  it('mensagem típica de chat ≈ US$ 0,02–0,04', () => {
    const c = computeCostUsd(usage({ input_tokens: 1000, cache_read_input_tokens: 5000, output_tokens: 600 }))
    expect(c).toBeGreaterThan(0.01)
    expect(c).toBeLessThan(0.04)
  })

  it('modelo desconhecido usa o preço do Opus 5.5; Haiku 5.5 tem preço próprio', () => {
    expect(computeCostUsd(usage({ model: 'claude-xpto', input_tokens: 1_000_000 }))).toBeCloseTo(4)
    expect(computeCostUsd(usage({ model: 'claude-haiku-5-5', input_tokens: 1_000_000 }))).toBeCloseTo(0.1)
    expect(PRICING_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
