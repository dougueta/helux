import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorkoutSession } from '@helux/types'

/**
 * Sessões do usuário a partir de uma data (YYYY-MM-DD), mais recentes
 * primeiro — base da progressão de carga entre mesociclos (spec 014, US3).
 * Em erro devolve [] para a geração seguir sem progressão.
 */
export async function fetchSessionsSince(userId: string, supabase: SupabaseClient, sinceDate: string): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, date, duration_s, exercises, created_at')
    .eq('user_id', userId)
    .gte('date', sinceDate)
    .order('date', { ascending: false })
  if (error) return []
  return (data ?? []) as WorkoutSession[]
}
