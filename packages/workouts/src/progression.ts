import type { ExerciseSet, LoadProgression, PlannedExercise, WorkoutSession } from '@helux/types'
import { isMainExercise } from './plan-structure'

// Spec 014 (US3) — progressão de carga entre mesociclos por regra
// determinística (research R6/R7; FR-015 a FR-019).

export type EffortLevel = 'facil' | 'moderado' | 'dificil' | 'limite'
export type UserLevel = 'iniciante' | 'intermediario' | 'avancado'

export const EFFORT_LEVELS: readonly EffortLevel[] = ['facil', 'moderado', 'dificil', 'limite']

/** Valor gravado em `effort` (1–10) de cada série; sem relato o histórico grava 8. */
export const EFFORT_VALUE: Record<EffortLevel, number> = { facil: 6, moderado: 7, dificil: 9, limite: 10 }

export type EffortBand = 'facil' | 'moderado' | 'dificil'

/** ≤ 6 fácil, 7–8 moderado, ≥ 9 difícil/no limite. */
export function effortBand(effort: number): EffortBand {
  if (effort <= 6) return 'facil'
  if (effort <= 8) return 'moderado'
  return 'dificil'
}

/** "8-10" / "8–10" / "12" → faixa; texto livre ("5 min", "até a falha") → null. */
export function parseRepRange(reps: string): { min: number; max: number } | null {
  const range = /^\s*(\d+)\s*[-–]\s*(\d+)\s*$/.exec(reps)
  if (range) return { min: Number(range[1]), max: Number(range[2]) }
  const single = /^\s*(\d+)\s*$/.exec(reps)
  if (single) return { min: Number(single[1]), max: Number(single[1]) }
  return null
}

/** "60kg" / "22,5 kg" → número; sem carga numérica → null. */
export function parseKg(weight: string): number | null {
  const match = /(\d+(?:[.,]\d+)?)\s*kg/i.exec(weight)
  return match ? Number(match[1].replace(',', '.')) : null
}

/** Menor incremento realista: 1 kg abaixo de 20 kg, 2 kg abaixo de 60 kg, 2,5 kg a partir daí. */
export function loadIncrement(kg: number): number {
  if (kg < 20) return 1
  if (kg < 60) return 2
  return 2.5
}

const BASE_PCT: Record<'facil' | 'moderado', number> = { facil: 0.05, moderado: 0.025 }
const LEVEL_MULT: Record<UserLevel, number> = { iniciante: 1.5, intermediario: 1, avancado: 0.5 }
const EFFORT_LABEL: Record<EffortBand, string> = { facil: 'fácil', moderado: 'moderado', dificil: 'difícil' }

const tidy = (kg: number) => Math.round(kg * 100) / 100
const fmt = (kg: number) => String(tidy(kg)).replace('.', ',')

/** Aumento: carga × base × nível, no incremento, mínimo 1 incremento, teto de 10% (se 1 incremento já passa, aplica 1). */
function increaseDelta(kg: number, band: 'facil' | 'moderado', level: UserLevel): number {
  const inc = loadIncrement(kg)
  const raw = Math.round((kg * BASE_PCT[band] * LEVEL_MULT[level]) / inc) * inc
  const cap = Math.floor((kg * 0.1) / inc) * inc
  return Math.max(inc, Math.min(raw, cap))
}

/** Redução: 10% no incremento, mínimo 1 incremento. */
function decreaseDelta(kg: number): number {
  const inc = loadIncrement(kg)
  return Math.max(inc, Math.round((kg * 0.1) / inc) * inc)
}

export interface ProgressionExerciseInput {
  name: string
  prescribedSets: number
  prescribedReps: string
  performed: ExerciseSet | null
  userLevel: UserLevel
}

function noData(name: string, reason: string): LoadProgression {
  return { name, action: 'sem-dados', previousWeightKg: null, nextWeightKg: null, reason }
}

