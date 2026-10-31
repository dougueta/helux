import type { PlannedExercise } from '@helux/types'
import { isMainExercise } from './plan-structure'
import { EFFORT_LEVELS, type EffortLevel } from './progression'

// Spec 027 — esforço-alvo do exercício (repetições na reserva) em linguagem
// simples e comparação com o esforço registrado. Só orienta: não toca na
// progressão de carga (FR-011).

export type EffortComparison = 'no-alvo' | 'abaixo' | 'acima'

export interface EffortTarget {
  rir: number
  /** Níveis do registro que contam como "No alvo", em ordem crescente. */
  levels: EffortLevel[]
  label: string
  remaining: string
  explanation: string
}

export interface EffortSummaryItem {
  exerciseIndex: number
  name: string
  target: EffortTarget
  level: EffortLevel
  result: EffortComparison
}

export interface EffortSummary {
  onTarget: number
  total: number
  offTarget: EffortSummaryItem[]
}

const LEVEL_LABELS: Record<EffortLevel, string> = {
  facil: 'Fácil',
  moderado: 'Moderado',
  dificil: 'Difícil',
  limite: 'No limite',
}

/** Tabela do FR-008 (research R2): com 2 na reserva, Moderado (7) e Difícil (9) cercam o 8. */
function levelsFor(rir: number): EffortLevel[] {
  if (rir >= 4) return ['facil']
  if (rir === 3) return ['moderado']
  if (rir === 2) return ['moderado', 'dificil']
  if (rir === 1) return ['dificil']
  return ['limite']
}

const ADJUST = 'Se sobrar mais, aumente a carga; se sobrar menos, reduza.'

export function effortLevelLabel(level: EffortLevel): string {
  return LEVEL_LABELS[level]
}

/** Alvo do exercício em linguagem simples; `undefined` (sem alvo) → null. */
export function effortTarget(rirTarget: number | undefined): EffortTarget | null {
  if (rirTarget === undefined) return null
  const rir = Math.max(0, Math.round(rirTarget))
  const levels = levelsFor(rir)
  const label = levels.length === 2
    ? `${LEVEL_LABELS[levels[0]!]} a ${LEVEL_LABELS[levels[1]!].toLowerCase()}`
    : LEVEL_LABELS[levels[0]!]
  return {
    rir,
    levels,
    label,
    remaining: rir === 0 ? 'até a falha' : `sobrar ${rir} ${rir === 1 ? 'repetição' : 'repetições'}`,
    explanation: rir === 0
      ? `Vá até não conseguir fazer mais nenhuma repetição com boa técnica. ${ADJUST}`
      : `Termine a série sentindo que conseguiria fazer mais ${rir} com boa técnica. ${ADJUST}`,
  }
}

export function compareEffort(target: EffortTarget, level: EffortLevel): EffortComparison {
  const at = EFFORT_LEVELS.indexOf(level)
  if (at < EFFORT_LEVELS.indexOf(target.levels[0]!)) return 'abaixo'
  if (at > EFFORT_LEVELS.indexOf(target.levels[target.levels.length - 1]!)) return 'acima'
  return 'no-alvo'
}

/** Sugestão fora do alvo (FR-009): próxima série se ainda houver, senão próximo treino. */
export function effortAdvice(result: EffortComparison, hasPendingSets: boolean): string | null {
  if (result === 'no-alvo') return null
  const when = hasPendingSets ? 'na próxima série' : 'no próximo treino'
  return result === 'abaixo' ? `Aumente a carga ${when}.` : `Reduza a carga ou pare antes da falha ${when}.`
}

/** Resumo do treino (US3): só exercícios principais com alvo e esforço registrado; nenhum → null. */
export function summarizeEffort(
  items: { exercise: PlannedExercise; name: string; level?: EffortLevel }[],
): EffortSummary | null {
  const compared = items.flatMap(({ exercise, name, level }, exerciseIndex) => {
    const target = effortTarget(exercise.rirTarget)
    if (!target || !level || !isMainExercise(exercise)) return []
    return [{ exerciseIndex, name, target, level, result: compareEffort(target, level) }]
  })
  if (compared.length === 0) return null
  return {
    onTarget: compared.filter(i => i.result === 'no-alvo').length,
    total: compared.length,
    offTarget: compared.filter(i => i.result !== 'no-alvo'),
  }
}
