import type { HardConstraints, MethodPrescription } from '@helux/types'
import { MUSCLE_GROUP_LABEL } from '../exercise-bank'
import { allowedCardio, allowedExercises } from './constraints'
import { MAIN_MUSCLE_GROUPS } from './method-validation'

// Spec 024 (R17, C): antes de gastar uma chamada, confere se o pedido tem solução
// e ajusta o método por código quando não tem. Cada ajuste vira um modificador
// com o motivo, que aparece no prompt e fica salvo com o método.

/** Mesma estimativa do validador de duração: 5 min de aquecimento + 130 s por série. */
const WARMUP_MIN = 5
const SECONDS_PER_SET = 130
const MIN_SETS_PER_GROUP = 2

export interface FeasibilityResult {
  method: MethodPrescription
  /** Motivo quando nem o ajuste resolve (nenhum exercício de força permitido). */
  infeasible: string | null
}

export function ensureFeasible(input: MethodPrescription, c: HardConstraints): FeasibilityResult {
  const method: MethodPrescription = { ...input, modifiers: [...input.modifiers], cardio: { ...input.cardio }, weeklySetsPerGroup: { ...input.weeklySetsPerGroup } }
  const allowed = allowedExercises(c)
  if (allowed.length === 0) return { method, infeasible: 'nenhum exercício de força do banco é compatível com as restrições' }

  // Grupo principal sem nenhum exercício permitido fica fora da conta de volume.
  const exempt = MAIN_MUSCLE_GROUPS.filter(g => !allowed.some(e => e.muscleGroup === g))
  if (exempt.length > 0) {
    method.exemptGroups = [...new Set([...(method.exemptGroups ?? []), ...exempt])]
    const labels = exempt.map(g => MUSCLE_GROUP_LABEL[g] ?? g).join(', ')
    method.modifiers.push({ source: 'condicao', description: `Nenhum exercício de ${labels} é compatível com as restrições; fica fora da conta de volume deste ciclo.` })
  }

  // Cardio: só modalidades que o método aceita e as restrições permitem.
  const cardioOk = new Set(allowedCardio(c).map(k => k.id))
  method.cardio.allowed = method.cardio.allowed.filter(id => cardioOk.has(id))
  if (method.cardio.allowed.length === 0 && method.cardioSessions > 0) {
    method.cardioSessions = 0
    method.modifiers.push({ source: 'condicao', description: 'Nenhuma modalidade de cardio é compatível com as restrições; o condicionamento fica no treino de força.' })
  }

  // Tempo: o mínimo de séries, mais o cardio que não cabe em dias próprios, precisa caber na sessão.
  if (c.maxSessionMinutes !== null && method.strengthDays > 0) {
    const freeDays = Math.max(0, (method.daysAvailable ?? method.strengthDays) - method.strengthDays)
    const cardioOnStrength = Math.max(0, method.cardioSessions - freeDays)
    const cardioPerDay = Math.ceil((cardioOnStrength * method.cardio.minutes) / method.strengthDays)
    const perSession = Math.floor(((c.maxSessionMinutes - WARMUP_MIN - cardioPerDay) * 60) / SECONDS_PER_SET)
    const groups = MAIN_MUSCLE_GROUPS.length - (method.exemptGroups?.length ?? 0)
    const perGroup = groups > 0 ? Math.floor((perSession * method.strengthDays) / groups) : method.weeklySetsPerGroup.min
    if (perGroup < method.weeklySetsPerGroup.min) {
      const min = Math.max(MIN_SETS_PER_GROUP, perGroup)
      method.weeklySetsPerGroup = { min, max: Math.max(min, Math.min(method.weeklySetsPerGroup.max, perGroup + 2)) }
      method.modifiers.push({
        source: 'tempo',
        description: `Sessões de até ${c.maxSessionMinutes} min${cardioPerDay > 0 ? ` com cardio no mesmo dia` : ''}: ${min}–${method.weeklySetsPerGroup.max} séries por grupo na semana, o que cabe no tempo.`,
      })
    }
  }
  return { method, infeasible: null }
}
