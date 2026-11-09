import type { ConstraintViolation, MesocycleSession, MethodPrescription, PlannedExercise } from '@helux/types'
import { findBankExercise } from './constraints'

// Spec 024 (R5) + Spec 030 (FR-002a): confere a semana-modelo gerada pela IA contra a
// prescrição de método. A fila weekTemplate contém exclusivamente as sessões de força
// (academia), enquanto cardio e mobilidade dedicados vivem nas Rotinas Complementares.

/** Grupos musculares principais (FR-013). */
export const MAIN_MUSCLE_GROUPS = ['peito', 'costas', 'ombro', 'quadriceps', 'posterior', 'gluteo'] as const

/** Exercício de força do treino principal (conta séries e frequência). */
export const isStrength = (e: PlannedExercise) => (e.phase ?? 'principal') === 'principal' && !e.cardio && !e.region

const MESSAGES = {
  estrutura: (found: number, wanted: number) => `a semana tem ${found} dias de força, o método pede ${wanted}`,
  apenasForca: () => 'a fila do mesociclo deve conter apenas sessões de força (cardio e mobilidade dedicados ficam nas Rotinas Complementares)',
  frequencia: (g: string, n: number, min: number) => `${g} é treinado ${n}× na semana; o mínimo é ${min}×`,
  volume: (g: string, n: number, min: number, max: number) => `${g} tem ${n} séries na semana; a faixa é ${min}–${max}`,
}

export function validateAgainstMethod(template: MesocycleSession[], method: MethodPrescription): ConstraintViolation[] {
  const out: ConstraintViolation[] = []
  const strength = template.filter(s => (s.kind ?? 'forca') === 'forca')
  if (strength.length !== method.strengthDays) {
    out.push({ sessionIndex: 0, exercise: null, rule: 'metodo-estrutura', message: MESSAGES.estrutura(strength.length, method.strengthDays) })
  } else if (template.length !== strength.length) {
    out.push({ sessionIndex: 0, exercise: null, rule: 'metodo-estrutura', message: MESSAGES.apenasForca() })
  }

  const frequency: Record<string, number> = {}
  const sets: Record<string, number> = {}
  for (const s of strength) {
    const groups = new Set<string>()
    for (const e of s.exercises.filter(isStrength)) {
      const entry = findBankExercise(e.name)
      if (!entry) continue
      groups.add(entry.muscleGroup)
      sets[entry.muscleGroup] = (sets[entry.muscleGroup] ?? 0) + e.sets
    }
    for (const g of groups) frequency[g] = (frequency[g] ?? 0) + 1
  }
  const { min, max } = method.weeklySetsPerGroup
  for (const g of MAIN_MUSCLE_GROUPS.filter(g => !method.exemptGroups?.includes(g))) {
    const f = frequency[g] ?? 0
    if (f < method.minFrequencyPerGroup) out.push({ sessionIndex: 0, exercise: g, rule: 'metodo-frequencia', message: MESSAGES.frequencia(g, f, method.minFrequencyPerGroup) })
    else if ((sets[g] ?? 0) < min || (sets[g] ?? 0) > max) out.push({ sessionIndex: 0, exercise: g, rule: 'metodo-volume', message: MESSAGES.volume(g, sets[g] ?? 0, min, max) })
  }

  return out
}
