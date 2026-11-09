import type { SupabaseClient } from '@supabase/supabase-js'
import {
  CARDIO_BANK,
  type CardioZone,
  type ComplementaryCategory,
  type ComplementaryPreferences,
  type ComplementaryRoutineLog,
  type ComplementaryRoutineLogItem,
  type ComplementaryRoutinesView,
  type Goal,
  type HardConstraints,
  type HealthCondition,
  type Region,
} from '@helux/types'
import {
  completedComplementaryCategoriesToday,
  computeWeeklyRoutineProgress,
  constraintsFromConditions,
  prescribeComplementaryRoutines,
  type Level,
} from '@helux/workouts'
import { toGuidance, toPreferences, type GuidanceRow, type PreferencesRow } from './agent-rows'
import { listConditions } from './conditions.service'
import { findPendingSessionIndex, getActiveMesocycle } from './mesocycle.service'
import { todaySlug } from './tiredness.service'

const DEFAULT_RECENT_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

interface RoutineLogRow {
  id: string
  user_id: string
  category: ComplementaryCategory
  performed_on: string
  performed_at?: string
  duration_minutes: number
  modality: string | null
  zone?: CardioZone | null
  effort: number | null
  items: ComplementaryRoutineLogItem[] | null
  notes: string | null
  created_at: string
}

function toRoutineLog(row: RoutineLogRow): ComplementaryRoutineLog {
  return {
    id: row.id,
    category: row.category,
    performed_on: row.performed_on,
    performed_at: row.performed_at ?? row.created_at,
    duration_minutes: row.duration_minutes,
    modality: row.modality ?? null,
    zone: row.zone ?? null,
    effort: row.effort ?? null,
    items: Array.isArray(row.items) ? row.items : [],
    notes: row.notes ?? null,
  }
}

export async function listRoutineLogsSince(
  userId: string,
  sinceDate: string,
  supabase: SupabaseClient,
): Promise<ComplementaryRoutineLog[]> {
  const { data, error } = await supabase
    .from('complementary_routine_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_on', sinceDate)
    .order('performed_on', { ascending: false })
  if (error) throw error
  return ((data ?? []) as RoutineLogRow[]).map(toRoutineLog)
}

export class InvalidModalityError extends Error {
  constructor(message = 'Modalidade de cardio incompatível com suas condições ativas.') {
    super(message)
    this.name = 'InvalidModalityError'
  }
}

export async function getRoutinesView(
  userId: string,
  supabase: SupabaseClient,
  opts: { days?: number; now?: Date } = {},
): Promise<ComplementaryRoutinesView> {
  const now = opts.now ?? new Date()
  const days = Math.max(1, Math.min(365, opts.days ?? DEFAULT_RECENT_DAYS))
  const today = todaySlug(now)
  const since = new Date(now.getTime() - days * DAY_MS).toISOString().slice(0, 10)

  const [profileRes, prefsRes, guidanceRes, conditions, mesocycle, recentLogs] = await Promise.all([
    supabase.from('user_training_profile').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('training_preferences').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('shared_guidance').select('*').eq('user_id', userId),
    listConditions(userId, supabase).catch(() => [] as HealthCondition[]),
    getActiveMesocycle(userId, supabase).catch(() => null),
    listRoutineLogsSince(userId, since, supabase),
  ])
  if (profileRes.error) throw profileRes.error
  if (prefsRes.error) throw prefsRes.error
  if (guidanceRes.error) throw guidanceRes.error

  const profileRow = (profileRes.data ?? null) as Record<string, unknown> | null
  const trainingPrefs = toPreferences((prefsRes.data ?? null) as PreferencesRow | null)
  const safetyGuidance = ((guidanceRes.data ?? []) as GuidanceRow[])
    .map(toGuidance)
    .filter(g => g.status === 'ativa' && g.kind === 'restricao-seguranca')

  const fromConditions = constraintsFromConditions(conditions, now)
  const constraints: HardConstraints = {
    availableEquipment: trainingPrefs.availableEquipment,
    exercisesToAvoid: trainingPrefs.exercisesToAvoid,
    maxSessionMinutes: trainingPrefs.maxSessionMinutes,
    blockedPatterns: [...new Set([...safetyGuidance.flatMap(g => g.blockedPatterns), ...fromConditions.blockedPatterns])],
    blockedExercises: [...new Set([...safetyGuidance.flatMap(g => g.blockedExercises), ...fromConditions.blockedExercises])],
    maxJointStress: fromConditions.maxJointStress,
    maxCardioImpact: fromConditions.maxCardioImpact,
    minRir: fromConditions.minRir,
  }

  const activeConditions = conditions.filter(c => c.status !== 'resolvida')
  const conditionRegions: Region[] = [...new Set(activeConditions.map(c => c.region))]
  const flaredRegions: Region[] = [
    ...new Set(
      activeConditions
        .filter(c => c.flare && c.flare.until >= today)
        .map(c => c.flare!.region),
    ),
  ]

  const mesocycleGroups = mesocycle
    ? [
        ...new Set(
          mesocycle.sessions.flatMap(s =>
            s.exercises
              .filter(e => (e.phase ?? 'principal') === 'principal' && e.muscle)
              .map(e => e.muscle!.toLowerCase()),
          ),
        ),
      ]
    : []

  const pendingIdx = mesocycle ? findPendingSessionIndex(mesocycle.sessions) : -1
  const todayGymSession = pendingIdx >= 0 && mesocycle ? mesocycle.sessions[pendingIdx] : null

  const preferences = ((profileRow?.complementary_preferences as ComplementaryPreferences | null) ?? {})
  const goal = ((profileRow?.goal_primary as Goal | null) ?? (profileRow?.goal as Goal | null) ?? 'hipertrofia')
  const level = ((profileRow?.level as Level | null) ?? 'intermediario')

  const routines = prescribeComplementaryRoutines({
    goal,
    level,
    constraints,
    conditionRegions,
    flaredRegions,
    mesocycleGroups,
    preferences,
    cardioLikes: (profileRow?.cardio_likes as string[] | null) ?? [],
    cardioAvoid: (profileRow?.cardio_avoid as string[] | null) ?? [],
    todayGymSession,
  })

  const progress = computeWeeklyRoutineProgress(recentLogs, routines, today)
  const completedToday = completedComplementaryCategoriesToday(recentLogs, today)

  return {
    routines,
    progress,
    recentLogs,
    preferences,
    completedToday,
  }
}

