import type { ExercisePhase, PlannedExercise } from '@helux/types'

// Spec 014 — estrutura da sessão: fases (aquecimento/principal/volta à calma)
// e biset. Módulo puro compartilhado por API (normaliza antes de gravar) e web
// (exibe e conduz o treino ativo). Planos antigos não têm esses campos.

export const EXERCISE_PHASES: readonly ExercisePhase[] = ['aquecimento', 'principal', 'volta-calma']

export const PHASE_LABELS: Record<ExercisePhase, string> = {
  aquecimento: 'Aquecimento',
  principal: 'Treino principal',
  'volta-calma': 'Volta à calma',
}

/** Fase efetiva do item: ausente ou desconhecida = principal. */
export function exercisePhase(exercise: PlannedExercise): ExercisePhase {
  return EXERCISE_PHASES.includes(exercise.phase as ExercisePhase) ? (exercise.phase as ExercisePhase) : 'principal'
}

export function isMainExercise(exercise: PlannedExercise): boolean {
  return exercisePhase(exercise) === 'principal'
}

export interface PhaseGroup {
  phase: ExercisePhase
  items: { exercise: PlannedExercise; index: number }[]
}

/** Agrupa por fase (na ordem canônica), preservando o índice original de cada item. Fases vazias são omitidas. */
export function groupByPhase(exercises: PlannedExercise[]): PhaseGroup[] {
  return EXERCISE_PHASES.map((phase) => ({
    phase,
    items: exercises
      .map((exercise, index) => ({ exercise, index }))
      .filter(({ exercise }) => exercisePhase(exercise) === phase),
  })).filter((g) => g.items.length > 0)
}

function withoutSuperset(exercise: PlannedExercise): PlannedExercise {
  const { supersetGroup: _dropped, ...rest } = exercise
  return rest
}

/**
 * Normaliza a sessão gerada pela IA antes de gravar (FR-003, FR-009):
 * fase explícita em todo item (desconhecida → principal), ordem estável
 * aquecimento → principal → volta-calma e biset só quando exatamente dois
 * itens consecutivos do principal compartilham o rótulo.
 */
export function normalizeSessionExercises(exercises: PlannedExercise[]): PlannedExercise[] {
  const ordered = EXERCISE_PHASES.flatMap((phase) =>
    exercises.filter((e) => exercisePhase(e) === phase).map((e) => ({ ...e, phase })),
  )

  return ordered.map((exercise, i) => {
    if (exercise.supersetGroup === undefined) return exercise
    return isValidSupersetAt(ordered, i) ? exercise : withoutSuperset(exercise)
  })
}

function isValidSupersetAt(exercises: PlannedExercise[], index: number): boolean {
  const group = exercises[index]?.supersetGroup
  if (!group) return false
  const members = exercises
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.supersetGroup === group)
  if (members.length !== 2) return false
  const [a, b] = members
  return b.i === a.i + 1 && isMainExercise(a.e) && isMainExercise(b.e)
}

/** Índice do parceiro de biset do item, ou null (exercício comum ou grupo inválido). */
export function supersetPartnerIndex(exercises: PlannedExercise[], index: number): number | null {
  if (!isValidSupersetAt(exercises, index)) return null
  const group = exercises[index].supersetGroup
  if (exercises[index - 1]?.supersetGroup === group) return index - 1
  return index + 1
}
