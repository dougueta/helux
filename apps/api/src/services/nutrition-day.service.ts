import type { SupabaseClient } from '@supabase/supabase-js'
import type { DayPlan, DayType, DietPhase, DietTargets, MealSwap, TirednessLevel } from '@helux/types'
import { buildDayPlan } from '@helux/nutrition'
import type { MissingField, NutritionContext } from './nutrition-context.service'

// Spec 018 (US1) — o plano do dia: recalculado a cada leitura e gravado por upsert (R12).

interface DayRow {
  day_type_override: 'descanso' | null
  swaps: MealSwap[] | null
}

export type TodayResult =
  | { status: 'no-phase' | 'needs-profile'; missing: MissingField[] }
  | {
      status: 'ok'
      missing: MissingField[]
      plan: DayPlan
      phase: DietPhase
      tiredness: TirednessLevel | null
      dayTypeOverride: 'descanso' | null
      workoutToday: { finishedAt: string } | null
    }

/** Tipo do dia (R5): treino salvo hoje força treino; senão o override do usuário; sem mesociclo, descanso. */
export function resolveDayType(ctx: Pick<NutritionContext, 'workoutToday' | 'daysPerWeek'>, override: 'descanso' | null): DayType {
  if (ctx.workoutToday) return 'treino'
  if (override === 'descanso') return 'descanso'
  return ctx.daysPerWeek == null ? 'descanso' : 'treino'
}

/**
 * Calcula e grava o plano de hoje. `changes` permite mudar o override ou as
 * trocas antes de calcular (PUT / troca rápida).
 */
export async function computeToday(
  userId: string,
  supabase: SupabaseClient,
  ctx: NutritionContext,
  changes: { override?: 'descanso' | null; swaps?: MealSwap[] } = {},
): Promise<TodayResult> {
  if (!ctx.phase) return { status: 'no-phase', missing: ctx.missing }
  const weight = ctx.checkins[0]?.weight_kg
  if (weight == null) return { status: 'needs-profile', missing: ctx.missing }

  const { data } = await supabase
    .from('daily_nutrition_plans')
    .select('day_type_override, swaps')
    .eq('user_id', userId)
    .eq('date', ctx.today)
    .maybeSingle()
  const row = data as DayRow | null
  const override = changes.override !== undefined ? changes.override : (row?.day_type_override ?? null)
  const swaps = changes.swaps ?? row?.swaps ?? []
  const dayType = resolveDayType(ctx, override)

  const plan = buildDayPlan({
    date: ctx.today,
    dayType,
    base: ctx.phase.baseTargets,
    weightKg: Number(weight),
    flags: ctx.genetics.flags,
    geneticsActive: ctx.genetics.active,
    tiredness: ctx.tiredness,
    swaps,
  })

  const { error } = await supabase.from('daily_nutrition_plans').upsert(
    {
      user_id: userId,
      date: ctx.today,
      phase_id: ctx.phase.id,
      day_type: dayType,
      day_type_override: override,
      tiredness_level: ctx.tiredness,
      plan,
      swaps,
      status: 'ativo',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' },
  )
  if (error) throw error

  return {
    status: 'ok',
    missing: ctx.missing,
    plan,
    phase: ctx.phase,
    tiredness: ctx.tiredness,
    dayTypeOverride: override,
    workoutToday: ctx.workoutToday,
  }
}

export interface HistoryDay {
  date: string
  dayType: DayType
  status: 'ativo' | 'treino-nao-realizado' | 'concluido'
  targets: DietTargets
}

/** Histórico do plano do dia; dia passado de treino sem sessão salva → treino não realizado (R12). */
export async function nutritionHistory(userId: string, supabase: SupabaseClient, today: string, limit: number): Promise<HistoryDay[]> {
  const { data, error } = await supabase
    .from('daily_nutrition_plans')
    .select('date, day_type, plan')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  const rows = (data ?? []) as { date: string; day_type: DayType; plan: { targets: DietTargets } }[]
  if (rows.length === 0) return []

  const oldest = rows[rows.length - 1].date
  const { data: sessions } = await supabase.from('workout_sessions').select('date').eq('user_id', userId).gte('date', oldest)
  const trained = new Set(((sessions ?? []) as { date: string }[]).map(s => s.date))

  return rows.map(r => ({
    date: r.date,
    dayType: r.day_type,
    status: r.date >= today ? 'ativo' : r.day_type === 'treino' && !trained.has(r.date) ? 'treino-nao-realizado' : 'concluido',
    targets: r.plan.targets,
  }))
}
