import type { SupabaseClient } from '@supabase/supabase-js'
import type { MesocycleSession, PlanDecision, SourcesUsed } from '@helux/types'

export interface MesocycleRow {
  id: string
  generated_at: string
  days_per_week: number
  split_type: string
  sessions: MesocycleSession[]
  rationale: string
  /** Spec 022: justificativa por decisão e fontes usadas (null em planos antigos). */
  rationale_decisions?: PlanDecision[] | null
  sources_used?: SourcesUsed | null
}

export async function getActiveMesocycle(userId: string, supabase: SupabaseClient): Promise<MesocycleRow | null> {
  const { data, error } = await supabase
    .from('mesocycle_plans')
    .select('id, generated_at, days_per_week, split_type, sessions, rationale, rationale_decisions, sources_used')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as MesocycleRow | null) ?? null
}

export function findPendingSessionIndex(sessions: MesocycleSession[]): number {
  return sessions.findIndex((session) => session.completedAt === null)
}

export function markSessionCompleted(sessions: MesocycleSession[], index: number): MesocycleSession[] {
  if (index < 0 || index >= sessions.length) return sessions
  if (sessions[index].completedAt !== null) return sessions

  return sessions.map((session, i) =>
    i === index ? { ...session, completedAt: new Date().toISOString() } : session,
  )
}

export function isMesocycleComplete(sessions: MesocycleSession[]): boolean {
  return sessions.length > 0 && sessions.every((session) => session.completedAt !== null)
}
