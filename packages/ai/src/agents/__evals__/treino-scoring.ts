import type { ConstraintViolation, HardConstraints, MesocycleSession, PlannedExercise, UsageRecord } from '@helux/types'
import { findBankExercise, validatePlanAgainstConstraints } from '../constraints'
import { computeCostUsd } from '../cost'

// Spec 024 (R15) — checagens determinísticas do eval do Agente de Treino.
// Valem para os dois formatos: rotação (agente antigo) e semanal (024).

/** Grupos musculares principais (FR-013). */
export const MAIN_GROUPS = ['peito', 'costas', 'ombro', 'quadriceps', 'posterior', 'gluteo'] as const

/** O que se espera do plano de cada perfil de teste. */
export interface EvalExpectations {
  daysPerWeek: number
  minFrequency: number
  setsRange: { min: number; max: number }
  cardioPerWeek: number
  mobilityPerWeek: number
}

export interface WeeklyStats {
  frequency: Record<string, number>
  sets: Record<string, number>
  cardio: number
  mobility: number
}

const isMain = (e: PlannedExercise) => (e.phase ?? 'principal') === 'principal' && !e.cardio && !e.region

/**
 * Frequência e séries semanais por grupo, mais sessões de cardio e mobilidade.
 * Formato semanal: só a semana 1. Rotação: cada sessão se repete daysPerWeek / nº de sessões vezes por semana.
 */
export function weeklyStats(sessions: MesocycleSession[], daysPerWeek: number): WeeklyStats {
  const weekly = sessions.some(s => s.week !== undefined)
  const week = weekly ? sessions.filter(s => s.week === 1) : sessions
  const factor = weekly || week.length === 0 ? 1 : daysPerWeek / week.length
  const frequency: Record<string, number> = {}
  const sets: Record<string, number> = {}
  let cardio = 0
  let mobility = 0
  for (const s of week) {
    const groups = new Set<string>()
    for (const e of s.exercises) {
      if (!isMain(e)) continue
      const entry = findBankExercise(e.name)
      if (!entry) continue
      groups.add(entry.muscleGroup)
      sets[entry.muscleGroup] = (sets[entry.muscleGroup] ?? 0) + e.sets * factor
    }
    for (const g of groups) frequency[g] = (frequency[g] ?? 0) + factor
    if (s.kind === 'cardio' || s.exercises.some(e => e.cardio)) cardio += factor
    // Mobilidade dedicada: sessão de mobilidade ou bloco no treino principal (não conta aquecimento/volta à calma).
    if (s.kind === 'mobilidade' || s.exercises.some(e => e.region && (e.phase ?? 'principal') === 'principal')) mobility += factor
  }
  return { frequency, sets, cardio, mobility }
}

const LEAK_PATTERNS = [/\d{4}-\d{2}-\d{2}/, /usad[oa]s? (recentemente|em|nas?)\b/i, /sess(ão|ões) anteriore?s?/i, /evite .* nesta sessão/i, /regra do sistema|restrição rígida/i]

/** Nota que expõe raciocínio interno (datas, uso anterior, regras do sistema). */
export function noteLeaks(note: string): boolean {
  return LEAK_PATTERNS.some(p => p.test(note))
}

export type Criterion = 'seguranca' | 'frequencia-volume' | 'cardio-mobilidade' | 'notas-honestas'

export interface PlanScore {
  violations: ConstraintViolation[]
  stats: WeeklyStats
  scores: Record<Criterion, number>
}

const round = (n: number) => Math.round(n * 100) / 100

/** Pontua o plano de 0 a 5 em cada critério determinístico. */
export function scorePlan(input: { sessions: MesocycleSession[]; constraints: HardConstraints; expectations: EvalExpectations; extraViolations?: ConstraintViolation[] }): PlanScore {
  const { sessions, constraints, expectations: x } = input
  const violations = [...validatePlanAgainstConstraints(sessions, constraints), ...(input.extraViolations ?? [])]
  const stats = weeklyStats(sessions, x.daysPerWeek)

  const groupsOk = MAIN_GROUPS.filter(g => (stats.frequency[g] ?? 0) >= x.minFrequency && (stats.sets[g] ?? 0) >= x.setsRange.min && (stats.sets[g] ?? 0) <= x.setsRange.max)
  const cardioOk = stats.cardio >= x.cardioPerWeek
  const mobilityOk = stats.mobility >= x.mobilityPerWeek

  const notes = sessions.flatMap(s => s.exercises.map(e => e.notes).filter((n): n is string => !!n))
  const honest = notes.length === 0 ? 1 : notes.filter(n => !noteLeaks(n)).length / notes.length

  return {
    violations,
    stats,
    scores: {
      seguranca: violations.some(v => !v.rule.startsWith('metodo-')) ? 0 : 5,
      'frequencia-volume': round((groupsOk.length / MAIN_GROUPS.length) * 5),
      'cardio-mobilidade': (cardioOk ? 2.5 : 0) + (mobilityOk ? 2.5 : 0),
      'notas-honestas': round(honest * 5),
    },
  }
}

export interface ProfileResult {
  profile: string
  scores: Record<string, number>
  usages: UsageRecord[]
}

/** Média por critério, total (média das médias) e custo da rodada. */
export function aggregate(results: ProfileResult[]): { byCriterion: Record<string, number>; total: number; costUsd: number } {
  const sums: Record<string, { sum: number; n: number }> = {}
  for (const r of results) {
    for (const [k, v] of Object.entries(r.scores)) {
      sums[k] = { sum: (sums[k]?.sum ?? 0) + v, n: (sums[k]?.n ?? 0) + 1 }
    }
  }
  const byCriterion = Object.fromEntries(Object.entries(sums).map(([k, { sum, n }]) => [k, round(sum / n)]))
  const values = Object.values(byCriterion)
  const total = values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : 0
  const costUsd = results.flatMap(r => r.usages).reduce((n, u) => n + computeCostUsd(u), 0)
  return { byCriterion, total, costUsd }
}
