import type { SupabaseClient } from '@supabase/supabase-js'
import type { DietCalibration, DietGoal, DietPhase, DietTargets, RecalibrationEvaluation } from '@helux/types'
import { ageOn, effectiveBodyFat, evaluateRecalibration as evaluateRecalibrationRule, phaseTargets } from '@helux/nutrition'
import { toDietPhase, type DietPhaseRow, type MissingField, type NutritionContext } from './nutrition-context.service'

// Spec 018 (US0) — fase de dieta: criar e encerrar.
// Spec 029 (US3) — recalibração sob demanda, pelos pesos de tendência.

const GOAL_LABEL: Record<DietGoal, string> = {
  perder_gordura: 'perder gordura',
  ganhar_massa: 'ganhar massa',
  recomposicao: 'recomposição',
  manutencao: 'manutenção',
}

interface CalibrationRow {
  id: string
  action: DietCalibration['action']
  before: DietTargets | null
  after: DietTargets
  reason: string
  metrics: DietCalibration['metrics']
  created_at: string
}

export function toCalibration(row: CalibrationRow): DietCalibration {
  return {
    id: row.id,
    action: row.action,
    before: row.before,
    after: row.after,
    reason: row.reason,
    metrics: row.metrics,
    createdAt: row.created_at,
  }
}

/** Spec 029 (FR-022): % de gordura mais recente, de qualquer origem (empate → fita). */
export function currentBodyFat(ctx: Pick<NutritionContext, 'measurements'>): number | null {
  return effectiveBodyFat(ctx.measurements)?.pct ?? null
}

export type CreatePhaseResult =
  | { phase: DietPhase; calibration: DietCalibration }
  | { error: 'needs-profile'; missing: MissingField[] }

export async function createPhase(
  userId: string,
  supabase: SupabaseClient,
  { goal, durationWeeks }: { goal: DietGoal; durationWeeks: number },
  ctx: NutritionContext,
  now: Date = new Date(),
): Promise<CreatePhaseResult> {
  if (ctx.missing.length > 0) return { error: 'needs-profile', missing: ctx.missing }
  const weightKg = ctx.currentWeightKg as number
  const latestMeasurement = ctx.measurements[0] ?? null
  const { heightCm, birthDate, sex } = ctx.profile as { heightCm: number; birthDate: string; sex: NonNullable<NutritionContext['profile']['sex']> }

  const targets = phaseTargets({ goal, weightKg, heightCm, age: ageOn(birthDate, ctx.today), sex, daysPerWeek: ctx.daysPerWeek })

  if (ctx.phase) {
    await supabase.from('diet_phases').update({ status: 'encerrada', ended_at: now.toISOString() }).eq('id', ctx.phase.id)
  }

  const { data: phaseRow, error: phaseError } = await supabase
    .from('diet_phases')
    .insert({
      user_id: userId,
      goal,
      started_on: ctx.today,
      duration_weeks: durationWeeks,
      status: 'ativa',
      base_targets: targets,
      start_checkin_id: latestMeasurement?.id ?? null,
    })
    .select('*')
    .single()
  if (phaseError) throw phaseError

  const bodyFatPct = currentBodyFat(ctx)
  const { data: calRow, error: calError } = await supabase
    .from('diet_phase_calibrations')
    .insert({
      phase_id: (phaseRow as DietPhaseRow).id,
      user_id: userId,
      checkin_id: latestMeasurement?.id ?? null,
      action: 'inicial',
      before: null,
      after: targets,
      reason: `Fase iniciada: ${GOAL_LABEL[goal]} por ${durationWeeks} semanas, a partir de ${String(weightKg).replace('.', ',')} kg.`,
      metrics: { weeks: 0, weightFromKg: weightKg, weightToKg: weightKg, weeklyRatePct: 0, ...(bodyFatPct != null ? { bodyFatPct } : {}) },
    })
    .select('*')
    .single()
  if (calError) throw calError

  return { phase: toDietPhase(phaseRow as DietPhaseRow), calibration: toCalibration(calRow as CalibrationRow) }
}

export async function endPhase(userId: string, supabase: SupabaseClient, now: Date = new Date()): Promise<DietPhase | null> {
  const { data, error } = await supabase
    .from('diet_phases')
    .update({ status: 'encerrada', ended_at: now.toISOString() })
    .eq('user_id', userId)
    .eq('status', 'ativa')
    .select('*')
  if (error) throw error
  const row = ((data ?? []) as DietPhaseRow[])[0]
  return row ? toDietPhase(row) : null
}

/** Spec 029 (US3): avaliação de "Recalibrar dieta" sem gravar nada (regra em @helux/nutrition). */
export function evaluateRecalibration(ctx: NutritionContext): RecalibrationEvaluation {
  return evaluateRecalibrationRule({
    today: ctx.today,
    phase: ctx.phase,
    profile: ctx.profile,
    lastCalibrationAt: ctx.lastCalibration?.createdAt ?? null,
    weights: ctx.weights,
    measurements: ctx.measurements,
    daysPerWeek: ctx.daysPerWeek,
  })
}

/**
 * Spec 029 (FR-021): aplica a recalibração — recalcula no servidor (o cliente
 * nunca manda metas), grava a calibração (inclusive "manter", que reinicia a
 * janela de 2 semanas) e atualiza as metas-base.
 */
export async function applyRecalibration(
  userId: string,
  supabase: SupabaseClient,
  ctx: NutritionContext,
): Promise<{ calibration: DietCalibration } | { evaluation: Exclude<RecalibrationEvaluation, { status: 'proposta' }> }> {
  const evaluation = evaluateRecalibration(ctx)
  if (evaluation.status !== 'proposta') return { evaluation }
  const phase = ctx.phase as DietPhase

  const { data: calRow, error } = await supabase
    .from('diet_phase_calibrations')
    .insert({
      phase_id: phase.id,
      user_id: userId,
      checkin_id: ctx.measurements[0]?.id ?? null,
      action: evaluation.action,
      before: evaluation.before,
      after: evaluation.after,
      reason: evaluation.reason,
      metrics: evaluation.metrics,
    })
    .select('*')
    .single()
  if (error) throw error

  if (JSON.stringify(evaluation.after) !== JSON.stringify(evaluation.before)) {
    const { error: updError } = await supabase.from('diet_phases').update({ base_targets: evaluation.after }).eq('id', phase.id)
    if (updError) throw updError
  }
  return { calibration: toCalibration(calRow as CalibrationRow) }
}
