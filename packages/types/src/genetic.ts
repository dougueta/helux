export interface GeneticProfile {
  metabolismo: 'rapido' | 'lento' | 'moderado'
  recuperacaoMuscular: 'alta' | 'media' | 'baixa'
  riscoCardiovascular: 'alto' | 'medio' | 'baixo'
  predisposicao: 'forca' | 'endurance' | 'misto'
  alertas: string[]
}

/** Marcador genético ligado a treino, extraído do teste Genera (spec 017). */
export interface GeneticTrait {
  /** `${snp}:${slug do traço}` — único na lista. */
  key: string
  gene: string
  genotype?: string
  /** Traço (característica), texto original do teste. */
  label: string
  /** Nível 0–1: 0,2 baixo, 0,5 médio, 0,9 alto. */
  level: number
  /** Interpretação (resultado), texto original do teste. */
  note: string
  /** Ponto de atenção, cuidado relevante ou lesão. */
  warn: boolean
}

/** Resposta de GET /genetic-profile: o resumo de sempre + os marcadores. */
export interface GeneticProfileView extends GeneticProfile {
  traits: GeneticTrait[]
}

export interface WorkoutConstraints {
  maxWeeklyFrequency: number
  preferredVolume: 'baixo' | 'medio' | 'alto'
  restBetweenSets: string
  forbiddenExerciseTypes: string[]
  cardioIntensityLimit: 'leve' | 'moderado' | 'alto'
}
