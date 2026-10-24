import type { Goal, Region } from './conditions'
import type { SessionKind } from './method'

// Spec 024 — sensações, análise do ciclo, tendência de check-ins e estado de geração.

export interface PainReport {
  region: Region
  intensity: 1 | 2 | 3
  exercise?: string
}

export interface SessionCheckin {
  id?: string
  phase: 'antes' | 'depois'
  date?: string
  mesocycleId?: string | null
  sessionIndex?: number | null
  energy?: number | null
  sleep?: number | null
  motivation?: number | null
  rpe?: number | null
  feeling?: number | null
  pains: PainReport[]
  note?: string | null
}

export type CycleFindingKind = 'estagnacao' | 'dor-recorrente' | 'baixa-aderencia' | 'progresso' | 'cansaco-alto'

export interface CycleFinding {
  kind: CycleFindingKind
  subject: string
  evidence: string
}

export interface CheckinTrend {
  from: string
  to: string
  deltas: Record<string, number>
  implausible: string[]
  modifiers: string[]
  suggestGoalChange: Goal | null
}

export interface CycleExerciseSummary {
  name: string
  firstE1rm: number | null
  lastE1rm: number | null
  avgRpe: number | null
  painReports: number
}

export interface CycleSummary {
  mesocycleId: string
  weeks: number
  adherence: Record<SessionKind, { done: number; planned: number }>
  exercises: CycleExerciseSummary[]
  avgRpeByWeek: number[]
  pains: Array<{ region: Region; count: number }>
  tirednessAvg: number | null
  checkinTrend: CheckinTrend | null
  findings: CycleFinding[]
  missingData: string[]
}

export type GenerationErrorCode = 'constraints-unsatisfiable' | 'incomplete-response' | 'budget-exceeded' | 'refusal' | 'unknown'

export interface GenerationStatus {
  status: 'gerando' | 'falhou' | 'ok'
  attempts: number
  errorCode: GenerationErrorCode | null
  startedAt: string | null
}
