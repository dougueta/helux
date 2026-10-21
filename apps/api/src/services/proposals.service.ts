import type { SupabaseClient } from '@supabase/supabase-js'
import { ConstraintsUnsatisfiableError, proposeSessionAdjustment } from '@helux/ai'
import type { MesocycleSession, ProposalKind, WorkoutAdjustmentProposal } from '@helux/types'
import { toProposal, type ProposalRow } from './agent-rows'
import { assertBudget, recordUsage } from './ai-budget.service'
import { buildIntegratedProfile } from './integrated-profile.service'

/** Não há sessão pendente para ajustar. */
export class NoPendingSessionError extends Error {
  readonly code = 'no-pending-session'
  constructor() {
    super('Não há sessão pendente no mesociclo')
  }
}

export async function createProposal(
  userId: string,
  supabase: SupabaseClient,
  p: { mesocycleId: string; kind: ProposalKind; sessionIndexes: number[]; before: MesocycleSession[]; after: MesocycleSession[]; changes: WorkoutAdjustmentProposal['changes']; reason: string; messageId?: string | null },
): Promise<WorkoutAdjustmentProposal> {
  const { data, error } = await supabase
    .from('workout_adjustment_proposals')
    .insert({
      user_id: userId,
      mesocycle_id: p.mesocycleId,
      kind: p.kind,
      session_indexes: p.sessionIndexes,
      before: p.before,
      after: p.after,
      changes: p.changes,
      reason: p.reason,
      status: 'pendente',
      message_id: p.messageId ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return toProposal(data as ProposalRow)
}

/**
 * Pede à IA o ajuste das sessões pendentes e grava a proposta pendente
 * (FR-009, FR-011). `hoje` = só a sessão pendente atual; `pendentes` = todas.
 * Checa o teto antes e registra o uso, mesmo quando a validação falha.
 */
export async function requestSessionAdjustment(
  userId: string,
  supabase: SupabaseClient,
  opts: { request: string; scope: 'hoje' | 'pendentes'; kind: ProposalKind; sessionIndexes?: number[]; messageId?: string | null },
): Promise<WorkoutAdjustmentProposal> {
  await assertBudget(userId, supabase)
  const build = await buildIntegratedProfile(userId, supabase)
  const mesocycle = build.mesocycle
  const pending = (mesocycle?.sessions ?? []).map((s, i) => (s.completedAt === null ? i : -1)).filter(i => i >= 0)
  if (!mesocycle || pending.length === 0) throw new NoPendingSessionError()
  const sessionIndexes = opts.sessionIndexes ?? (opts.scope === 'hoje' ? [pending[0]] : pending)

  try {
    const result = await proposeSessionAdjustment({
      profile: build.profile,
      constraints: build.constraints,
      sessions: mesocycle.sessions,
      sessionIndexes,
      request: opts.request,
      operation: opts.kind,
    })
    await recordUsage(userId, result.usages, supabase)
    return createProposal(userId, supabase, {
      mesocycleId: mesocycle.id,
      kind: opts.kind,
      sessionIndexes,
      before: sessionIndexes.map(i => mesocycle.sessions[i]),
      after: result.after,
      changes: result.changes,
      reason: result.reason,
      messageId: opts.messageId,
    })
  } catch (err) {
    if (err instanceof ConstraintsUnsatisfiableError) await recordUsage(userId, err.usages, supabase)
    throw err
  }
}

export type ResolveResult =
  | { status: 'ok'; proposal: WorkoutAdjustmentProposal; mesocycle?: { id: string; sessions: MesocycleSession[] } }
  | { status: 'not-found' | 'not-pending' | 'obsolete' }

async function loadPending(userId: string, supabase: SupabaseClient, id: string): Promise<ProposalRow | 'not-found' | 'not-pending'> {
  const { data, error } = await supabase.from('workout_adjustment_proposals').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return 'not-found'
  const row = data as ProposalRow
  return row.status === 'pendente' ? row : 'not-pending'
}

async function setStatus(supabase: SupabaseClient, id: string, status: WorkoutAdjustmentProposal['status']) {
  const { error } = await supabase.from('workout_adjustment_proposals').update({ status, resolved_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/**
 * Aceita a proposta (data-model): se as sessões mudaram desde a proposta, ela
 * fica `obsoleta` e nada é aplicado; senão substitui as sessões pendentes.
 */
export async function acceptProposal(userId: string, supabase: SupabaseClient, id: string): Promise<ResolveResult> {
  const row = await loadPending(userId, supabase, id)
  if (typeof row === 'string') return { status: row }
  const { data, error } = await supabase.from('mesocycle_plans').select('id, sessions').eq('id', row.mesocycle_id).eq('user_id', userId).maybeSingle()
  if (error) throw error
  const mesocycle = data as { id: string; sessions: MesocycleSession[] } | null
  const current = row.session_indexes.map(i => mesocycle?.sessions[i])
  const unchanged = mesocycle && JSON.stringify(current) === JSON.stringify(row.before) && current.every(s => s?.completedAt === null)
  if (!mesocycle || !unchanged) {
    await setStatus(supabase, id, 'obsoleta')
    return { status: 'obsolete' }
  }
  const sessions = mesocycle.sessions.map((s, i) => {
    const k = row.session_indexes.indexOf(i)
    return k === -1 ? s : row.after[k]
  })
  const { error: updateError } = await supabase.from('mesocycle_plans').update({ sessions }).eq('id', mesocycle.id)
  if (updateError) throw updateError
  await setStatus(supabase, id, 'aceita')
  return { status: 'ok', proposal: toProposal({ ...row, status: 'aceita' }), mesocycle: { id: mesocycle.id, sessions } }
}

export async function rejectProposal(userId: string, supabase: SupabaseClient, id: string): Promise<ResolveResult> {
  const row = await loadPending(userId, supabase, id)
  if (typeof row === 'string') return { status: row }
  await setStatus(supabase, id, 'recusada')
  return { status: 'ok', proposal: toProposal({ ...row, status: 'recusada' }) }
}
