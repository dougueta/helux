import { describe, it, expect, beforeEach } from 'vitest'
import { foodById } from '@helux/nutrition'
import { EXERCISE_BANK } from '../../../../../packages/ai/src/exercise-bank'
import { createMockRouter } from '@/mocks/mock-router'
import { createMockStore } from '@/mocks/mock-store'
import { registerMockRoutes } from '@/mocks/routes'
import { datasetForPersona, PERSONAS } from '@/mocks/fixtures/personas'
import { MESOCYCLE_SESSIONS } from '@/mocks/fixtures/workouts.fixture'
import genera from '@/mocks/fixtures/genera.fixture.json'

const BANK = new Set(EXERCISE_BANK.map(e => e.name))

/** GETs usados pelos services e páginas (lista da T010). */
const READS = [
  '/workout/latest-plan',
  '/api/workouts/history?limit=5',
  '/api/workouts/analytics',
  '/api/tiredness-today',
  '/api/recovery/latest',
  '/api/profile',
  '/api/checkins?limit=2',
  '/genetic-profile',
  '/api/nutrition/phase',
  '/api/nutrition/today',
  '/api/nutrition/history?limit=14',
  '/api/nutrition/genetic-profile',
  // Spec 024
  '/api/conditions',
  '/api/onboarding',
]

function routerFor(personaId: string) {
  const store = createMockStore({ factory: datasetForPersona, getPersonaId: () => personaId })
  const router = createMockRouter(store)
  registerMockRoutes(router)
  return router
}

describe('fixtures da persona padrão (021 T011)', () => {
  beforeEach(() => localStorage.clear())
  const d = datasetForPersona('standard-athlete')

  it('todo exercício do mesociclo existe no banco de exercícios', () => {
    const names = MESOCYCLE_SESSIONS.flatMap(s => s.exercises.map(e => e.name))
    expect(names.filter(n => !BANK.has(n))).toEqual([])
  })

  it('histórico: 12 sessões nos últimos 30 dias, exercícios do banco', () => {
    expect(d.workoutHistory).toHaveLength(12)
    const oldest = Date.now() - 31 * 24 * 60 * 60 * 1000
    for (const s of d.workoutHistory) {
      expect(Date.parse(s.date)).toBeGreaterThan(oldest)
      for (const e of s.exercises) expect(BANK.has(e.name)).toBe(true)
    }
    expect(d.workoutAnalytics.totalSessions).toBe(12)
  })

  it('genera.fixture.json é sintético: só fit, nutri e painel esportivo, sem dados pessoais (024)', () => {
    expect(genera.metadata.nome).toBe('Persona de demonstração')
    for (const key of ['ancestralidade', 'doencas_geneticas', 'farma', 'skin', 'aging', 'you']) expect(genera).not.toHaveProperty(key)
  })

  it('plano do dia sem lactose (MCM6 G,G) e com a genética ativa', async () => {
    const today = (await routerFor('standard-athlete').dispatch('/api/nutrition/today')) as {
      status: string
      plan: { meals: { items: { foodId: string }[] }[]; genetics: { active: boolean } }
    }
    expect(today.status).toBe('ok')
    expect(today.plan.genetics.active).toBe(true)
    const items = today.plan.meals.flatMap(m => m.items)
    expect(items.length).toBeGreaterThan(0)
    expect(items.filter(i => foodById(i.foodId)?.tags.includes('contem-lactose'))).toEqual([])
  })

  it('todas as leituras respondem em mock', async () => {
    const router = routerFor('standard-athlete')
    for (const path of READS) await expect(router.dispatch(path), path).resolves.toBeDefined()
  })
})

describe('personas', () => {
  beforeEach(() => localStorage.clear())

  it('cada persona monta um dataset novo e completo', () => {
    for (const p of PERSONAS) {
      const a = p.build()
      expect(a.nutrition, p.id).toBeDefined()
      expect(p.build()).not.toBe(a)
    }
  })
})
