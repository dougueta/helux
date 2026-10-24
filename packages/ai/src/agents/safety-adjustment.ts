import type { ExerciseAdjustmentChange, HardConstraints, PlannedExercise } from '@helux/types'
import { CARDIO_BANK } from '../cardio-bank'
import { compatibleAlternatives, findBankExercise, validatePlanAgainstConstraints } from './constraints'

// Spec 024 (FR-009, FR-018): adapta a sessão do dia às regras de segurança
// (condições de saúde, crise de gota, dor relatada antes do treino). Troca o
// exercício por uma alternativa segura do mesmo grupo ou o remove, sem IA.

export interface SafetyAdjustment {
  exercises: PlannedExercise[]
  changes: ExerciseAdjustmentChange[]
  reason: string | null
}

const isFree = (e: PlannedExercise) => e.phase === 'aquecimento' || e.phase === 'volta-calma' || !!e.region

/** Só violações de segurança contam: nome fora do banco (planos antigos) não é motivo para trocar. */
const violates = (e: PlannedExercise, c: HardConstraints) =>
  validatePlanAgainstConstraints([{ letter: '', focus: '', completedAt: null, exercises: [e] }], c).some(v => v.rule !== 'fora-do-banco' && v.rule !== 'duracao')

function saferCardio(item: PlannedExercise, c: HardConstraints): PlannedExercise | null {
  const max = c.maxCardioImpact ?? 2
  const option = CARDIO_BANK.filter(o => o.impact <= max).sort((a, b) => a.impact - b.impact)[0]
  if (!option || !item.cardio) return null
  return { ...item, name: option.name, cardio: { ...item.cardio, modality: option.id }, notes: 'Troca de modalidade para poupar a articulação hoje.' }
}

function saferStrength(item: PlannedExercise, c: HardConstraints): PlannedExercise | null {
  const alt = compatibleAlternatives(item.name, c).find(a => !a.violatesSafety)
  if (!alt) return null
  const entry = findBankExercise(alt.exerciseId)!
  return {
    name: entry.name,
    sets: item.sets,
    reps: item.reps,
    weight: item.weight,
    ...(item.phase ? { phase: item.phase } : {}),
    ...(item.rirTarget !== undefined ? { rirTarget: item.rirTarget } : {}),
    notes: 'Substituto de hoje: escolha a carga pela sensação, sem dor.',
  }
}

export function adaptSessionForSafety(exercises: PlannedExercise[], constraints: HardConstraints, why?: string): SafetyAdjustment {
  const out: PlannedExercise[] = []
  const changes: ExerciseAdjustmentChange[] = []
  for (const item of exercises) {
    if (isFree(item) || !violates(item, constraints)) {
      out.push(item)
      continue
    }
    const replacement = item.cardio ? saferCardio(item, constraints) : saferStrength(item, constraints)
    const base = { name: item.name, setsBefore: item.sets, weightBefore: item.weight }
    if (replacement && !violates(replacement, constraints)) {
      out.push(replacement)
      changes.push({ ...base, setsAfter: replacement.sets, weightAfter: replacement.weight, replacedBy: replacement.name })
    } else {
      changes.push({ ...base, setsAfter: 0, weightAfter: '—', removed: true })
    }
  }
  const reason = changes.length > 0 ? `Treino de hoje adaptado para proteger a articulação${why ? ` (${why})` : ''}.` : null
  return { exercises: out, changes, reason }
}

