import type { MesocycleSession } from './mesocycle'

// Spec 022 — time de agentes especialistas (data-model.md).

export type AgentKey = 'treino' | 'medicina' | 'nutricao'
export type Channel = 'equipe' | AgentKey

export const AGENT_KEYS: readonly AgentKey[] = ['treino', 'medicina', 'nutricao']
export const CHANNELS: readonly Channel[] = ['equipe', 'treino', 'medicina', 'nutricao']

/** Fontes do Perfil Integrado, na ordem fixa usada no prompt (R6). */
export const SOURCE_KEYS = [
  'perfil',
  'preferencias',
  'historico',
  'mesociclo',
  'cansaco',
  'checkins',
  'genetica',
  'exames',
  'nutricao',
  'relatos',
  'restricoes',
  'edicoes',
] as const
export type SourceKey = (typeof SOURCE_KEYS)[number]
export type SourceStatus = 'ativa' | 'vazia' | 'desativada'

export const EQUIPMENT = ['barra', 'halteres', 'maquina-cabo', 'peso-corporal'] as const
export type Equipment = (typeof EQUIPMENT)[number]
export type TrainingLocation = 'academia' | 'casa' | 'ao-ar-livre' | 'hotel'
export type TrainingStyle = 'hipertrofia-classica' | 'forca' | 'funcional' | 'circuito' | 'misto'

export const MOVEMENT_PATTERNS = [
  'agachar',
  'dobrar-quadril',
  'empurrar-horizontal',
  'empurrar-vertical',
  'puxar-horizontal',
  'puxar-vertical',
  'core',
  'isolamento',
] as const
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number]

export type GuidanceKind = 'restricao-seguranca' | 'recomendacao'
export type GuidanceStatus = 'pendente' | 'ativa' | 'recusada' | 'expirada' | 'removida'
export type FactCategory = 'sintoma' | 'preferencia' | 'decisao'
export type ProposalKind = 'ajuste-sessao' | 'adaptacao-restricao'
export type ProposalStatus = 'pendente' | 'aceita' | 'recusada' | 'obsoleta'

// ---- preferências (FR-005, R8) ----

export interface TrainingPreferences {
  availableDays: number[]
  maxSessionMinutes: number | null
  location: TrainingLocation | null
  availableEquipment: Equipment[]
  favoriteExercises: string[]
  exercisesToAvoid: string[]
  priorityMuscleGroups: string[]
  trainingStyle: TrainingStyle | null
  freeInstructions: string | null
  updatedAt: string | null
}

export type TrainingPreferencesInput = Omit<TrainingPreferences, 'updatedAt'>

/** Campos rígidos: mudança gera proposta de adaptação das sessões pendentes (FR-011). */
export const HARD_PREFERENCE_FIELDS = ['availableEquipment', 'exercisesToAvoid', 'maxSessionMinutes'] as const

// ---- Perfil Integrado (FR-001/002) ----

export interface IntegratedSource {
  status: SourceStatus
  updatedAt: string | null
  /** Exames com mais de 6 meses. */
  stale?: boolean
  /** Resumo curto para o prompt (vazio quando a fonte não está ativa). */
  summary: string
  /** Estrutura por fonte, para a tela. */
  data: unknown
}

export interface IntegratedProfile {
  generatedAt: string
  sources: Record<SourceKey, IntegratedSource>
}

export interface SourcesUsed {
  ativa: SourceKey[]
  vazia: SourceKey[]
  desativada: SourceKey[]
}

/** Entrada do validador (R7): preferências rígidas + restrições de segurança ativas. */
export interface HardConstraints {
  availableEquipment: Equipment[]
  exercisesToAvoid: string[]
  maxSessionMinutes: number | null
  blockedPatterns: string[]
  blockedExercises: string[]
}

export interface PlanDecision {
  topic: 'divisao' | 'volume' | 'exercicio' | 'descanso' | 'intensidade' | 'outro'
  choice: string
  sources: SourceKey[]
  reason: string
}

// ---- conversas ----

export interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  agent: AgentKey | null
  content: string
  sourcesUsed: SourcesUsed | null
  createdAt: string
}

export interface AgentConversation {
  id: string
  channel: Channel
  startedAt: string
}

export interface ConversationFact {
  id: string
  category: FactCategory
  text: string
  originAgent: AgentKey
  createdAt: string
  updatedAt: string
}

export interface SharedGuidance {
  id: string
  kind: GuidanceKind
  text: string
  reason: string
  originAgent: AgentKey
  status: GuidanceStatus
  startsAt: string | null
  expiresAt: string | null
  durationDays: number | null
  blockedPatterns: string[]
  blockedExercises: string[]
  /** Recomendação em conflito com esta restrição de segurança (FR-021). */
  conflictsWith?: string | null
  createdAt: string
}

// ---- treino: propostas e edições ----

export interface SessionChange {
  sessionIndex: number
  letter: string
  kind: 'trocado' | 'removido' | 'adicionado' | 'alterado'
  before: string | null
  after: string | null
}

export interface WorkoutAdjustmentProposal {
  id: string
  mesocycleId: string
  kind: ProposalKind
  sessionIndexes: number[]
  before: MesocycleSession[]
  after: MesocycleSession[]
  changes: SessionChange[]
  reason: string
  status: ProposalStatus
  createdAt: string
}

export interface SessionEdit {
  id: string
  sessionIndex: number
  exerciseIndex: number
  kind: 'troca-exercicio' | 'series-reps-carga'
  before: { exercise?: string; sets?: number; reps?: string; load?: string }
  after: { exercise?: string; sets?: number; reps?: string; load?: string }
  safetyOverride: boolean
  createdAt: string
}

export interface ExerciseAlternative {
  exerciseId: string
  name: string
  equipment: Equipment
  violatesSafety: boolean
  reason?: string
}

export interface ConstraintViolation {
  sessionIndex: number
  exercise: string | null
  rule: 'fora-do-banco' | 'evitar' | 'equipamento' | 'duracao' | 'padrao-bloqueado' | 'exercicio-bloqueado'
  message: string
}

// ---- custo (R11) ----

export type AiOperation = 'chat' | 'roteamento' | 'mesociclo' | 'ajuste-sessao' | 'adaptacao-restricao' | 'conflito'

export interface UsageRecord {
  model: string
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  cacheTtl: '5m' | '1h' | null
  operation: AiOperation
  agent: AgentKey | null
}

export interface BudgetStatus {
  capUsd: number
  spentUsd: number
  pct: number
}

// ---- eventos do chat (SSE) ----

export type AgentStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'fact'; fact: ConversationFact }
  | { type: 'proposal'; guidance?: SharedGuidance; adjustment?: WorkoutAdjustmentProposal }
  | { type: 'handoff'; to: AgentKey; reason: string }

