import type { ConstraintViolation, MesocycleSession, MethodPrescription, PlannedExercise } from '@helux/types'
import { findBankExercise } from './constraints'

// Spec 024 (R5): confere a semana-modelo gerada pela IA contra a prescrição de
// método (estrutura, frequência e volume por grupo, cardio e mobilidade).

/** Grupos musculares principais (FR-013). */
export const MAIN_MUSCLE_GROUPS = ['peito', 'costas', 'ombro', 'quadriceps', 'posterior', 'gluteo'] as const

/** Exercício de força do treino principal (conta séries e frequência). */
export const isStrength = (e: PlannedExercise) => (e.phase ?? 'principal') === 'principal' && !e.cardio && !e.region
const hasMobility = (s: MesocycleSession) => s.kind === 'mobilidade' || s.exercises.some(e => !!e.region && (e.phase ?? 'principal') === 'principal')

const MESSAGES = {
  estrutura: (found: number, wanted: number) => `a semana tem ${found} dias de força, o método pede ${wanted}`,
  frequencia: (g: string, n: number, min: number) => `${g} é treinado ${n}× na semana; o mínimo é ${min}×`,
  volume: (g: string, n: number, min: number, max: number) => `${g} tem ${n} séries na semana; a faixa é ${min}–${max}`,
  cardio: (n: number, min: number) => `${n} sessões com cardio na semana; o método pede ${min}`,
  mobilidade: (n: number, min: number) => `${n} sessões com mobilidade na semana; o método pede ${min}`,
}

export function validateAgainstMethod(template: MesocycleSession[], method: MethodPrescription): ConstraintViolation[] {
  const out: ConstraintViolation[] = []
  const strength = template.filter(s => (s.kind ?? 'forca') === 'forca')
  if (strength.length !== method.strengthDays) {
    out.push({ sessionIndex: 0, exercise: null, rule: 'metodo-estrutura', message: MESSAGES.estrutura(strength.length, method.strengthDays) })
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

  const cardio = template.filter(s => s.kind === 'cardio' || s.exercises.some(e => !!e.cardio)).length
  if (cardio < method.cardioSessions) out.push({ sessionIndex: 0, exercise: null, rule: 'metodo-cardio', message: MESSAGES.cardio(cardio, method.cardioSessions) })
  const mobility = template.filter(hasMobility).length
  if (mobility < method.mobilitySessions) out.push({ sessionIndex: 0, exercise: null, rule: 'metodo-mobilidade', message: MESSAGES.mobilidade(mobility, method.mobilitySessions) })
  return out
}
