import type { Goal, StressLevel } from './conditions'

// Spec 024 — prescrição de método determinística (R5).

export const SESSION_KINDS = ['forca', 'cardio', 'mobilidade'] as const
export type SessionKind = (typeof SESSION_KINDS)[number]

export type CardioZone = 'leve' | 'moderada' | 'intervalado-leve'

export interface WeekPrescription {
  week: number
  /** Fator aplicado às séries da semana-modelo. */
  setsFactor: number
  rirTarget: number
  deload: boolean
}

export interface MethodPrescription {
  goal: Goal
  weeks: number
  deloadWeek: number
  strengthDays: number
  cardioSessions: number
  mobilitySessions: number
  allowedSplits: string[]
  minFrequencyPerGroup: number
  weeklySetsPerGroup: { min: number; max: number }
  weekly: WeekPrescription[]
  repRanges: { basicos: [number, number]; acessorios: [number, number] }
  cardio: { minutes: number; zone: CardioZone; maxImpact: StressLevel; allowed: string[] }
  modifiers: Array<{ source: 'checkin' | 'ciclo' | 'condicao' | 'pausa' | 'tempo'; description: string }>
}
