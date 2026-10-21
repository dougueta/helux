import {
  SOURCE_KEYS,
  type AgentMessage,
  type Channel,
  type ConversationFact,
  type IntegratedProfile,
  type PlannedExercise,
  type SharedGuidance,
  type SourceKey,
  type TrainingPreferences,
  type WorkoutAdjustmentProposal,
} from '@helux/types'
import { ApiError } from '@/services/api-client'
import type { MockRouter } from './mock-router'
import type { MockDataset } from './types'

// Spec 022 no modo mock (021, R12): Perfil Integrado, preferências, propostas,
// edição manual e conversas guardados no mesmo dataset local da persona.

export interface MockAgents {
  preferences: TrainingPreferences
  disabled: SourceKey[]
  capUsd: number
  spentUsd: number
  facts: ConversationFact[]
  guidance: SharedGuidance[]
  conversations: Partial<Record<Channel, AgentMessage[]>>
  proposals: WorkoutAdjustmentProposal[]
}

const EMPTY_PREFERENCES: TrainingPreferences = {
  availableDays: [],
  maxSessionMinutes: null,
  location: null,
  availableEquipment: [],
  favoriteExercises: [],
  exercisesToAvoid: [],
  priorityMuscleGroups: [],
  trainingStyle: null,
  freeInstructions: null,
  updatedAt: null,
}

export function defaultAgents(): MockAgents {
  return { preferences: EMPTY_PREFERENCES, disabled: [], capUsd: 20, spentUsd: 3.42, facts: [], guidance: [], conversations: {}, proposals: [] }
}

/** Estado da 022 (datasets salvos antes da 022 não têm). */
export const agentsOf = (d: MockDataset): MockAgents => d.agents ?? defaultAgents()

/** Catálogo enxuto para os seletores e as alternativas no modo mock. */
export const MOCK_CATALOG = [
  { id: 'supino-reto-barra', name: 'Supino Reto (Barra)', muscleGroup: 'peito', equipment: 'barra', pattern: 'empurrar-horizontal' },
  { id: 'supino-reto-halteres', name: 'Supino Reto (Halteres)', muscleGroup: 'peito', equipment: 'halteres', pattern: 'empurrar-horizontal' },
  { id: 'supino-inclinado-halteres', name: 'Supino Inclinado (Halteres)', muscleGroup: 'peito', equipment: 'halteres', pattern: 'empurrar-horizontal' },
  { id: 'crossover-cabo', name: 'Crossover no Cabo', muscleGroup: 'peito', equipment: 'maquina-cabo', pattern: 'isolamento' },
  { id: 'barra-fixa-corporal', name: 'Barra Fixa (Peso Corporal)', muscleGroup: 'costas', equipment: 'peso-corporal', pattern: 'puxar-vertical' },
  { id: 'puxada-alta-cabo', name: 'Puxada Alta (Cabo)', muscleGroup: 'costas', equipment: 'maquina-cabo', pattern: 'puxar-vertical' },
  { id: 'remada-curvada-barra', name: 'Remada Curvada (Barra)', muscleGroup: 'costas', equipment: 'barra', pattern: 'puxar-horizontal' },
  { id: 'remada-unilateral-halteres', name: 'Remada Unilateral (Halteres)', muscleGroup: 'costas', equipment: 'halteres', pattern: 'puxar-horizontal' },
  { id: 'agachamento-livre-barra', name: 'Agachamento Livre (Barra)', muscleGroup: 'quadriceps', equipment: 'barra', pattern: 'agachar' },
  { id: 'agachamento-goblet-halteres', name: 'Agachamento Goblet (Halteres)', muscleGroup: 'quadriceps', equipment: 'halteres', pattern: 'agachar' },
  { id: 'leg-press-45', name: 'Leg Press 45°', muscleGroup: 'quadriceps', equipment: 'maquina-cabo', pattern: 'agachar' },
  { id: 'desenvolvimento-halteres', name: 'Desenvolvimento com Halteres', muscleGroup: 'ombro', equipment: 'halteres', pattern: 'empurrar-vertical' },
  { id: 'elevacao-lateral-halteres', name: 'Elevação Lateral (Halteres)', muscleGroup: 'ombro', equipment: 'halteres', pattern: 'isolamento' },
  { id: 'rosca-direta-barra', name: 'Rosca Direta (Barra)', muscleGroup: 'biceps', equipment: 'barra', pattern: 'isolamento' },
  { id: 'rosca-direta-halteres', name: 'Rosca Direta (Halteres)', muscleGroup: 'biceps', equipment: 'halteres', pattern: 'isolamento' },
  { id: 'triceps-corda-cabo', name: 'Tríceps Corda (Cabo)', muscleGroup: 'triceps', equipment: 'maquina-cabo', pattern: 'isolamento' },
] as const