/** Decisão de carga de um exercício (FR-016, FR-017). */
export function decideProgression(input: ProgressionExerciseInput): LoadProgression {
  const { name, prescribedSets, prescribedReps, performed, userLevel } = input
  if (!performed || performed.sets.length === 0) return noData(name, 'Não executado no mesociclo anterior.')
  if (performed.skipped) return noData(name, 'Pulado no mesociclo anterior.')
  if (performed.executedVariant) return noData(name, 'Executado com outra variante.')
  const range = parseRepRange(prescribedReps)
  if (!range) return noData(name, 'Faixa de repetições não numérica.')
  const top = Math.max(...performed.sets.map((s) => s.weight))
  if (!(top > 0)) return noData(name, 'Sem carga registrada.')

  const atTop = performed.sets.filter((s) => s.weight === top)
  const repsAtTop = Math.min(...atTop.map((s) => s.reps))
  const complete = performed.sets.length >= prescribedSets
  const band = effortBand(Math.max(...performed.sets.map((s) => s.effort)))
  const effort = EFFORT_LABEL[band]

  const decide = (action: LoadProgression['action'], next: number, reason: string): LoadProgression => ({
    name,
    action,
    previousWeightKg: tidy(top),
    nextWeightKg: tidy(Math.max(0, next)),
    reason,
  })

  if (complete && repsAtTop >= range.max) {
    if (band === 'dificil') return decide('manter', top, `Topo da faixa (${range.max} reps), mas com esforço ${effort}: mantém ${fmt(top)} kg.`)
    const delta = increaseDelta(top, band, userLevel)
    return decide('aumentar', top + delta, `Topo da faixa (${range.max} reps) em todas as séries com esforço ${effort}: +${fmt(delta)} kg.`)
  }
  if (complete && repsAtTop >= range.min) {
    if (band === 'facil') {
      const inc = loadIncrement(top)
      return decide('aumentar', top + inc, `Dentro da faixa com esforço fácil: +${fmt(inc)} kg.`)
    }
    return decide('manter', top, `Dentro da faixa (${repsAtTop} de ${range.max} reps): mantém ${fmt(top)} kg até chegar ao topo.`)
  }
  if (band === 'dificil') {
    const delta = decreaseDelta(top)
    const why = complete ? `abaixo da faixa (${repsAtTop} reps)` : `séries incompletas (${performed.sets.length} de ${prescribedSets})`
    return decide('reduzir', top - delta, `${why[0].toUpperCase()}${why.slice(1)} com esforço ${effort}: −${fmt(delta)} kg.`)
  }
  const why = complete ? `Abaixo da faixa (${repsAtTop} reps)` : `Séries incompletas (${performed.sets.length} de ${prescribedSets})`
  return decide('manter', top, `${why}, sem esforço alto: mantém ${fmt(top)} kg.`)
}

export interface MesocycleProgressionInput {
  previousSessions: Array<{ exercises: PlannedExercise[] }>
  history: WorkoutSession[]
  userLevel: UserLevel
}

/**
 * Uma decisão por exercício do principal do mesociclo anterior (FR-015),
 * a partir da execução mais recente no histórico.
 */
export function computeMesocycleProgression({ previousSessions, history, userLevel }: MesocycleProgressionInput): LoadProgression[] {
  const newestFirst = [...history].sort((a, b) => b.date.localeCompare(a.date))
  const seen = new Set<string>()
  const decisions: LoadProgression[] = []
  for (const session of previousSessions) {
    for (const exercise of session.exercises) {
      if (!isMainExercise(exercise) || seen.has(exercise.name)) continue
      seen.add(exercise.name)
      let performed: ExerciseSet | null = null
      for (const past of newestFirst) {
        performed = past.exercises.find((e) => e.name === exercise.name) ?? null
        if (performed) break
      }
      decisions.push(
        decideProgression({
          name: exercise.name,
          prescribedSets: exercise.sets,
          prescribedReps: String(exercise.reps),
          performed,
          userLevel,
        }),
      )
    }
  }
  return decisions
}

/**
 * Aplica as cargas decididas no novo mesociclo (FR-018/FR-019): só no
 * principal, só decisões com carga nova; grava a decisão em `progression`.
 */
export function applyProgression<S extends { exercises: PlannedExercise[] }>(sessions: S[], decisions: LoadProgression[]): S[] {
  const byName = new Map(decisions.filter((d) => d.action !== 'sem-dados' && d.nextWeightKg !== null).map((d) => [d.name, d]))
  if (byName.size === 0) return sessions
  return sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((exercise) => {
      const decision = isMainExercise(exercise) ? byName.get(exercise.name) : undefined
      if (!decision) return exercise
      const { name: _name, ...progression } = decision
      return { ...exercise, weight: `${decision.nextWeightKg}kg`, progression }
    }),
  }))
}
