import type { SupabaseClient } from '@supabase/supabase-js'
import { compatibleAlternatives, enrichExercise, findBankExercise, validatePlanAgainstConstraints } from '@helux/ai'
import type { ExerciseAlternative, MesocycleSession, PlannedExercise, SessionEdit } from '@helux/types'
import { buildIntegratedProfile } from './integrated-profile.service'

export interface ExerciseEdit {
  exerciseId?: string
  sets?: number
  reps?: string
  load?: string
  confirmSafetyOverride?: boolean
}

export type EditResult =
  | { status: 'ok'; session: MesocycleSession }
  | { status: 'not-found' | 'session-completed' | 'not-editable' | 'not-an-alternative' }
  | { status: 'safety-warning'; reasons: string[] }

const isMain = (e: PlannedExercise) => e.phase !== 'aquecimento' && e.phase !== 'volta-calma'

async function locate(userId: string, supabase: SupabaseClient, sessionIndex: number, exerciseIndex: number) {
  const build = await buildIntegratedProfile(userId, supabase)
  const mesocycle = build.mesocycle
  const session = mesocycle?.sessions[sessionIndex]
  const exercise = session?.exercises[exerciseIndex]
  return { build, mesocycle, session, exercise }
}

/** Alternativas compatíveis (FR-009a): determinístico, sem IA. */
export async function listAlternatives(userId: string, supabase: SupabaseClient, sessionIndex: number, exerciseIndex: number): Promise<ExerciseAlternative[] | null> {
  const { build, exercise } = await locate(userId, supabase, sessionIndex, exerciseIndex)
  if (!exercise || !isMain(exercise)) return null
  return compatibleAlternatives(exercise.name, build.constraints)
}

/**
 * Edição manual de uma sessão pendente (FR-009a): troca por alternativa
 * compatível e/ou séries, reps e carga. Violação de restrição de segurança
 * pede confirmação; cada edição vira um sinal de preferência (FR-009b).
 */
export async function editExercise(userId: string, supabase: SupabaseClient, sessionIndex: number, exerciseIndex: number, edit: ExerciseEdit): Promise<EditResult> {
  const { build, mesocycle, session, exercise } = await locate(userId, supabase, sessionIndex, exerciseIndex)
  if (!mesocycle || !session || !exercise) return { status: 'not-found' }
  if (session.completedAt !== null) return { status: 'session-completed' }

  let next: PlannedExercise = { ...exercise }
  let reasons: string[] = []
  if (edit.exerciseId) {
    if (!isMain(exercise)) return { status: 'not-editable' }
    const alt = compatibleAlternatives(exercise.name, build.constraints).find(a => a.exerciseId === edit.exerciseId)
    if (!alt) return { status: 'not-an-alternative' }
    if (alt.violatesSafety) reasons = [alt.reason ?? 'viola uma restrição de segurança ativa']
    const { cues: _c, muscle: _m, muscles: _ms, tempo: _t, variants: _v, match: _mt, ...rest } = exercise
    next = enrichExercise({ ...rest, name: findBankExercise(alt.exerciseId)!.name })
  } else {
    // Mesmo sem troca, avisa se o exercício atual já fere uma restrição de segurança ativa.
    reasons = validatePlanAgainstConstraints([{ ...session, exercises: [exercise] }], { ...build.constraints, availableEquipment: [], exercisesToAvoid: [], maxSessionMinutes: null })
      .filter(v => v.rule === 'padrao-bloqueado' || v.rule === 'exercicio-bloqueado')
      .map(v => v.message)
  }
  if (edit.sets !== undefined) next.sets = edit.sets
  if (edit.reps !== undefined) next.reps = edit.reps
  if (edit.load !== undefined) next.weight = edit.load
  if (reasons.length > 0 && !edit.confirmSafetyOverride) return { status: 'safety-warning', reasons }

  const updated: MesocycleSession = { ...session, exercises: session.exercises.map((e, i) => (i === exerciseIndex ? next : e)) }
  const sessions = mesocycle.sessions.map((s, i) => (i === sessionIndex ? updated : s))
  const { error } = await supabase.from('mesocycle_plans').update({ sessions }).eq('id', mesocycle.id)
  if (error) throw error

  const swapped = next.name !== exercise.name
  const snapshot = (e: PlannedExercise): SessionEdit['before'] =>
    swapped ? { exercise: e.name, sets: e.sets, reps: e.reps, load: e.weight } : { sets: e.sets, reps: e.reps, load: e.weight }
  const { error: editError } = await supabase.from('session_edits').insert({
    user_id: userId,
    mesocycle_id: mesocycle.id,
    session_index: sessionIndex,
    exercise_index: exerciseIndex,
    kind: swapped ? 'troca-exercicio' : 'series-reps-carga',
    before: snapshot(exercise),
    after: snapshot(next),
    safety_override: reasons.length > 0,
  })
  if (editError) throw editError
  return { status: 'ok', session: updated }
}
