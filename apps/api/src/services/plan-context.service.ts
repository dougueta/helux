import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { parseGeneraJson } from '@helux/genetics'
import type { PlanInput, WorkoutSession, BodyCheckin } from '@helux/types'
import { computeRecoveryFromSamples, type HealthSample } from './recovery.service'

const GENERA_PATH = path.resolve(process.cwd(), 'data', 'genetics', 'genera.json')

const DEFAULT_CONSTRAINTS: PlanInput['constraints'] = {
  maxWeeklyFrequency: 4,
  preferredVolume: 'medio',
  restBetweenSets: '90-120s',
  forbiddenExerciseTypes: [],
  cardioIntensityLimit: 'moderado',
}

/**
 * Assembles the same PlanInput the web client builds when the user manually
 * clicks "Gerar Novo Plano" — used to trigger generation server-side (e.g.
 * automatically after a workout session finishes).
 */
export async function gatherPlanInput(userId: string, token: string): Promise<PlanInput | null> {
  if (!existsSync(GENERA_PATH)) return null
  const raw: unknown = JSON.parse(readFileSync(GENERA_PATH, 'utf-8'))
  const geneticProfile = parseGeneraJson(raw)

  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const [samplesRes, historyRes, checkinsRes, profileRes] = await Promise.all([
    supabase
      .from('health_samples')
      .select('type, value, unit, start_at')
      .eq('user_id', userId)
      .gte('start_at', since)
      .order('start_at', { ascending: false }),
    supabase
      .from('workout_sessions')
      .select('id, date, duration_s, exercises, created_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(0, 4),
    supabase
      .from('body_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .range(0, 1),
    supabase
      .from('user_training_profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const samples = (samplesRes.data ?? []) as HealthSample[]
  const recoveryData = samples.length > 0 ? [computeRecoveryFromSamples(samples)] : []
  const workoutHistory = (historyRes.data ?? []) as WorkoutSession[]
  const bodyCheckins = ((checkinsRes.data ?? []) as BodyCheckin[])
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))

  const profile = profileRes.data as {
    goal: string | null
    level: 'iniciante' | 'intermediario' | 'avancado' | null
    training_time: string | null
    time_off: string | null
    current_injury: string | null
  } | null

  return {
    geneticProfile,
    constraints: DEFAULT_CONSTRAINTS,
    workoutHistory,
    recoveryData,
    userGoals: profile?.goal ?? 'Hipertrofia e condicionamento geral',
    userLevel: profile?.level ?? 'intermediario',
    availableDaysPerWeek: 4,
    bodyCheckins,
    trainingTime: profile?.training_time ?? undefined,
    timeOff: profile?.time_off ?? undefined,
    currentInjury: profile?.current_injury ?? undefined,
  }
}
