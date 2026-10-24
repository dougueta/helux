import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import type { MesocycleSession } from '@helux/types'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

// Spec 024 T035/T037 — regenerar o mesociclo, repetir a última semana e o fim do gerador legado.

let fake: FakeSupabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async (token: string) =>
        token === 'valid-token' ? { data: { user: { id: 'u1' } }, error: null } : { data: { user: null }, error: new Error('bad') },
      ),
    },
    from: (t: string) => fake.client.from(t),
  }),
}))

const getActiveMesocycleMock = vi.fn()
vi.mock('../services/mesocycle.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/mesocycle.service')>()
  return { ...actual, getActiveMesocycle: (...a: unknown[]) => getActiveMesocycleMock(...a) }
})

const generateMock = vi.fn().mockResolvedValue(undefined)
vi.mock('../services/plan-generation.service', () => ({ generateAndSaveMesocycle: (...a: unknown[]) => generateMock(...a) }))

const statusMock = vi.fn()
const markGeneratingMock = vi.fn()
vi.mock('../services/generation-status.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/generation-status.service')>()
  return { ...actual, getGenerationStatus: (...a: unknown[]) => statusMock(...a), markGenerating: (...a: unknown[]) => markGeneratingMock(...a) }
})

const onboardingMock = vi.fn()
vi.mock('../services/onboarding.service', () => ({ isOnboardingComplete: (...a: unknown[]) => onboardingMock(...a) }))

class BudgetExceededError extends Error {}
const assertBudgetMock = vi.fn()
vi.mock('../services/ai-budget.service', () => ({ assertBudget: (...a: unknown[]) => assertBudgetMock(...a), BudgetExceededError }))

const session = (letter: string, completedAt: string | null, week?: number): MesocycleSession => ({
  letter,
  focus: `Foco ${letter}`,
  completedAt,
  exercises: [{ name: 'Supino Reto (Barra)', sets: 3, reps: '8', weight: '60kg' }],
  ...(week ? { week, kind: 'forca' as const } : {}),
})

async function buildApp() {
  const app = Fastify()
  const { mesocycleActionsRoutes } = await import('../routes/mesocycle-actions')
  await app.register(mesocycleActionsRoutes)
  return app
}

const AUTH = { Authorization: 'Bearer valid-token' }

