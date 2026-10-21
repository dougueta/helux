import { ApiError, apiFetch, authHeader } from '@/services/api-client'
import { readSSE } from '@/lib/sse'
import type {
  AgentConversation,
  AgentKey,
  AgentMessage,
  BudgetStatus,
  Channel,
  SharedGuidance,
  SourcesUsed,
  ConversationFact,
  Equipment,
  IntegratedProfile,
  SourceKey,
  ExerciseAlternative,
  MesocycleSession,
  TrainingPreferences,
  TrainingPreferencesInput,
  WorkoutAdjustmentProposal,
} from '@helux/types'

// Spec 022 — cliente das rotas dos agentes especialistas (contracts/agents-api.md).

export interface CatalogExercise {
  id: string
  name: string
  muscleGroup: string
  equipment: Equipment
  pattern: string
}

export interface SavePreferencesResult {
  preferences: TrainingPreferences
  appliesFrom: 'proximo-mesociclo' | 'imediato'
  proposal: WorkoutAdjustmentProposal | null
  budgetBlocked?: boolean
}

export async function getPreferences(): Promise<TrainingPreferences> {
  return (await apiFetch('/api/training-preferences')) as TrainingPreferences
}

export async function savePreferences(input: TrainingPreferencesInput): Promise<SavePreferencesResult> {
  return (await apiFetch('/api/training-preferences', { method: 'PUT', body: JSON.stringify(input) })) as SavePreferencesResult
}

export async function getExerciseCatalog(): Promise<CatalogExercise[]> {
  return ((await apiFetch('/api/exercises')) as { exercises: CatalogExercise[] }).exercises
}

// ---- treino: ajuste, propostas e edição manual ----

export async function requestAdjustment(request: string): Promise<WorkoutAdjustmentProposal> {
  return ((await apiFetch('/api/workout/adjust', { method: 'POST', body: JSON.stringify({ request }) })) as { proposal: WorkoutAdjustmentProposal }).proposal
}

export async function resolveProposal(id: string, action: 'accept' | 'reject'): Promise<void> {
  await apiFetch(`/api/workout/proposals/${id}/${action}`, { method: 'POST' })
}

export async function getAlternatives(sessionIndex: number, exerciseIndex: number): Promise<ExerciseAlternative[]> {
  return ((await apiFetch(`/api/workout/sessions/${sessionIndex}/exercises/${exerciseIndex}/alternatives`)) as { alternatives: ExerciseAlternative[] }).alternatives
}

export interface ExerciseEditInput {
  exerciseId?: string
  sets?: number
  reps?: string
  load?: string
  confirmSafetyOverride?: boolean
}

export async function editSessionExercise(sessionIndex: number, exerciseIndex: number, edit: ExerciseEditInput): Promise<MesocycleSession> {
  return ((await apiFetch(`/api/workout/sessions/${sessionIndex}/exercises/${exerciseIndex}`, { method: 'PATCH', body: JSON.stringify(edit) })) as { session: MesocycleSession }).session
}

// ---- Perfil Integrado (US2) ----

export type IntegratedProfileResponse = IntegratedProfile & { budget: BudgetStatus }

export async function getIntegratedProfile(): Promise<IntegratedProfileResponse> {
  return (await apiFetch('/api/agents/profile')) as IntegratedProfileResponse
}

export async function setSourceEnabled(source: SourceKey, enabled: boolean): Promise<void> {
  await apiFetch(`/api/agents/sources/${source}`, { method: 'PUT', body: JSON.stringify({ enabled }) })
}

export async function setBudgetCap(monthlyCapUsd: number): Promise<BudgetStatus> {
  return (await apiFetch('/api/agents/budget', { method: 'PUT', body: JSON.stringify({ monthlyCapUsd }) })) as BudgetStatus
}

export async function updateFact(id: string, text: string): Promise<ConversationFact> {
  return (await apiFetch(`/api/agents/facts/${id}`, { method: 'PATCH', body: JSON.stringify({ text }) })) as ConversationFact
}

export async function deleteFact(id: string): Promise<void> {
  await apiFetch(`/api/agents/facts/${id}`, { method: 'DELETE' })
}

export async function removeGuidance(id: string): Promise<void> {
  await apiFetch(`/api/agents/guidance/${id}`, { method: 'DELETE' })
}

// ---- conversas (runtime de chat) ----

export async function getConversation(channel: Channel): Promise<{ conversation: AgentConversation | null; messages: AgentMessage[] }> {
  return (await apiFetch(`/api/agents/conversations/${channel}`)) as { conversation: AgentConversation | null; messages: AgentMessage[] }
}

export async function startNewConversation(channel: Channel): Promise<AgentConversation> {
  return ((await apiFetch(`/api/agents/conversations/${channel}/new`, { method: 'POST' })) as { conversation: AgentConversation }).conversation
}

export async function resolveGuidance(id: string, action: 'accept' | 'reject'): Promise<SharedGuidance & { conflict?: { guidanceId: string; text: string } }> {
  return (await apiFetch(`/api/agents/guidance/${id}/${action}`, { method: 'POST' })) as SharedGuidance & { conflict?: { guidanceId: string; text: string } }
}

/** Eventos do chat (agents-api.md). */
export type ChatEvent =
  | { event: 'start'; data: { userMessageId: string; budgetWarning?: { pct: number } } }
  | { event: 'routed'; data: { agent: AgentKey; reason: string } }
  | { event: 'delta'; data: { text: string } }
  | { event: 'fact'; data: { fact: import('@helux/types').ConversationFact } }
  | { event: 'proposal'; data: { guidance?: SharedGuidance; adjustment?: WorkoutAdjustmentProposal } }
  | { event: 'handoff'; data: { to: AgentKey; reason: string } }
  | { event: 'done'; data: { agentMessageId: string; agent: AgentKey; sourcesUsed: SourcesUsed } }
  | { event: 'error'; data: { message: string; code?: string } }

/** Resposta crua do chat: rede real, ou o stream simulado no modo mock (spec 021). */
async function chatResponse(body: string): Promise<Response> {
  if (process.env.NODE_ENV !== 'production') {
    const { isMockActive } = await import('@/lib/data-source')
    if (isMockActive()) {
      const { mockChatResponse } = await import('@/mocks/agents-chat')
      return mockChatResponse(body)
    }
  }
  return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/agents/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body,
  })
}

/** Envia a mensagem e repassa cada evento SSE (R3). Erros antes do stream viram `ApiError` (ex.: teto). */
export async function streamChat(channel: Channel, message: string, onEvent: (e: ChatEvent) => void): Promise<void> {
  const res = await chatResponse(JSON.stringify({ channel, message }))
  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
    throw new ApiError(body.error ?? `HTTP ${res.status}`, undefined, body.code, body as Record<string, unknown>)
  }
  await readSSE(res.body, e => onEvent(e as ChatEvent))
}
