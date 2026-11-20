import type { SupabaseClient } from '@supabase/supabase-js'
import type { BodyWeight, ExerciseSet, TrainingCalendarMonthView } from '@helux/types'
import {
  buildCalendarGridBounds,
  buildTrainingCalendarMonth,
  type CalendarRawGymSession,
  type CalendarRawRoutineLog,
} from '@helux/workouts'
import { localToday } from './local-date'

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

export function isValidMonthParam(month: string): boolean {
  return MONTH_RE.test(month)
}

interface SessionRow {
  id: string
  date: string
  duration_s?: number | null
  exercises?: ExerciseSet[] | null
  session_checkins?: Array<{ phase: 'antes' | 'depois'; rpe: number | null }> | null
}

interface CheckinRow {
  session_id?: string | null
  phase: 'antes' | 'depois'
  rpe: number | null
}

export async function getTrainingCalendarMonthView(
  supabase: SupabaseClient,
  userId: string,
  month?: string,
  now: Date = new Date(),
): Promise<
  | { ok: true; view: TrainingCalendarMonthView }
  | { ok: false; error: 'invalid-month' | 'future-month' }
> {
  const today = localToday(now)
  const currentMonth = today.slice(0, 7)
  const targetMonth = month ?? currentMonth

  if (!isValidMonthParam(targetMonth)) {
    return { ok: false, error: 'invalid-month' }
  }
  if (targetMonth > currentMonth) {
    return { ok: false, error: 'future-month' }
  }

  const bounds = buildCalendarGridBounds(targetMonth)

  const [sessionsRes, checkinsRes, routinesRes, weightsRes, profileRes, prefsRes] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('id, date, duration_s, exercises, session_checkins(phase, rpe)')
      .eq('user_id', userId)
      .lte('date', bounds.lastSunday)
      .order('date', { ascending: true }),
    supabase
      .from('session_checkins')
      .select('session_id, phase, rpe')
      .eq('user_id', userId)
      .eq('phase', 'depois'),
    supabase
      .from('complementary_routine_logs')
      .select('id, category, performed_on, duration_minutes, modality, effort')
      .eq('user_id', userId)
      .gte('performed_on', bounds.previousWeekMonday)
      .lte('performed_on', bounds.lastSunday)
      .order('performed_on', { ascending: true }),
    supabase
      .from('body_weights')
      .select('id, date, weight_kg')
      .eq('user_id', userId)
      .gte('date', bounds.previousWeekMonday)
      .lte('date', bounds.lastSunday)
      .order('date', { ascending: true }),
    supabase
      .from('user_training_profile')
      .select('days_per_week')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('training_preferences')
      .select('available_days')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const rpeBySessionId = new Map<string, number>()
  for (const chk of (checkinsRes.data ?? []) as CheckinRow[]) {
    if (chk.session_id && typeof chk.rpe === 'number') {
      rpeBySessionId.set(chk.session_id, chk.rpe)
    }
  }

  const sessions: CalendarRawGymSession[] = ((sessionsRes.data ?? []) as SessionRow[]).map(row => {
    const embeddedDepois = row.session_checkins?.find(c => c.phase === 'depois')?.rpe ?? null
    const rpe = embeddedDepois ?? rpeBySessionId.get(row.id) ?? null
    return {
      id: row.id,
      date: String(row.date).slice(0, 10),
      duration_s: row.duration_s ?? null,
      exercises: (row.exercises ?? []) as ExerciseSet[],
      rpe,
    }
  })

  const routineLogs: CalendarRawRoutineLog[] = ((routinesRes.data ?? []) as any[]).map(r => ({
    id: String(r.id),
    category: r.category,
    performed_on: String(r.performed_on).slice(0, 10),
    duration_minutes: Number(r.duration_minutes) || 0,
    modality: r.modality ?? null,
    effort: typeof r.effort === 'number' ? r.effort : null,
  }))

  const weights: BodyWeight[] = ((weightsRes.data ?? []) as any[]).map(w => ({
    id: String(w.id),
    date: String(w.date).slice(0, 10),
    weight_kg: Number(w.weight_kg),
  }))

  const profileDays = (profileRes.data as { days_per_week?: number } | null)?.days_per_week
  const prefDays = (prefsRes.data as { available_days?: number[] } | null)?.available_days?.length
  const targetGymDays = profileDays ?? prefDays ?? 4

  const view = buildTrainingCalendarMonth({
    month: targetMonth,
    today,
    sessions,
    routineLogs,
    weights,
    targetGymDays,
  })

  return { ok: true, view }
}
