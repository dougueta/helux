import type { GeneticProfile, WorkoutConstraints } from '@helux/types'

const FREQUENCY: Record<GeneticProfile['recuperacaoMuscular'], number> = {
  alta: 5,
  media: 4,
  baixa: 3,
}

const VOLUME: Record<GeneticProfile['recuperacaoMuscular'], WorkoutConstraints['preferredVolume']> = {
  alta: 'alto',
  media: 'medio',
  baixa: 'baixo',
}

const REST: Record<GeneticProfile['recuperacaoMuscular'], string> = {
  alta: '60-90s',
  media: '90-120s',
  baixa: '120-180s',
}

const CARDIO: Record<GeneticProfile['riscoCardiovascular'], WorkoutConstraints['cardioIntensityLimit']> = {
  alto: 'leve',
  medio: 'moderado',
  baixo: 'alto',
}

export function getWorkoutConstraints(profile: GeneticProfile): WorkoutConstraints {
  const forbiddenExerciseTypes: string[] = []

  if (profile.alertas.some((a) => a.toLowerCase().includes('ligamento'))) {
    forbiddenExerciseTypes.push('pliometria de alto impacto')
  }
  if (profile.alertas.some((a) => a.toLowerCase().includes('ombro'))) {
    forbiddenExerciseTypes.push('arremessos de alta intensidade')
  }

  return {
    maxWeeklyFrequency: FREQUENCY[profile.recuperacaoMuscular],
    preferredVolume: VOLUME[profile.recuperacaoMuscular],
    restBetweenSets: REST[profile.recuperacaoMuscular],
    forbiddenExerciseTypes,
    cardioIntensityLimit: CARDIO[profile.riscoCardiovascular],
  }
}
