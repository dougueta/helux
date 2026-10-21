import type { DayType, DietCalibration, DietPhase, UserTrainingProfile } from '@helux/types'
import { ageOn, dayTargets, phaseTargets } from '@helux/nutrition'
import type { MockNutrition } from '../types'
import { dateDaysAgo, isoDaysAgo, today } from './clock'

/** Fase de dieta ativa há 3 semanas, metas pela fórmula da 018 (`phaseTargets`). */
export function nutritionFixture({
  profile,
  weightKg,
  genetics,
  withPhase = true,
}: {
  profile: UserTrainingProfile
  weightKg: number
  genetics: MockNutrition['genetics']
  withPhase?: boolean
}): MockNutrition {
  if (!withPhase || !profile.heightCm || !profile.birthDate || !profile.sex) {
    return { phase: null, calibrations: [], dayTypeOverride: null, swaps: [], history: [], genetics }
  }
  const baseTargets = phaseTargets({
    goal: 'recomposicao',
    weightKg,
    heightCm: profile.heightCm,
    age: ageOn(profile.birthDate, today()),
    sex: profile.sex,
    daysPerWeek: 4,
  })
  const phase: DietPhase = {
    id: 'mock-phase-1',
    goal: 'recomposicao',
    startedOn: dateDaysAgo(21),
    durationWeeks: 12,
    status: 'ativa',
    baseTargets,
  }
  const calibration: DietCalibration = {
    id: 'mock-calibration-1',
    action: 'inicial',
    before: null,
    after: baseTargets,
    reason: `Fase iniciada: recomposição corporal por 12 semanas, a partir de ${String(weightKg).replace('.', ',')} kg.`,
    metrics: { weeks: 0, weightFromKg: weightKg, weightToKg: weightKg, weeklyRatePct: 0 },
    createdAt: isoDaysAgo(21),
  }
  const history = [1, 2, 3, 4, 5].map(daysAgo => {
    const dayType: DayType = daysAgo % 3 === 0 ? 'descanso' : 'treino'
    return {
      date: dateDaysAgo(daysAgo),
      dayType,
      status: daysAgo === 4 ? ('treino-nao-realizado' as const) : ('concluido' as const),
      targets: dayTargets(baseTargets, { dayType, weightKg, flags: genetics.flags, tiredness: null }).targets,
    }
  })
  return { phase, calibrations: [calibration], dayTypeOverride: null, swaps: [], history, genetics }
}
