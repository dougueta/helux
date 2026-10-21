import type { SupabaseClient } from '@supabase/supabase-js'
import { detectGuidanceConflict } from '@helux/ai'
import type { SharedGuidance } from '@helux/types'
import { toGuidance, type GuidanceRow } from './agent-rows'
import { assertBudget, BudgetExceededError, recordUsage } from './ai-budget.service'

const DAY_MS = 24 * 60 * 60 * 1000

export type GuidanceResolution =
  | { status: 'ok'; guidance: SharedGuidance; conflict?: { guidanceId: string; text: string } }
  | { status: 'not-found' | 'not-pending' }

async function loadPending(userId: string, supabase: SupabaseClient, id: string): Promise<GuidanceRow | 'not-found' | 'not-pending'> {
  const { data, error } = await supabase.from('shared_guidance').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return 'not-found'
  const row = data as GuidanceRow
  return row.status === 'pendente' ? row : 'not-pending'
}

/**
 * Conflito de uma recomendação com as restrições de segurança ativas (FR-021):
 * só consulta a IA se houver restrição ativa e teto disponível.
 */
async function findConflict(userId: string, supabase: SupabaseClient, candidate: SharedGuidance): Promise<{ guidanceId: string; text: string } | null> {
  const { data, error } = await supabase.from('shared_guidance').select('*').eq('user_id', userId).eq('status', 'ativa').eq('kind', 'restricao-seguranca')
  if (error) throw error
  const active = ((data ?? []) as GuidanceRow[]).map(toGuidance)
  if (active.length === 0) return null
  try {
    await assertBudget(userId, supabase)
  } catch (err) {
    if (err instanceof BudgetExceededError) return null
    throw err
  }
  const { conflictWith, usage } = await detectGuidanceConflict({ candidate, active })
  await recordUsage(userId, [usage], supabase)
  const hit = active.find(g => g.id === conflictWith)
  return hit ? { guidanceId: hit.id, text: hit.text } : null
}

/**
 * Aceite (FR-018/019, R9): passa a valer agora, com prazo pelo `duration_days`.
 * Expira na leitura do Perfil Integrado (sem agendador).
 */
export async function acceptGuidance(userId: string, supabase: SupabaseClient, id: string, now: Date = new Date()): Promise<GuidanceResolution> {
  const row = await loadPending(userId, supabase, id)
  if (typeof row === 'string') return { status: row }
  const startsAt = now.toISOString()
  const expiresAt = row.duration_days ? new Date(now.getTime() + row.duration_days * DAY_MS).toISOString() : null
  const conflict = row.kind === 'recomendacao' ? await findConflict(userId, supabase, toGuidance(row)) : null
  const { error } = await supabase
    .from('shared_guidance')
    .update({ status: 'ativa', starts_at: startsAt, expires_at: expiresAt, conflicts_with: conflict?.guidanceId ?? null, updated_at: startsAt })
    .eq('id', id)
  if (error) throw error
  const guidance = toGuidance({ ...row, status: 'ativa', starts_at: startsAt, expires_at: expiresAt, conflicts_with: conflict?.guidanceId ?? null })
  return conflict ? { status: 'ok', guidance, conflict } : { status: 'ok', guidance }
}

export async function rejectGuidance(userId: string, supabase: SupabaseClient, id: string): Promise<GuidanceResolution> {
  const row = await loadPending(userId, supabase, id)
  if (typeof row === 'string') return { status: row }
  const { error } = await supabase.from('shared_guidance').update({ status: 'recusada', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  return { status: 'ok', guidance: toGuidance({ ...row, status: 'recusada' }) }
}
