import type { SupabaseClient } from '@supabase/supabase-js'
import type { BodyCheckin, CycleSummary, Goal, MesocycleSession, PainReport, TirednessLevel } from '@helux/types'
import { analyzeCycle, checkinTrend, parseGoalTarget, type CheckinTrendResult } from '@helux/workouts'

// Spec 024 (R11): ao concluir um ciclo, a análise é calculada em código, gravada
// em `cycle_analyses` e ligada ao próximo mesociclo.

export interface CompletedMesocycle {
  id: string
  generated_at: string
  sessions: MesocycleSession[]
}

export async function runCycleAnalysis(
  userId: string,
  supabase: SupabaseClient,
  previous: CompletedMesocycle,
  goal: Goal,
  goalTarget: string | null,
): Promise<{ summary: CycleSummary; trend: CheckinTrendResult | null }> {
  const since = previous.generated_at.slice(0, 10)
  const [workouts, checkins, tiredness, body] = await Promise.all([
    supabase.from('workout_sessions').select('id, date, duration_s, review_status, exercises').eq('user_id', userId).gte('date', since),
    supabase.from('session_checkins').select('phase, date, rpe, pains').eq('user_id', userId).gte('date', since),
    supabase.from('daily_tiredness_signals').select('level').eq('user_id', userId).gte('date', since),
    supabase.from('body_checkins').select('*').eq('user_id', userId).order('month', { ascending: false }).limit(2),
  ])
  for (const r of [workouts, checkins, tiredness, body]) if (r.error) throw r.error

  const [curr, prev] = (body.data ?? []) as BodyCheckin[]
  const trend = curr && prev ? checkinTrend(prev, curr, goal, parseGoalTarget(goalTarget)) : null
  // O resumo guarda a tendência sem os modificadores internos do método.
  const storedTrend = trend ? { from: trend.from, to: trend.to, deltas: trend.deltas, implausible: trend.implausible, modifiers: trend.modifiers, suggestGoalChange: trend.suggestGoalChange } : null

  const summary = analyzeCycle({
    mesocycleId: previous.id,
    startDate: since,
    sessions: previous.sessions,
    workouts: (workouts.data ?? []) as CycleAnalysisWorkout[],
    checkins: ((checkins.data ?? []) as { phase: 'antes' | 'depois'; date: string; rpe: number | null; pains: PainReport[] | null }[]).map(c => ({ ...c, pains: c.pains ?? [] })),
    tiredness: ((tiredness.data ?? []) as { level: TirednessLevel | null }[]).flatMap(t => (t.level ? [t.level] : [])),
    trend: storedTrend,
  })

  const { error } = await supabase
    .from('cycle_analyses')
    .upsert({ user_id: userId, mesocycle_id: previous.id, summary, next_mesocycle_id: null }, { onConflict: 'mesocycle_id' })
  if (error) throw error
  return { summary, trend }
}

type CycleAnalysisWorkout = Parameters<typeof analyzeCycle>[0]['workouts'][number]

export async function linkNextMesocycle(userId: string, supabase: SupabaseClient, mesocycleId: string, nextId: string): Promise<void> {
  const { error } = await supabase.from('cycle_analyses').update({ next_mesocycle_id: nextId }).eq('user_id', userId).eq('mesocycle_id', mesocycleId)
  if (error) throw error
}

/** Análise que gerou este mesociclo (o ciclo anterior) ou, se ainda não há próximo, a do próprio ciclo. */
export async function getCycleAnalysis(userId: string, supabase: SupabaseClient, mesocycleId: string): Promise<CycleSummary | null> {
  for (const column of ['next_mesocycle_id', 'mesocycle_id']) {
    const { data, error } = await supabase.from('cycle_analyses').select('summary').eq('user_id', userId).eq(column, mesocycleId).maybeSingle()
    if (error) throw error
    if (data) return (data as { summary: CycleSummary }).summary
  }
  return null
}