export async function saveComplementaryPreferences(
  userId: string,
  preferences: ComplementaryPreferences,
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<ComplementaryRoutinesView> {
  // Se preferredModality foi enviado, valida contra CARDIO_BANK e restrições das condições ativas (contracts/api.md)
  const preferredModality = preferences.cardio?.preferredModality
  if (preferredModality) {
    const entry = CARDIO_BANK.find(c => c.id === preferredModality)
    if (!entry) throw new InvalidModalityError('Modalidade de cardio inexistente no catálogo.')
    const conditions = await listConditions(userId, supabase).catch(() => [] as HealthCondition[])
    const fromConditions = constraintsFromConditions(conditions, now)
    const maxImpact = fromConditions.maxCardioImpact ?? 2
    if (entry.impact > maxImpact) {
      throw new InvalidModalityError()
    }
    for (const joint of ['joelho', 'ombro', 'lombar'] as const) {
      const maxStress = fromConditions.maxJointStress[joint] ?? 2
      if (entry.stress[joint] > maxStress) {
        throw new InvalidModalityError()
      }
    }
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('user_training_profile')
    .select('complementary_preferences')
    .eq('user_id', userId)
    .maybeSingle()
  if (fetchErr) throw fetchErr

  const prev = ((existing as { complementary_preferences?: ComplementaryPreferences | null } | null)?.complementary_preferences ?? {})
  const merged: ComplementaryPreferences = {
    ...prev,
    ...preferences,
    ...(preferences['alongamento-mobilidade']
      ? { 'alongamento-mobilidade': { ...prev['alongamento-mobilidade'], ...preferences['alongamento-mobilidade'] } }
      : {}),
    ...(preferences['core-abdominal']
      ? { 'core-abdominal': { ...prev['core-abdominal'], ...preferences['core-abdominal'] } }
      : {}),
    ...(preferences.cardio
      ? { cardio: { ...prev.cardio, ...preferences.cardio } }
      : {}),
  }

  if (existing) {
    const { error } = await supabase
      .from('user_training_profile')
      .update({ complementary_preferences: merged, updated_at: now.toISOString() })
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('user_training_profile')
      .upsert({ user_id: userId, complementary_preferences: merged, updated_at: now.toISOString() }, { onConflict: 'user_id' })
    if (error) throw error
  }

  return getRoutinesView(userId, supabase, { now })
}

export interface CreateRoutineLogInput {
  category: ComplementaryCategory
  performed_on: string
  duration_minutes: number
  modality?: string | null
  zone?: CardioZone | null
  effort?: number | null
  items: ComplementaryRoutineLogItem[]
  notes?: string | null
}

export async function createRoutineLog(
  userId: string,
  input: CreateRoutineLogInput,
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<{ log: ComplementaryRoutineLog; view: ComplementaryRoutinesView }> {
  const { data, error } = await supabase
    .from('complementary_routine_logs')
    .insert({
      user_id: userId,
      category: input.category,
      performed_on: input.performed_on,
      performed_at: now.toISOString(),
      duration_minutes: input.duration_minutes,
      modality: input.modality ?? null,
      zone: input.zone ?? null,
      effort: input.effort ?? null,
      items: input.items,
      notes: input.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw error

  const log = toRoutineLog(data as RoutineLogRow)
  const view = await getRoutinesView(userId, supabase, { now })
  return { log, view }
}

export async function deleteRoutineLog(
  userId: string,
  logId: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data: existing, error: findErr } = await supabase
    .from('complementary_routine_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('id', logId)
    .maybeSingle()
  if (findErr) throw findErr
  if (!existing) return false

  const { error } = await supabase
    .from('complementary_routine_logs')
    .delete()
    .eq('user_id', userId)
    .eq('id', logId)
  if (error) throw error
  return true
}
