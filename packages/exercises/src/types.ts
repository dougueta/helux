import type { ExercisePhase, Region } from '@helux/types'
import type { DemoSpec } from './engine/types'

export type CatalogKind = 'forca' | 'preparacao' | 'cardio'

/** Implemento real, usado na etiqueta e no desenho (R4). Não substitui `equipment`. */
export type Gear =
  | 'barra'
  | 'halteres'
  | 'kettlebell'
  | 'maquina'
  | 'smith'
  | 'cabo'
  | 'corda'
  | 'peso-corporal'
  | 'elastico'
  | 'roda'
  | 'banco'
  | 'barra-fixa'
  /** preparação (028 US6): bicicleta ergométrica e remo ergômetro */
  | 'bicicleta'
  | 'remo'
  | 'nenhum'

export const GEARS: readonly Gear[] = [
  'barra', 'halteres', 'kettlebell', 'maquina', 'smith', 'cabo', 'corda',
  'peso-corporal', 'elastico', 'roda', 'banco', 'barra-fixa', 'bicicleta', 'remo', 'nenhum',
]

/** Implementos que não carregam peso: nada é desenhado na mão. */
export const UNLOADED_GEAR: readonly Gear[] = ['peso-corporal', 'banco', 'barra-fixa', 'bicicleta', 'nenhum']

export type MuscleKey =
  | 'peito'
  | 'ombro'
  | 'triceps'
  | 'biceps'
  | 'antebraco'
  | 'dorsal'
  | 'trapezio'
  | 'lombar'
  | 'core'
  | 'quadriceps'
  | 'posterior'
  | 'gluteo'
  | 'adutores'
  | 'abdutores'
  | 'panturrilha'

export const MUSCLE_KEYS: readonly MuscleKey[] = [
  'peito', 'ombro', 'triceps', 'biceps', 'antebraco', 'dorsal', 'trapezio', 'lombar',
  'core', 'quadriceps', 'posterior', 'gluteo', 'adutores', 'abdutores', 'panturrilha',
]

export interface Muscles {
  primary: MuscleKey[]
  secondary: MuscleKey[]
}

export interface Guidance {
  /** posição inicial; ao menos 1 */
  setup: string[]
  /** execução; ao menos 1 */
  steps: string[]
  /** obrigatório em força e em preparação com técnica */
  commonError?: string
  /** "boa opção quando…", fora dos passos */
  context?: string
  /** só cardio: como manter cada zona */
  zones?: Record<string, string>
}

export interface CatalogItem {
  /** estável, nunca reutilizado */
  id: string
  /** único em todos os catálogos */
  name: string
  kind: CatalogKind
  /** obrigatório fora de pending.json */
  guidance?: Guidance
  /** obrigatório fora de pending.json */
  demo?: DemoSpec
}

export type Equipment = 'barra' | 'halteres' | 'maquina-cabo' | 'peso-corporal'
export type Joint = 'joelho' | 'ombro' | 'lombar'
export type StressLevel = 0 | 1 | 2
export type JointStress = Record<Joint, StressLevel>

export interface StrengthExercise extends CatalogItem {
  kind: 'forca'
  /** grupo do volume semanal (inalterado, R4) */
  muscleGroup: string
  /** filtro de equipamento disponível (inalterado, R4) */
  equipment: Equipment
  pattern: string
  /** spec 013 (FR-009): carga articular estimada, 0 (baixa) a 2 (alta) */
  stress: JointStress
  tempo: string
  /** implemento real */
  gear: Gear
  /** Enquanto o item está pendente, guarda os valores derivados atuais; explícito após a migração. */
  muscles: Muscles
  /** derivado de guidance após a migração; valor atual enquanto pendente */
  cues: string[]
}

export type PreparationPhase = Exclude<ExercisePhase, 'principal'> | 'mobilidade'

export interface PreparationItem extends CatalogItem {
  kind: 'preparacao'
  phases: PreparationPhase[]
  /** ao menos uma */
  regions: Region[]
  mode: 'reps' | 'por-lado' | 'sustentacao' | 'continuo'
  /** vazio = sem equipamento */
  needs: Gear[]
  /** nomes antigos exatos, para planos existentes */
  knownNames: string[]
}

/** Conteúdo de uma modalidade de cardio; os dados de impacto e local seguem em CARDIO_BANK. */
export interface CardioContent {
  id: string
  guidance?: Guidance
  demo?: DemoSpec
}

export type DemoState = 'nova' | 'legada' | 'indisponivel'

export interface ResolvedItem {
  /** null = sem correspondência */
  id: string | null
  name: string
  kind: CatalogKind | null
  demoState: DemoState
  guidance: Guidance | null
  muscles: { primary: string[]; secondary: string[] } | null
  tempo: string | null
  gearLabel: string | null
  isApproach: boolean
}
