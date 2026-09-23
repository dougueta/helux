import type {
  AdjustedSession,
  ExerciseAdjustmentChange,
  PlannedExercise,
  TirednessAssessment,
  TirednessLevel,
} from '@helux/types'

// Spec 011 — cansaço percebido com níveis. Módulo puro compartilhado por API
// (monta o treino do dia) e web (prévia do que muda antes de salvar).

export const TIREDNESS_LEVELS: readonly TirednessLevel[] = ['otimo', 'normal', 'cansado', 'exausto']

export const TIREDNESS_LABELS: Record<TirednessLevel, string> = {
  otimo: 'ótimo',
  normal: 'normal',
  cansado: 'cansado',
  exausto: 'exausto',
}

export type TirednessTier = 'none' | 'moderate' | 'high'

const MIN_SETS = 2
const HIGH_LOAD_FACTOR = 0.9
const KG_PATTERN = /^\s*(\d+(?:[.,]\d+)?)\s*kg\s*$/i

export function hrvToTirednessLevel(hrv: number): TirednessLevel {
  if (hrv >= 60) return 'normal'
  if (hrv >= 40) return 'cansado'
  return 'exausto'
}

export function tirednessTier(level: TirednessLevel | null): TirednessTier {
  if (level === 'cansado') return 'moderate'
  if (level === 'exausto') return 'high'
  return 'none'
}

export interface AssessTirednessInput {
  date: string
  manualLevel: TirednessLevel | null
  overrideAutomatic: boolean
  hrv: number | null
}

export function assessTiredness({ date, manualLevel, overrideAutomatic, hrv }: AssessTirednessInput): TirednessAssessment {
  const automaticLevel = hrv === null ? null : hrvToTirednessLevel(hrv)
  const conflict =
    manualLevel !== null && automaticLevel !== null && tirednessTier(manualLevel) !== tirednessTier(automaticLevel)

  let effectiveLevel: TirednessLevel | null
  let source: TirednessAssessment['source']
  if (automaticLevel === null) {
    effectiveLevel = manualLevel
    source = manualLevel === null ? 'none' : 'manual'
  } else if (manualLevel !== null && overrideAutomatic) {
    effectiveLevel = manualLevel
    source = 'manual'
  } else {
    effectiveLevel = automaticLevel
    source = 'automatic'
  }

  return {
    date,
    manualLevel,
    overrideAutomatic,
    automaticLevel,
    automaticHrv: hrv,
    effectiveLevel,
    source,
    conflict,
  }
}

function reduceWeight(weight: string): string {
  const match = KG_PATTERN.exec(weight)
  if (!match) return weight
  const value = Number(match[1].replace(',', '.'))
  const reduced = Math.round(value * HIGH_LOAD_FACTOR * 2) / 2
  return `${reduced}kg`
}

export function adjustExercisesForLevel(exercises: PlannedExercise[], level: TirednessLevel | null): PlannedExercise[] {
  const tier = tirednessTier(level)
  if (tier === 'none') return exercises
  return exercises.map((exercise) => {
    const sets = Math.max(MIN_SETS, exercise.sets - 1)
    const weight = tier === 'high' ? reduceWeight(exercise.weight) : exercise.weight
    if (sets === exercise.sets && weight === exercise.weight) return exercise
    return { ...exercise, sets, weight }
  })
}

export function diffExercises(before: PlannedExercise[], after: PlannedExercise[]): ExerciseAdjustmentChange[] {
  const changes: ExerciseAdjustmentChange[] = []
  before.forEach((b, i) => {
    const a = after[i]
    if (!a) return
    if (a.sets !== b.sets || a.weight !== b.weight) {
      changes.push({ name: b.name, setsBefore: b.sets, setsAfter: a.sets, weightBefore: b.weight, weightAfter: a.weight })
    }
  })
  return changes
}

export function tirednessAdjustmentReason(assessment: TirednessAssessment): string | undefined {
  const { effectiveLevel, source, automaticLevel, automaticHrv, overrideAutomatic } = assessment
  if (effectiveLevel === null || source === 'none') return undefined
  if (source === 'automatic') {
    return `Relógio indica "${TIREDNESS_LABELS[effectiveLevel]}" (HRV ${automaticHrv} ms)`
  }
  const base = `Você marcou "${TIREDNESS_LABELS[effectiveLevel]}" hoje`
  if (overrideAutomatic && automaticLevel !== null) {
    return `${base} — relógio indicava "${TIREDNESS_LABELS[automaticLevel]}"`
  }
  return base
}

export function buildAdjustedSession(
  session: { letter: string; focus: string; exercises: PlannedExercise[] },
  assessment: TirednessAssessment,
): AdjustedSession {
  const exercises = adjustExercisesForLevel(session.exercises, assessment.effectiveLevel)
  const changes = diffExercises(session.exercises, exercises)
  const adjusted = changes.length > 0
  const result: AdjustedSession = {
    letter: session.letter,
    focus: session.focus,
    exercises,
    adjusted,
    plannedExercises: session.exercises,
    changes,
    tiredness: assessment,
  }
  if (adjusted) result.adjustmentReason = tirednessAdjustmentReason(assessment)
  return result
}

export interface PreviewTirednessChoiceInput {
  assessment: TirednessAssessment
  plannedExercises: PlannedExercise[]
  currentExercises: PlannedExercise[]
  candidate: TirednessLevel
  /** Usuário já confirmou sobrepor o relógio para este candidato. */
  confirmOverride?: boolean
}

export interface TirednessChoicePreview {
  /** O candidato discorda do relógio e exige confirmação explícita. */
  conflict: boolean
  /** Valor de override a salvar (considerando `confirmOverride`). */
  overrideAutomatic: boolean
  nextAssessment: TirednessAssessment
  nextExercises: PlannedExercise[]
  changesFromCurrent: ExerciseAdjustmentChange[]
  changesFromPlanned: ExerciseAdjustmentChange[]
  needsSave: boolean
}

export function previewTirednessChoice({
  assessment,
  plannedExercises,
  currentExercises,
  candidate,
  confirmOverride = false,
}: PreviewTirednessChoiceInput): TirednessChoicePreview {
  const { automaticLevel } = assessment
  const discordant = automaticLevel !== null && tirednessTier(candidate) !== tirednessTier(automaticLevel)
  const alreadyOverridden = assessment.manualLevel === candidate && assessment.overrideAutomatic
  const conflict = discordant && !alreadyOverridden
  const overrideAutomatic = discordant && (alreadyOverridden || confirmOverride)

  const nextAssessment = assessTiredness({
    date: assessment.date,
    manualLevel: candidate,
    overrideAutomatic,
    hrv: assessment.automaticHrv,
  })
  const nextExercises = adjustExercisesForLevel(plannedExercises, nextAssessment.effectiveLevel)

  return {
    conflict,
    overrideAutomatic,
    nextAssessment,
    nextExercises,
    changesFromCurrent: diffExercises(currentExercises, nextExercises),
    changesFromPlanned: diffExercises(plannedExercises, nextExercises),
    needsSave: candidate !== assessment.manualLevel || overrideAutomatic !== assessment.overrideAutomatic,
  }
}
