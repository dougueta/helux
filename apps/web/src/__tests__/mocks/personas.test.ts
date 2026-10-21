import { describe, it, expect, beforeEach } from 'vitest'
import { createMockRouter } from '@/mocks/mock-router'
import { createMockStore } from '@/mocks/mock-store'
import { registerMockRoutes } from '@/mocks/routes'
import { datasetForPersona, PERSONAS } from '@/mocks/fixtures/personas'

function routerFor(persona: string) {
  const store = createMockStore({ factory: datasetForPersona, getPersonaId: () => persona })
  const router = createMockRouter(store)
  registerMockRoutes(router)
  return { store, router }
}

describe('personas de teste (021 T016)', () => {
  beforeEach(() => localStorage.clear())

  it('catálogo com as 5 personas', () => {
    expect(PERSONAS.map(p => p.id)).toEqual(['standard-athlete', 'rest-day-athlete', 'exhausted-athlete', 'zero-state', 'network-error'])
  })

  it('id desconhecido cai no atleta padrão', () => {
    expect(datasetForPersona('xpto').profile).toEqual(datasetForPersona('standard-athlete').profile)
  })

  it('dia de descanso: sem treino hoje e nutrição em descanso', async () => {
    const { router } = routerFor('rest-day-athlete')
    expect(((await router.dispatch('/workout/latest-plan')) as { today: unknown }).today).toBeNull()
    expect(((await router.dispatch('/api/nutrition/today')) as { plan: { dayType: string } }).plan.dayType).toBe('descanso')
  })

  it('fadiga extrema: treino ajustado e card de recuperação com nota', async () => {
    const { router } = routerFor('exhausted-athlete')
    expect(((await router.dispatch('/api/tiredness-today')) as { effectiveLevel: string }).effectiveLevel).toBe('exausto')
    expect(((await router.dispatch('/workout/latest-plan')) as { today: { adjusted: boolean } }).today.adjusted).toBe(true)
    const day = (await router.dispatch('/api/nutrition/today')) as { plan: { recovery: { level: string; note: string | null } } }
    expect(day.plan.recovery).toMatchObject({ level: 'exausto' })
  })

  it('zero-state: telas vazias / primeiro acesso', async () => {
    const { router } = routerFor('zero-state')
    expect(await router.dispatch('/workout/latest-plan')).toMatchObject({ today: null, status: 'generating' })
    expect(await router.dispatch('/api/workouts/history')).toEqual({ sessions: [], total: 0 })
    expect(await router.dispatch('/api/profile')).toEqual({ profile: null })
    expect(await router.dispatch('/api/checkins')).toEqual({ checkins: [] })
    expect(await router.dispatch('/api/nutrition/today')).toMatchObject({ status: 'no-phase' })
    await expect(router.dispatch('/genetic-profile')).rejects.toThrow('HTTP 404')
    expect(await router.dispatch('/api/nutrition/genetic-profile')).toEqual({ active: false, markers: [] })
  })

  it('erro de comunicação: toda leitura falha com 503', async () => {
    const { router } = routerFor('network-error')
    for (const path of ['/workout/latest-plan', '/api/profile', '/api/nutrition/today']) {
      await expect(router.dispatch(path)).rejects.toThrow('HTTP 503')
    }
  })

  it('loadPersona troca o dataset e o reset volta à persona escolhida', () => {
    const { store } = routerFor('standard-athlete')
    expect(store.loadPersona('zero-state').profile).toBeNull()
    expect(store.reset().profile).toBeNull()
  })
})
