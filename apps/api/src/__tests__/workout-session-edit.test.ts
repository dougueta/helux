import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'
import { EMPTY_HARD_CONSTRAINTS, type HardConstraints } from '@helux/types'

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

const NONE: HardConstraints = EMPTY_HARD_CONSTRAINTS
let constraints = NONE
const buildIntegratedProfileMock = vi.fn()
vi.mock('../services/integrated-profile.service', () => ({ buildIntegratedProfile: (...a: unknown[]) => buildIntegratedProfileMock(...a) }))

const SESSIONS = [
  { letter: 'A', focus: 'Peito', completedAt: '2026-10-18T10:00:00Z', exercises: [{ name: 'Supino Reto (Barra)', sets: 4, reps: '8', weight: '80 kg' }] },
  {
    letter: 'B',
    focus: 'Peito e ombro',
    completedAt: null,
    exercises: [
      { name: 'Mobilidade de ombros', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
      { name: 'Supino Reto (Barra)', sets: 4, reps: '8', weight: '80 kg', phase: 'principal' },
    ],
  },
]
const auth = { Authorization: 'Bearer valid-token' }

async function buildApp() {
  const app = Fastify()
  const { workoutSessionEditRoutes } = await import('../routes/workout-session-edit')
  await app.register(workoutSessionEditRoutes)
  return app
}

describe('edição manual de sessão (022 T016, FR-009a)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    constraints = NONE
    fake = fakeSupabase({ mesocycle_plans: [{ id: 'm1', user_id: 'u1', sessions: structuredClone(SESSIONS) }], session_edits: [] })
    buildIntegratedProfileMock.mockImplementation(async () => ({ constraints, mesocycle: structuredClone(fake.db.mesocycle_plans[0]) }))
    app = await buildApp()
  })

  const alternatives = (s: number, e: number) => app.inject({ method: 'GET', url: `/api/workout/sessions/${s}/exercises/${e}/alternatives`, headers: auth })
  const patch = (s: number, e: number, payload: object) => app.inject({ method: 'PATCH', url: `/api/workout/sessions/${s}/exercises/${e}`, headers: auth, payload })

  it('alternativas do mesmo grupo/padrão, determinísticas', async () => {
    constraints = { ...NONE, availableEquipment: ['halteres'] }
    const res = await alternatives(1, 1)
    expect(res.statusCode).toBe(200)
    const { alternatives: list } = res.json()
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((a: { equipment: string }) => a.equipment === 'halteres')).toBe(true)
  })

  it('trocar exercício: salva, enriquece e grava a edição', async () => {
    const res = await patch(1, 1, { exerciseId: 'supino-reto-halteres' })
    expect(res.statusCode).toBe(200)
    const saved = (fake.db.mesocycle_plans[0].sessions as any[])[1].exercises[1]
    expect(saved).toMatchObject({ name: 'Supino Reto (Halteres)', sets: 4, reps: '8', weight: '80 kg', phase: 'principal' })
    expect(saved.cues.length).toBeGreaterThan(0)
    expect(fake.db.session_edits[0]).toMatchObject({
      user_id: 'u1',
      mesocycle_id: 'm1',
      session_index: 1,
      exercise_index: 1,
      kind: 'troca-exercicio',
      before: { exercise: 'Supino Reto (Barra)' },
      after: { exercise: 'Supino Reto (Halteres)' },
      safety_override: false,
    })
    expect(res.json().session.exercises[1].name).toBe('Supino Reto (Halteres)')
  })

  it('séries/reps/carga', async () => {
    const res = await patch(1, 1, { sets: 3, reps: '10', load: '70 kg' })
    expect(res.statusCode).toBe(200)
    expect((fake.db.mesocycle_plans[0].sessions as any[])[1].exercises[1]).toMatchObject({ sets: 3, reps: '10', weight: '70 kg' })
    expect(fake.db.session_edits[0]).toMatchObject({ kind: 'series-reps-carga', before: { sets: 4, reps: '8', load: '80 kg' }, after: { sets: 3, reps: '10', load: '70 kg' } })
  })

  it('violação de segurança: 409 com o motivo; confirmando, salva com override', async () => {
    constraints = { ...NONE, blockedPatterns: ['empurrar-horizontal'] }
    const warn = await patch(1, 1, { exerciseId: 'supino-reto-halteres' })
    expect(warn.statusCode).toBe(409)
    expect(warn.json()).toMatchObject({ code: 'safety-warning' })
    expect(warn.json().reasons[0]).toMatch(/restrição de segurança/)
    expect(fake.db.session_edits).toHaveLength(0)

    const ok = await patch(1, 1, { exerciseId: 'supino-reto-halteres', confirmSafetyOverride: true })
    expect(ok.statusCode).toBe(200)
    expect(fake.db.session_edits[0].safety_override).toBe(true)
  })

  it('sessão concluída → 409 session-completed; exercício fora das alternativas → 400; índices inválidos → 404', async () => {
    expect((await patch(0, 0, { sets: 3 })).json().code).toBe('session-completed')
    expect((await patch(1, 1, { exerciseId: 'agachamento-livre-barra' })).statusCode).toBe(400)
    expect((await patch(1, 9, { sets: 3 })).statusCode).toBe(404)
    expect((await patch(1, 0, { exerciseId: 'supino-reto-halteres' })).statusCode).toBe(400)
  })
})
