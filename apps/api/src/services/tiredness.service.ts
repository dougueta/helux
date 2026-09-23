import type { SupabaseClient } from '@supabase/supabase-js'
import type { TirednessAssessment, TirednessLevel } from '@helux/types'
import { assessTiredness } from '@helux/workouts'
import { computeRecoveryFromSamples, type HealthSample } from './recovery.service'

const RECOVERY_WINDOW_MS = 48 * 60 * 60 * 1000

export function todaySlug(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/**
 * Avaliação de cansaço do dia (spec 011): nível manual salvo + nível derivado
 * do HRV das últimas 48 h. Ponto único de leitura, reaproveitável (spec 015).
 */
export async function getTodayTirednessAssessment(
  userId: string,
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<TirednessAssessment> {
  const date = todaySlug(now)
  const since = new Date(now.getTime() - RECOVERY_WINDOW_MS).toISOString()

  const [{ data: samples, error: samplesError }, { data: signal, error: signalError }] = await Promise.all([
    supabase
      .from('health_samples')
      .select('type, value, unit, start_at')
      .eq('user_id', userId)
      .gte('start_at', since)
      .order('start_at', { ascending: false }),
    supabase
      .from('daily_tiredness_signals')
      .select('level, override_automatic')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle(),
  ])

  if (samplesError) throw samplesError
  if (signalError) throw signalError

  const hrv =
    samples && samples.length > 0 ? computeRecoveryFromSamples(samples as HealthSample[]).hrv ?? null : null
  const row = signal as { level: TirednessLevel; override_automatic: boolean } | null

  return assessTiredness({
    date,
    manualLevel: row?.level ?? null,
    overrideAutomatic: row?.override_automatic ?? false,
    hrv,
  })
}
