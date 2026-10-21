import { describe, it, expect, beforeEach } from 'vitest'
import { createMockRouter } from '@/mocks/mock-router'
import { createMockStore } from '@/mocks/mock-store'
import { registerMockRoutes } from '@/mocks/routes'
import { datasetForPersona } from '@/mocks/fixtures/personas'
import { setDataSource } from '@/lib/data-source'
import { resetBrowserMock } from '@/mocks/runtime'
import { mockChatResponse } from '@/mocks/agents-chat'
import { readSSE } from '@/lib/sse'

function runtime(persona = 'standard-athlete') {
  const store = createMockStore({ factory: datasetForPersona, getPersonaId: () => persona })
  const router = createMockRouter(store)
  registerMockRoutes(router)
  return { store, router }
}
const json = (method: string, body?: unknown) => ({ method, ...(body ? { body: JSON.stringify(body) } : {}) })

async function chat(channel: string, message: string) {
  const res = await mockChatResponse(JSON.stringify({ channel, message }))
  const events: { event: string; data: Record<string, unknown> }[] = []
  await readSSE(res.body!, e => events.push(e as never))
  return events
}

describe('modo mock da 022 (T034, R12)', () => {
  beforeEach(() => {
    localStorage.clear()
    resetBrowserMock()
  })

  it('Perfil Integrado com as 12 fontes, teto e liga/desliga', async () => {
    const { router } = runtime()
    const profile = (await router.dispatch('/api/agents/profile')) as { sources: Record<string, { status: string }>; budget: { capUsd: number } }
    expect(Object.keys(profile.sources)).toHaveLength(12)
    expect(profile.sources.genetica.status).toBe('ativa')
    expect(profile.sources.exames.status).toBe('vazia')
    expect(profile.budget.capUsd).toBe(20)
    await router.dispatch('/api/agents/sources/genetica', json('PUT', { enabled: false }))
    expect(((await router.dispatch('/api/agents/profile')) as typeof profile).sources.genetica.status).toBe('desativada')
    expect(await router.dispatch('/api/agents/budget', json('PUT', { monthlyCapUsd: 40 }))).toMatchObject({ capUsd: 40 })
  })

  it('preferências e catálogo', async () => {
    const { router } = runtime()
    const empty = (await router.dispatch('/api/training-preferences')) as { availableDays: number[] }
    expect(empty.availableDays).toEqual([])
    const saved = (await router.dispatch('/api/training-preferences', json('PUT', { ...empty, availableDays: [1, 3], availableEquipment: ['halteres'] }))) as { preferences: { availableDays: number[] }; appliesFrom: string }
    expect(saved.preferences.availableDays).toEqual([1, 3])
    const { exercises } = (await router.dispatch('/api/exercises')) as { exercises: { id: string; name: string }[] }
    expect(exercises.length).toBeGreaterThan(0)
  })

  it('ajuste do dia: proposta pendente e aceite aplica no plano', async () => {
    const { router } = runtime()
    const { proposal } = (await router.dispatch('/api/workout/adjust', json('POST', { request: 'só 30 min' }))) as { proposal: { id: string; changes: unknown[] } }
    expect(proposal.changes.length).toBeGreaterThan(0)
    await router.dispatch(`/api/workout/proposals/${proposal.id}/accept`, json('POST'))
    const plan = (await router.dispatch('/workout/latest-plan')) as { today: { exercises: unknown[] } }
    expect(plan.today.exercises.length).toBeLessThan(4)
  })

  it('edição manual: alternativas e troca', async () => {
    const { router } = runtime()
    const { alternatives } = (await router.dispatch('/api/workout/sessions/1/exercises/0/alternatives')) as { alternatives: { exerciseId: string; name: string }[] }
    expect(alternatives.length).toBeGreaterThan(0)
    await router.dispatch('/api/workout/sessions/1/exercises/0', json('PATCH', { exerciseId: alternatives[0].exerciseId }))
    const plan = (await router.dispatch('/workout/latest-plan')) as { today: { exercises: { name: string }[] } }
    expect(plan.today.exercises[0].name).toBe(alternatives[0].name)
  })

  it('chat simulado: SSE com relato e orientação na Medicina, grava a conversa; aceitar ativa a restrição', async () => {
    setDataSource('mock')
    const events = await chat('medicina', 'dor no ombro ao fazer supino')
    expect(events.map(e => e.event)).toEqual(expect.arrayContaining(['start', 'delta', 'fact', 'proposal', 'done']))
    const { router } = (await import('@/mocks/runtime')).getBrowserMock()
    const conv = (await router.dispatch('/api/agents/conversations/medicina')) as { messages: { role: string }[] }
    expect(conv.messages.map(m => m.role)).toEqual(['user', 'agent'])
    const guidance = events.find(e => e.event === 'proposal')!.data.guidance as { id: string }
    await router.dispatch(`/api/agents/guidance/${guidance.id}/accept`, json('POST'))
    const profile = (await router.dispatch('/api/agents/profile')) as { sources: Record<string, { status: string; summary: string }> }
    expect(profile.sources.restricoes.status).toBe('ativa')
    expect(profile.sources.relatos.summary).toMatch(/ombro/)
  })

  it('chat Equipe: routed antes do texto', async () => {
    setDataSource('mock')
    const events = await chat('equipe', 'o que comer antes do treino?')
    expect(events[1]).toMatchObject({ event: 'routed', data: { agent: 'nutricao' } })
  })
})
