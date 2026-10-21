import type { SupabaseClient } from '@supabase/supabase-js'
import type { BudgetStatus, UsageRecord } from '@helux/types'
import { computeCostUsd } from '@helux/ai'

export const DEFAULT_CAP_USD = 20
const WARNING_PCT = 80

/** Teto mensal atingido (FR-026): a API responde 409 `budget-exceeded`. */
export class BudgetExceededError extends Error {
  readonly code = 'budget-exceeded'
  constructor(readonly status: BudgetStatus) {
    super('Teto mensal de IA atingido')
  }
}

/** Início do mês civil em America/Sao_Paulo (UTC-3, sem horário de verão desde 2019). */
export function monthStartSaoPaulo(now: Date): string {
  const sp = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return new Date(Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), 1, 3)).toISOString()
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Grava o uso de cada chamada de IA com o custo calculado (R11). */
export async function recordUsage(userId: string, usages: UsageRecord[], supabase: SupabaseClient): Promise<void> {
  if (usages.length === 0) return
  const { error } = await supabase.from('ai_usage_events').insert(
    usages.map(u => ({
      user_id: userId,
      agent: u.agent,
      operation: u.operation,
      model: u.model,
      input_tokens: u.input_tokens,
      output_tokens: u.output_tokens,
      cache_creation_input_tokens: u.cache_creation_input_tokens,
      cache_read_input_tokens: u.cache_read_input_tokens,
      cost_usd: computeCostUsd(u),
    })),
  )
  if (error) throw error
}

/** Teto e consumo do mês corrente. */
export async function budgetStatus(userId: string, supabase: SupabaseClient, now: Date = new Date()): Promise<BudgetStatus> {
  const [settings, events] = await Promise.all([
    supabase.from('ai_budget_settings').select('monthly_cap_usd').eq('user_id', userId).maybeSingle(),
    supabase.from('ai_usage_events').select('cost_usd').eq('user_id', userId).gte('created_at', monthStartSaoPaulo(now)),
  ])
  if (settings.error) throw settings.error
  if (events.error) throw events.error
  const capUsd = Number((settings.data as { monthly_cap_usd: number } | null)?.monthly_cap_usd ?? DEFAULT_CAP_USD)
  const spentUsd = round2(((events.data ?? []) as { cost_usd: number | string }[]).reduce((s, e) => s + Number(e.cost_usd), 0))
  return { capUsd, spentUsd, pct: Math.round((spentUsd / capUsd) * 100) }
}

/**
 * Checagem antes de cada operação de IA (FR-026): ≥ 100% lança
 * `BudgetExceededError`; ≥ 80% devolve o aviso; a operação em andamento sempre termina.
 */
export async function assertBudget(userId: string, supabase: SupabaseClient, now: Date = new Date()): Promise<{ warning: { pct: number } | null }> {
  const status = await budgetStatus(userId, supabase, now)
  if (status.pct >= 100) throw new BudgetExceededError(status)
  return { warning: status.pct >= WARNING_PCT ? { pct: status.pct } : null }
}

export async function setBudgetCap(userId: string, capUsd: number, supabase: SupabaseClient, now: Date = new Date()): Promise<BudgetStatus> {
  if (!Number.isFinite(capUsd) || capUsd < 1) throw new Error('O teto mínimo é US$ 1')
  const { error } = await supabase
    .from('ai_budget_settings')
    .upsert({ user_id: userId, monthly_cap_usd: capUsd, updated_at: now.toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
  return budgetStatus(userId, supabase, now)
}
