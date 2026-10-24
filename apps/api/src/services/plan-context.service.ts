import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorkoutSession } from '@helux/types'
import { isValidSession } from '@helux/workouts'

/**
 * Sessões do usuário a partir de uma data (YYYY-MM-DD), mais recentes
 * primeiro — base da progressão de carga entre mesociclos (spec 014, US3).
 * Em erro devolve [] para a geração seguir sem progressão. Spec 024: sessões
 * suspeitas (testes, sem séries) não confirmadas ficam de fora.
 */
export async function fetchSessionsSince(userId: string, supabase: SupabaseClient, sinceDate: string): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, date, duration_s, exercises, created_at, review_status')
    .eq('user_id', userId)
    .gte('date', sinceDate)
    .order('date', { ascending: false })
  if (error) return []
  return ((data ?? []) as (WorkoutSession & { duration_s?: number | null; review_status?: string | null })[]).filter(isValidSession)
}