describe('mesocycle actions (024)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    fake = fakeSupabase({ mesocycle_plans: [] })
    statusMock.mockResolvedValue(null)
    onboardingMock.mockResolvedValue(true)
    assertBudgetMock.mockResolvedValue({ warning: null })
    getActiveMesocycleMock.mockResolvedValue(null)
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  describe('POST /workout/mesocycle/regenerate', () => {
    it('401 sem token', async () => {
      expect((await app.inject({ method: 'POST', url: '/workout/mesocycle/regenerate' })).statusCode).toBe(401)
    })

    it('202: marca gerando e dispara a geração com o ciclo atual como base', async () => {
      const row = { id: 'm1', generated_at: '2026-10-01T10:00:00Z', days_per_week: 2, split_type: 'AB', rationale: '', sessions: [session('A', null)] }
      getActiveMesocycleMock.mockResolvedValue(row)
      const res = await app.inject({ method: 'POST', url: '/workout/mesocycle/regenerate', headers: AUTH })
      expect(res.statusCode).toBe(202)
      expect(res.json()).toEqual({ status: 'gerando' })
      expect(markGeneratingMock).toHaveBeenCalledWith('u1', expect.anything())
      expect(generateMock).toHaveBeenCalledWith('u1', 'valid-token', expect.anything(), expect.anything(), { generated_at: row.generated_at, sessions: row.sessions })
    })

    it('409 already-generating quando já está gerando', async () => {
      statusMock.mockResolvedValue({ status: 'gerando', attempts: 0, errorCode: null, startedAt: new Date().toISOString() })
      const res = await app.inject({ method: 'POST', url: '/workout/mesocycle/regenerate', headers: AUTH })
      expect(res.statusCode).toBe(409)
      expect(res.json()).toMatchObject({ code: 'already-generating' })
      expect(generateMock).not.toHaveBeenCalled()
    })

    it('409 onboarding-required sem onboarding (FR-001)', async () => {
      onboardingMock.mockResolvedValue(false)
      const res = await app.inject({ method: 'POST', url: '/workout/mesocycle/regenerate', headers: AUTH })
      expect(res.statusCode).toBe(409)
      expect(res.json()).toMatchObject({ code: 'onboarding-required' })
      expect(generateMock).not.toHaveBeenCalled()
    })

    it('402 budget-exceeded no teto de IA', async () => {
      assertBudgetMock.mockRejectedValue(new BudgetExceededError('teto'))
      const res = await app.inject({ method: 'POST', url: '/workout/mesocycle/regenerate', headers: AUTH })
      expect(res.statusCode).toBe(402)
      expect(res.json()).toMatchObject({ code: 'budget-exceeded' })
    })
  })

  describe('POST /workout/mesocycle/repeat-week', () => {
    it('409 no-completed-cycle sem ciclo concluído', async () => {
      getActiveMesocycleMock.mockResolvedValue({ id: 'm1', generated_at: '', days_per_week: 2, split_type: 'AB', rationale: '', sessions: [session('A', null)] })
      const res = await app.inject({ method: 'POST', url: '/workout/mesocycle/repeat-week', headers: AUTH })
      expect(res.statusCode).toBe(409)
      expect(res.json()).toMatchObject({ code: 'no-completed-cycle' })
    })

    it('201: copia a última semana do ciclo concluído, sem conclusões', async () => {
      getActiveMesocycleMock.mockResolvedValue({
        id: 'm1', generated_at: '2026-09-01T10:00:00Z', days_per_week: 2, split_type: 'Superior/Inferior', rationale: '',
        sessions: [session('A', '2026-09-02', 1), session('B', '2026-09-04', 1), session('A', '2026-09-09', 2), session('B', '2026-09-11', 2)],
      })
      const res = await app.inject({ method: 'POST', url: '/workout/mesocycle/repeat-week', headers: AUTH })
      expect(res.statusCode).toBe(201)
      expect(res.json()).toEqual({ mesocycleId: expect.any(String) })
      const saved = fake.db.mesocycle_plans[0] as { user_id: string; sessions: MesocycleSession[]; split_type: string }
      expect(saved.user_id).toBe('u1')
      expect(saved.split_type).toBe('Superior/Inferior')
      expect(saved.sessions.map(s => [s.letter, s.week, s.completedAt])).toEqual([['A', 1, null], ['B', 1, null]])
    })
  })

  describe('GET /workout/mesocycle/:id/analysis (024 T104)', () => {
    const SUMMARY = { mesocycleId: 'm1', weeks: 4, findings: [{ kind: 'estagnacao', subject: 'Agachamento Livre (Barra)', evidence: 'x' }] }

    it('401 sem token', async () => {
      expect((await app.inject({ method: 'GET', url: '/workout/mesocycle/m2/analysis' })).statusCode).toBe(401)
    })

    it('devolve a análise do ciclo anterior e o que mudou (decisões "ciclo" do novo)', async () => {
      fake.db.cycle_analyses = [{ id: 'a1', user_id: 'u1', mesocycle_id: 'm1', next_mesocycle_id: 'm2', summary: SUMMARY }]
      fake.db.mesocycle_plans = [{
        id: 'm2', user_id: 'u1',
        rationale_decisions: [
          { topic: 'ciclo', choice: 'Troca do agachamento pelo hack', sources: ['historico'], reason: 'estagnou' },
          { topic: 'divisao', choice: 'Superior/Inferior', sources: ['preferencias'], reason: '4 dias' },
        ],
      }]
      const res = await app.inject({ method: 'GET', url: '/workout/mesocycle/m2/analysis', headers: AUTH })
      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ summary: SUMMARY, changes: [expect.objectContaining({ topic: 'ciclo', choice: 'Troca do agachamento pelo hack' })] })
    })

    it('404 sem análise (ou de outro usuário)', async () => {
      fake.db.cycle_analyses = [{ id: 'a1', user_id: 'u2', mesocycle_id: 'm1', next_mesocycle_id: 'm2', summary: SUMMARY }]
      expect((await app.inject({ method: 'GET', url: '/workout/mesocycle/m2/analysis', headers: AUTH })).statusCode).toBe(404)
    })
  })

  it('POST /workout/generate (gerador legado sem login) não existe mais', async () => {
    const { buildApp: buildFull } = await import('../app')
    const full = buildFull()
    const res = await full.inject({ method: 'POST', url: '/workout/generate', payload: {} })
    expect(res.statusCode).toBe(404)
    await full.close()
  })
})
