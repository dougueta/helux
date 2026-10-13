import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { BodyCheckin, DietPhase, DietTargets, NutriMarker, Sex, TirednessLevel } from '@helux/types'
import { parseGeneraNutrition } from '@helux/genetics'
import { classifyMarkers, nutritionFlags, type NutritionFlags } from '@helux/nutrition'
import { getTodayTirednessAssessment, todaySlug } from './tiredness.service'
import { getActiveMesocycle } from './mesocycle.service'

const GENERA_PATH = path.resolve(process.cwd(), 'data', 'genetics', 'genera.json')

export type MissingField = 'heightCm' | 'birthDate' | 'sex' | 'checkinWeight'

export interface DietPhaseRow {
  id: string
  user_id: string
  goal: DietPhase['goal']
  started_on: string
  duration_weeks: number
  status: DietPhase['status']
  base_targets: DietTargets
  start_checkin_id: string | null
  created_at: string
}

export interface NutritionContext {
  today: string
  profile: { heightCm: number | null; birthDate: string | null; sex: Sex | null }
  /** Mais recentes primeiro (no máximo 2). */
  checkins: BodyCheckin[]
  phase: DietPhase | null
  /** Última calibração efetiva (ignora `intervalo-curto`): base da próxima recalibração. */
  lastCalibration: { checkinId: string | null; createdAt: string } | null
  tiredness: TirednessLevel | null
  daysPerWeek: number | null
  workoutToday: { finishedAt: string } | null
  genetics: { active: boolean; markers: NutriMarker[]; flags: NutritionFlags }
  missing: MissingField[]
}

export function toDietPhase(row: DietPhaseRow): DietPhase {
  return {
    id: row.id,
    goal: row.goal,
    startedOn: row.started_on,
    durationWeeks: row.duration_weeks,
    status: row.status,
    baseTargets: row.base_targets,
  }
}

/** Marcadores e flags de nutrição do `genera.json` (sem arquivo → personalização inativa). */
export function loadNutritionGenetics(): NutritionContext['genetics'] {
  if (!existsSync(GENERA_PATH)) return { active: false, markers: [], flags: nutritionFlags([]) }
  const markers = classifyMarkers(parseGeneraNutrition(JSON.parse(readFileSync(GENERA_PATH, 'utf-8'))))
  return { active: true, markers, flags: nutritionFlags(markers) }
}

/**
 * Tudo o que o módulo de nutrição precisa para calcular fase e dia (spec 018):
 * perfil, check-ins, fase ativa, cansaço (011), frequência do mesociclo,
 * treino salvo hoje e genética.
 */
export async function loadNutritionContext(userId: string, supabase: SupabaseClient, now: Date = new Date()): Promise<NutritionContext> {
  const today = todaySlug(now)

  const [profileRes, checkinsRes, phaseRes, workoutRes, tiredness, mesocycle] = await Promise.all([
    supabase.from('user_training_profile').select('height_cm, birth_date, sex').eq('user_id', userId).maybeSingle(),
    supabase.from('body_checkins').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(2),
    supabase.from('diet_phases').select('*').eq('user_id', userId).eq('status', 'ativa').maybeSingle(),
    supabase.from('workout_sessions').select('created_at').eq('user_id', userId).eq('date', today).order('created_at', { ascending: false }).limit(1),
    getTodayTirednessAssessment(userId, supabase, now).then(a => a.effectiveLevel, () => null),
    getActiveMesocycle(userId, supabase).catch(() => null),
  ])

  const p = profileRes.data as { height_cm: number | null; birth_date: string | null; sex: Sex | null } | null
  const profile = {
    heightCm: p?.height_cm != null ? Number(p.height_cm) : null,
    birthDate: p?.birth_date ?? null,
    sex: p?.sex ?? null,
  }
  const checkins = (checkinsRes.data ?? []) as BodyCheckin[]
  const phaseRow = phaseRes.data as DietPhaseRow | null

  let lastCalibration: NutritionContext['lastCalibration'] = null
  if (phaseRow) {
    const { data } = await supabase
      .from('diet_phase_calibrations')
      .select('checkin_id, created_at, action')
      .eq('phase_id', phaseRow.id)
      .order('created_at', { ascending: false })
      .limit(20)
    // Base da próxima comparação: a última calibração efetiva (intervalo curto não conta).
    const last = ((data ?? []) as { checkin_id: string | null; created_at: string; action: string }[]).find(c => c.action !== 'intervalo-curto')
    if (last) lastCalibration = { checkinId: last.checkin_id, createdAt: last.created_at }
  }

  const lastWorkout = ((workoutRes.data ?? []) as { created_at: string }[])[0]

  const missing: MissingField[] = []
  if (profile.heightCm == null) missing.push('heightCm')
  if (!profile.birthDate) missing.push('birthDate')
  if (!profile.sex) missing.push('sex')
  if (checkins[0]?.weight_kg == null) missing.push('checkinWeight')

  return {
    today,
    profile,
    checkins,
    phase: phaseRow ? toDietPhase(phaseRow) : null,
    lastCalibration,
    tiredness: tiredness ?? null,
    daysPerWeek: mesocycle?.days_per_week ?? null,
    workoutToday: lastWorkout ? { finishedAt: lastWorkout.created_at } : null,
    genetics: loadNutritionGenetics(),
    missing,
  }
}
