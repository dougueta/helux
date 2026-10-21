import { describe, it, expect } from 'vitest'
import type { UsageRecord } from '@helux/types'
import { fakeSupabase } from './helpers/fake-supabase'
import { assertBudget, BudgetExceededError, budgetStatus, monthStartSaoPaulo, recordUsage, setBudgetCap } from '../services/ai-budget.service'

const usage: UsageRecord = {
  model: 'claude-opus-5-5',
  input_tokens: 1_000_000,
  output_tokens: 0,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  cacheTtl: null,
  operation: 'chat',
  agent: 'treino',
}
const NOW = new Date('2026-10-20T15:00:00Z')

describe('ai-budget.service (R11)', () => {
  it('mês civil em America/Sao_Paulo (UTC-3)', () => {
    expect(monthStartSaoPaulo(NOW)).toBe('2026-10-01T03:00:00.000Z')
    // 01/11 01:00 UTC ainda é 31/10 em São Paulo
    expect(monthStartSaoPaulo(new Date('2026-11-01T01:00:00Z'))).toBe('2026-10-01T03:00:00.000Z')
  })

  it('recordUsage grava o custo; budgetStatus soma o mês com teto padrão US$ 20', async () => {
    const fake = fakeSupabase({ ai_usage_events: [{ user_id: 'u1', cost_usd: 99, created_at: '2026-09-30T12:00:00Z' }], ai_budget_settings: [] })
    await recordUsage('u1', [usage, { ...usage, input_tokens: 500_000 }], fake.client as never)
    expect(fake.db.ai_usage_events.slice(1)).toEqual([
      expect.objectContaining({ user_id: 'u1', agent: 'treino', operation: 'chat', model: 'claude-opus-5-5', input_tokens: 1_000_000, cost_usd: 4 }),
      expect.objectContaining({ cost_usd: 2 }),
    ])
    for (const r of fake.db.ai_usage_events.slice(1)) r.created_at = '2026-10-10T12:00:00Z'
    expect(await budgetStatus('u1', fake.client as never, NOW)).toEqual({ capUsd: 20, spentUsd: 6, pct: 30 })
  })

  it('assertBudget: ≥ 100% lança; ≥ 80% devolve aviso; abaixo, nada', async () => {
    const at = (spent: number) =>
      fakeSupabase({ ai_usage_events: [{ user_id: 'u1', cost_usd: spent, created_at: '2026-10-05T12:00:00Z' }], ai_budget_settings: [{ user_id: 'u1', monthly_cap_usd: 10 }] }).client as never
    await expect(assertBudget('u1', at(10), NOW)).rejects.toBeInstanceOf(BudgetExceededError)
    await expect(assertBudget('u1', at(8.5), NOW)).resolves.toEqual({ warning: { pct: 85 } })
    await expect(assertBudget('u1', at(1), NOW)).resolves.toEqual({ warning: null })
  })

  it('setBudgetCap grava o teto (mínimo 1) e devolve o status', async () => {
    const fake = fakeSupabase({ ai_usage_events: [], ai_budget_settings: [] })
    expect(await setBudgetCap('u1', 50, fake.client as never, NOW)).toEqual({ capUsd: 50, spentUsd: 0, pct: 0 })
    await expect(setBudgetCap('u1', 0.5, fake.client as never, NOW)).rejects.toThrow()
  })
})