let seq = 0
export const mockId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`

function source(status: 'ativa' | 'vazia', summary: string, data: unknown, updatedAt: string | null = null) {
  return { status, updatedAt, summary: status === 'ativa' ? summary : '', data: status === 'ativa' ? data : null }
}

/** Perfil Integrado simulado a partir do dataset (mesmo formato da API). */
export function mockIntegratedProfile(d: MockDataset): IntegratedProfile & { budget: { capUsd: number; spentUsd: number; pct: number } } {
  const a = agentsOf(d)
  const activeGuidance = a.guidance.filter(g => g.status === 'ativa')
  const sources: IntegratedProfile['sources'] = {
    perfil: source(d.profile ? 'ativa' : 'vazia', `Objetivo: ${d.profile?.goal ?? '—'}\nNível: ${d.profile?.level ?? '—'}`, d.profile, d.profile?.updatedAt ?? null),
    preferencias: source(a.preferences.updatedAt ? 'ativa' : 'vazia', `Dias: ${a.preferences.availableDays.length}`, a.preferences, a.preferences.updatedAt),
    historico: source(d.workoutHistory.length ? 'ativa' : 'vazia', `${d.workoutHistory.length} sessões recentes`, d.workoutHistory, d.workoutHistory[0]?.created_at ?? null),
    mesociclo: source(d.latestPlan?.today ? 'ativa' : 'vazia', `Sessão pendente: ${d.latestPlan?.today?.letter ?? '—'}`, d.latestPlan, d.latestPlan?.generatedAt ?? null),
    cansaco: source(d.tirednessToday.effectiveLevel ? 'ativa' : 'vazia', `Cansaço de hoje: ${d.tirednessToday.effectiveLevel}`, d.tirednessToday, d.tirednessToday.date),
    checkins: source(d.bodyCheckins.length ? 'ativa' : 'vazia', `Peso ${d.bodyCheckins[0]?.weight_kg ?? '—'} kg`, d.bodyCheckins, d.bodyCheckins[0]?.created_at ?? null),
    genetica: source(d.genetics ? 'ativa' : 'vazia', `${d.genetics?.traits.length ?? 0} marcadores`, d.genetics),
    exames: source('vazia', '', null),
    nutricao: source(d.nutrition.phase ? 'ativa' : 'vazia', `Fase: ${d.nutrition.phase?.goal ?? '—'}`, d.nutrition.phase, d.nutrition.phase?.startedOn ?? null),
    relatos: source(a.facts.length ? 'ativa' : 'vazia', a.facts.map(f => `- ${f.text}`).join('\n'), a.facts, a.facts.at(-1)?.updatedAt ?? null),
    restricoes: source(activeGuidance.length ? 'ativa' : 'vazia', activeGuidance.map(g => `- ${g.text}`).join('\n'), activeGuidance, activeGuidance.at(-1)?.startsAt ?? null),
    edicoes: source('vazia', '', null),
  }
  for (const k of SOURCE_KEYS) if (a.disabled.includes(k)) sources[k] = { status: 'desativada', updatedAt: sources[k].updatedAt, summary: '', data: null }
  return { generatedAt: new Date().toISOString(), sources, budget: { capUsd: a.capUsd, spentUsd: a.spentUsd, pct: Math.round((a.spentUsd / a.capUsd) * 100) } }
}

const isMain = (e: PlannedExercise) => e.phase !== 'aquecimento' && e.phase !== 'volta-calma'

/** Rotas da 022 no roteador mock (T034). */
export function registerAgentRoutes(router: MockRouter): void {
  const save = (store: Parameters<Parameters<MockRouter['register']>[2]>[0]['store'], patch: Partial<MockAgents>) =>
    store.updateDataset(d => ({ agents: { ...agentsOf(d), ...patch } }))

  router.register('GET', '/api/agents/profile', ({ data }) => mockIntegratedProfile(data))
  router.register('PUT', '/api/agents/sources/:source', ({ data, store, params, body }) => {
    const { enabled } = body as { enabled: boolean }
    const disabled = agentsOf(data).disabled.filter(s => s !== params.source)
    save(store, { disabled: enabled ? disabled : [...disabled, params.source as SourceKey] })
    return null
  })
  router.register('PUT', '/api/agents/budget', ({ data, store, body }) => {
    const capUsd = (body as { monthlyCapUsd: number }).monthlyCapUsd
    save(store, { capUsd })
    const spent = agentsOf(data).spentUsd
    return { capUsd, spentUsd: spent, pct: Math.round((spent / capUsd) * 100) }
  })

  router.register('GET', '/api/training-preferences', ({ data }) => agentsOf(data).preferences)
  router.register('PUT', '/api/training-preferences', ({ store, body }) => {
    const preferences = { ...(body as TrainingPreferences), updatedAt: new Date().toISOString() }
    save(store, { preferences })
    return { preferences, appliesFrom: 'proximo-mesociclo', proposal: null }
  })
  router.register('GET', '/api/exercises', () => ({ exercises: MOCK_CATALOG }))

  router.register('PATCH', '/api/agents/facts/:id', ({ data, store, params, body }) => {
    const facts = agentsOf(data).facts.map(f => (f.id === params.id ? { ...f, text: (body as { text: string }).text, updatedAt: new Date().toISOString() } : f))
    save(store, { facts })
    const fact = facts.find(f => f.id === params.id)
    if (!fact) throw new ApiError('HTTP 404')
    return fact
  })
  router.register('DELETE', '/api/agents/facts/:id', ({ data, store, params }) => {
    save(store, { facts: agentsOf(data).facts.filter(f => f.id !== params.id) })
    return null
  })

  const setGuidance = (status: SharedGuidance['status']) => ({ data, store, params }: Parameters<Parameters<MockRouter['register']>[2]>[0]) => {
    const now = new Date()
    let found: SharedGuidance | undefined
    const guidance = agentsOf(data).guidance.map(g => {
      if (g.id !== params.id) return g
      found = {
        ...g,
        status,
        ...(status === 'ativa' ? { startsAt: now.toISOString(), expiresAt: g.durationDays ? new Date(now.getTime() + g.durationDays * 86400000).toISOString() : null } : {}),
      }
      return found
    })
    if (!found) throw new ApiError('HTTP 404')
    save(store, { guidance })
    return found
  }
  router.register('POST', '/api/agents/guidance/:id/accept', setGuidance('ativa'))
  router.register('POST', '/api/agents/guidance/:id/reject', setGuidance('recusada'))
  router.register('DELETE', '/api/agents/guidance/:id', (req) => (setGuidance('removida')(req), null))

  router.register('GET', '/api/agents/conversations/:channel', ({ data, params }) => {
    const messages = agentsOf(data).conversations[params.channel as Channel] ?? []
    return { conversation: messages.length ? { id: `mock-conv-${params.channel}`, channel: params.channel, startedAt: messages[0].createdAt } : null, messages }
  })
  router.register('POST', '/api/agents/conversations/:channel/new', ({ data, store, params }) => {
    save(store, { conversations: { ...agentsOf(data).conversations, [params.channel]: [] } })
    return { conversation: { id: mockId('mock-conv'), channel: params.channel, startedAt: new Date().toISOString() } }
  })

  router.register('POST', '/api/workout/adjust', ({ data, store, body }) => {
    const today = data.latestPlan?.today
    if (!today || !data.latestPlan?.progress) throw new ApiError('Não há sessão pendente no mesociclo', undefined, 'no-pending-session')
    const sessionIndex = data.latestPlan.progress.completed
    const before = { letter: today.letter, focus: today.focus, completedAt: null, exercises: today.exercises }
    const kept = today.exercises.filter(isMain).slice(0, 2).map(e => ({ ...e, sets: Math.max(2, e.sets - 1) }))
    const after = { ...before, exercises: kept }
    const proposal: WorkoutAdjustmentProposal = {
      id: mockId('mock-proposal'),
      mesocycleId: data.latestPlan.mesocycleId ?? 'mock-mesocycle-1',
      kind: 'ajuste-sessao',
      sessionIndexes: [sessionIndex],
      before: [before],
      after: [after],
      changes: today.exercises.filter(isMain).map((e, i) =>
        i < 2 ? { sessionIndex, letter: today.letter, kind: 'alterado' as const, before: `${e.name} ${e.sets}x${e.reps}`, after: `${e.name} ${Math.max(2, e.sets - 1)}x${e.reps}` } : { sessionIndex, letter: today.letter, kind: 'removido' as const, before: e.name, after: null },
      ),
      reason: `Versão enxuta para o pedido: "${(body as { request: string }).request}". Fica só o essencial, com uma série a menos.`,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    }
    save(store, { proposals: [...agentsOf(data).proposals, proposal] })
    return { proposal }
  })

  const resolveProposal = (accept: boolean) => ({ data, store, params }: Parameters<Parameters<MockRouter['register']>[2]>[0]) => {
    const proposal = agentsOf(data).proposals.find(p => p.id === params.id)
    if (!proposal) throw new ApiError('HTTP 404')
    if (proposal.status !== 'pendente') throw new ApiError('A proposta já foi resolvida', undefined, 'not-pending')
    const proposals = agentsOf(data).proposals.map(p => (p.id === params.id ? { ...p, status: accept ? ('aceita' as const) : ('recusada' as const) } : p))
    store.updateDataset(d => ({
      agents: { ...agentsOf(d), proposals },
      ...(accept && d.latestPlan?.today ? { latestPlan: { ...d.latestPlan, today: { ...d.latestPlan.today, exercises: proposal.after[0].exercises } } } : {}),
    }))
    return { status: 'ok' }
  }
  router.register('POST', '/api/workout/proposals/:id/accept', resolveProposal(true))
  router.register('POST', '/api/workout/proposals/:id/reject', resolveProposal(false))

  router.register('GET', '/api/workout/sessions/:index/exercises/:exerciseIndex/alternatives', ({ data, params }) => {
    const current = data.latestPlan?.today?.exercises[Number(params.exerciseIndex)]
    const entry = MOCK_CATALOG.find(e => e.name === current?.name)
    if (!current || !entry) throw new ApiError('HTTP 404')
    return { alternatives: MOCK_CATALOG.filter(e => e.muscleGroup === entry.muscleGroup && e.id !== entry.id).map(e => ({ exerciseId: e.id, name: e.name, equipment: e.equipment, violatesSafety: false })) }
  })
  router.register('PATCH', '/api/workout/sessions/:index/exercises/:exerciseIndex', ({ data, store, params, body }) => {
    const today = data.latestPlan?.today
    const i = Number(params.exerciseIndex)
    if (!data.latestPlan || !today?.exercises[i]) throw new ApiError('HTTP 404')
    const edit = body as { exerciseId?: string; sets?: number; reps?: string; load?: string }
    const name = MOCK_CATALOG.find(e => e.id === edit.exerciseId)?.name ?? today.exercises[i].name
    const exercises = today.exercises.map((e, k) =>
      k === i ? { ...e, name, sets: edit.sets ?? e.sets, reps: edit.reps ?? e.reps, weight: edit.load ?? e.weight } : e,
    )
    store.updateDataset(d => ({ latestPlan: { ...d.latestPlan!, today: { ...today, exercises } } }))
    return { session: { letter: today.letter, focus: today.focus, completedAt: null, exercises } }
  })
}
