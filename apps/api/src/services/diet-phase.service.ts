import type { SupabaseClient } from '@supabase/supabase-js'
import type { BodyCheckin, DietCalibration, DietGoal, DietPhase, DietTargets } from '@helux/types'
import { ageOn, navyBodyFat, phaseTargets, recalibrate } from '@helux/nutrition'
import { toDietPhase, type DietPhaseRow, type MissingField, type NutritionContext } from './nutrition-context.service'

// Spec 018 (US0) — fase de dieta: criar, encerrar e recalibrar a cada check-in.

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

/** % de gordura do check-in: o digitado prevalece; senão, Marinha (fita métrica). */
export function checkinBodyFat(checkin: BodyCheckin, ctx: Pick<NutritionContext, 'profile'>): number | null {
  if (checkin.body_fat_pct != null) return Number(checkin.body_fat_pct)
  const { heightCm, sex } = ctx.profile
  if (heightCm == null || !sex) return null
  return navyBodyFat({
    sex,
    heightCm,
    waistCm: checkin.waist_cm != null ? Number(checkin.waist_cm) : null,
    neckCm: checkin.neck_cm != null ? Number(checkin.neck_cm) : null,
    hipCm: checkin.hip_cm != null ? Number(checkin.hip_cm) : null,
  })
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
  const checkin = ctx.checkins[0]
  const weightKg = Number(checkin.weight_kg)
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
      start_checkin_id: checkin.id,
    })
    .select('*')
    .single()
  if (phaseError) throw phaseError

  const bodyFatPct = checkinBodyFat(checkin, ctx)
  const { data: calRow, error: calError } = await supabase
    .from('diet_phase_calibrations')
    .insert({
      phase_id: (phaseRow as DietPhaseRow).id,
      user_id: userId,
      checkin_id: checkin.id,
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

/**
 * Recalibra a fase ativa com o check-in recém-gravado (FR-015): compara com o
 * check-in da última calibração, registra o resultado e, se mudou, atualiza
 * as metas-base. Sem fase, sem peso, sem perfil ou mesmo check-in → null.
 */
export async function recalibrateOnCheckin(
  userId: string,
  supabase: SupabaseClient,
  checkin: BodyCheckin,
  ctx: NutritionContext,
): Promise<DietCalibration | null> {
  const phase = ctx.phase
  const { heightCm, birthDate, sex } = ctx.profile
  if (!phase || checkin.weight_kg == null || heightCm == null || !birthDate || !sex) return null

  const fromId = ctx.lastCalibration?.checkinId
  if (!fromId || fromId === checkin.id) return null
  const { data: fromRow } = await supabase.from('body_checkins').select('*').eq('id', fromId).maybeSingle()
  const from = fromRow as BodyCheckin | null
  if (!from || from.weight_kg == null) return null

  const result = recalibrate({
    goal: phase.goal,
    current: phase.baseTargets,
    from: { weightKg: Number(from.weight_kg), waistCm: from.waist_cm != null ? Number(from.waist_cm) : null, at: from.created_at },
    to: {
      weightKg: Number(checkin.weight_kg),
      waistCm: checkin.waist_cm != null ? Number(checkin.waist_cm) : null,
      at: checkin.created_at,
      bodyFatPct: checkinBodyFat(checkin, ctx),
    },
    profile: { heightCm, age: ageOn(birthDate, ctx.today), sex, daysPerWeek: ctx.daysPerWeek },
  })

  const { data: calRow, error } = await supabase
    .from('diet_phase_calibrations')
    .insert({
      phase_id: phase.id,
      user_id: userId,
      checkin_id: checkin.id,
      action: result.action,
      before: phase.baseTargets,
      after: result.after,
      reason: result.reason,
      metrics: result.metrics,
    })
    .select('*')
    .single()
  if (error) throw error

  if (result.action !== 'intervalo-curto') {
    await supabase.from('diet_phases').update({ base_targets: result.after }).eq('id', phase.id)
  }
  return toCalibration(calRow as CalibrationRow)
}
