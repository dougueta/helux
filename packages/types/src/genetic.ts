export interface GeneticProfile {
  metabolismo: 'rapido' | 'lento' | 'moderado'
  recuperacaoMuscular: 'alta' | 'media' | 'baixa'
  riscoCardiovascular: 'alto' | 'medio' | 'baixo'
  predisposicao: 'forca' | 'endurance' | 'misto'
  alertas: string[]
}

export interface WorkoutConstraints {
  maxWeeklyFrequency: number
  preferredVolume: 'baixo' | 'medio' | 'alto'
  restBetweenSets: string
  forbiddenExerciseTypes: string[]
  cardioIntensityLimit: 'leve' | 'moderado' | 'alto'
}
