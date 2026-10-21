import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { nutritionFlags } from '@helux/nutrition'
import { fakeSupabase, type FakeSupabase } from './helpers/fake-supabase'

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

const loadNutritionContextMock = vi.fn()
vi.mock('../services/nutrition-context.service', () => ({ loadNutritionContext: loadNutritionContextMock }))

const PHASE = { id: 'phase-1', goal: 'perder_gordura', startedOn: '2026-10-01', durationWeeks: 8, status: 'ativa', baseTargets: { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 } }
const LACTOSE = { ...nutritionFlags([]), intoleranciaLactose: true, lowCarbEficaz: true }

function ctx(over: Record<string, unknown> = {}) {
  return {
    today: '2026-10-14',
    profile: { heightCm: 180, birthDate: '1991-01-10', sex: 'masculino' },
    checkins: [{ id: 'c2', weight_kg: 80, created_at: '2026-10-10T09:00:00Z' }],
    phase: PHASE,
    lastCalibration: null,
    tiredness: null,
    daysPerWeek: 4,
    workoutToday: null,
    genetics: { active: true, markers: [], flags: LACTOSE },
    missing: [],
    ...over,
  }
}

const auth = { Authorization: 'Bearer valid-token' }

async function buildApp() {
  const app = Fastify()
  const { nutritionTodayRoutes } = await import('../routes/nutrition-today')
  await app.register(nutritionTodayRoutes)
  return app
}

describe('rotas do dia (spec 018, US1)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    fake = fakeSupabase({ daily_nutrition_plans: [], workout_sessions: [] })
    loadNutritionContextMock.mockResolvedValue(ctx())
    app = await buildApp()
  })

  it('401 sem token', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/nutrition/today' })).statusCode).toBe(401)
  })

  it('GET calcula o plano do dia, grava por upsert e devolve fase, cansaço e override', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toMatchObject({ status: 'ok', missing: [], phase: PHASE, tiredness: null, dayTypeOverride: null, workoutToday: null })
    expect(body.plan).toMatchObject({ date: '2026-10-14', dayType: 'treino', targets: { kcal: 2320 } })
    expect(body.plan.meals.map((m: { slot: string }) => m.slot)).toContain('pre-treino')
    expect(fake.db.daily_nutrition_plans).toHaveLength(1)
    expect(fake.db.daily_nutrition_plans[0]).toMatchObject({ user_id: 'u1', date: '2026-10-14', phase_id: 'phase-1', day_type: 'treino', status: 'ativo' })

    await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })
    expect(fake.db.daily_nutrition_plans).toHaveLength(1)
  })

  it('exausto: o plano traz o ajuste de recuperação com a nota (US3); cansado sem nota', async () => {
    loadNutritionContextMock.mockResolvedValueOnce(ctx({ tiredness: 'exausto' }))
    const exhausted = (await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })).json()
    expect(exhausted.plan.recovery).toMatchObject({ level: 'exausto', extraWaterMl: 750 })
    expect(exhausted.plan.recovery.note).toMatch(/sistema nervoso/i)

    loadNutritionContextMock.mockResolvedValueOnce(ctx({ tiredness: 'cansado' }))
    const tired = (await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })).json()
    expect(tired.plan.recovery).toMatchObject({ level: 'cansado', note: null })
  })

  it('sem fase → no-phase; sem check-in com peso → needs-profile (sem plano)', async () => {
    loadNutritionContextMock.mockResolvedValue(ctx({ phase: null, missing: ['checkinStale'] }))
    expect((await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })).json()).toEqual({ status: 'no-phase', missing: ['checkinStale'] })

    loadNutritionContextMock.mockResolvedValue(ctx({ checkins: [], missing: ['checkinWeight'] }))
    expect((await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })).json()).toEqual({ status: 'needs-profile', missing: ['checkinWeight'] })
  })

  it('tipo do dia: sem mesociclo → descanso; treino salvo hoje força treino mesmo com override', async () => {
    loadNutritionContextMock.mockResolvedValue(ctx({ daysPerWeek: null }))
    expect((await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })).json().plan.dayType).toBe('descanso')

    fake.db.daily_nutrition_plans.push({ user_id: 'u1', date: '2026-10-14', day_type_override: 'descanso', swaps: [] })
    loadNutritionContextMock.mockResolvedValue(ctx({ workoutToday: { finishedAt: '2026-10-14T12:00:00Z' } }))
    const body = (await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })).json()
    expect(body.plan.dayType).toBe('treino')
    expect(body.workoutToday).toEqual({ finishedAt: '2026-10-14T12:00:00Z' })
  })

  it('PUT marca descanso e volta para treino', async () => {
    const rest = await app.inject({ method: 'PUT', url: '/api/nutrition/today', headers: auth, payload: { dayType: 'descanso' } })
    expect(rest.statusCode).toBe(200)
    expect(rest.json()).toMatchObject({ dayTypeOverride: 'descanso', plan: { dayType: 'descanso' } })
    expect(fake.db.daily_nutrition_plans[0]).toMatchObject({ day_type_override: 'descanso', day_type: 'descanso' })

    const back = await app.inject({ method: 'PUT', url: '/api/nutrition/today', headers: auth, payload: { dayType: 'treino' } })
    expect(back.json()).toMatchObject({ dayTypeOverride: null, plan: { dayType: 'treino' } })
    expect((await app.inject({ method: 'PUT', url: '/api/nutrition/today', headers: auth, payload: { dayType: 'x' } })).statusCode).toBe(400)
  })

  it('opções de troca do item e aplicação da troca', async () => {
    const plan = (await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })).json().plan
    const lunch = plan.meals.find((m: { slot: string }) => m.slot === 'almoco')
    const item = lunch.items[0]

    const opts = await app.inject({ method: 'GET', url: `/api/nutrition/today/swap-options?mealId=${encodeURIComponent(lunch.id)}&foodId=${item.foodId}`, headers: auth })
    expect(opts.statusCode).toBe(200)
    const options = opts.json().options
    expect(options.length).toBeGreaterThan(0)
    for (const o of options) expect(o.food.tags).not.toContain('contem-lactose')

    const swap = await app.inject({ method: 'POST', url: '/api/nutrition/today/swap', headers: auth, payload: { mealId: lunch.id, fromFoodId: item.foodId, toFoodId: options[0].food.id } })
    expect(swap.statusCode).toBe(200)
    const swapped = swap.json().plan.meals.find((m: { slot: string }) => m.slot === 'almoco')
    expect(swapped.items.map((i: { foodId: string }) => i.foodId)).toContain(options[0].food.id)
    expect(fake.db.daily_nutrition_plans[0].swaps).toEqual([{ mealId: lunch.id, fromFoodId: item.foodId, toFoodId: options[0].food.id }])
  })

  it('troca fora das opções → 400; item fora do plano → 404', async () => {
    const plan = (await app.inject({ method: 'GET', url: '/api/nutrition/today', headers: auth })).json().plan
    const lunch = plan.meals.find((m: { slot: string }) => m.slot === 'almoco')
    const bad = await app.inject({ method: 'POST', url: '/api/nutrition/today/swap', headers: auth, payload: { mealId: lunch.id, fromFoodId: lunch.items[0].foodId, toFoodId: 'leite-integral' } })
    expect(bad.statusCode).toBe(400)
    const missing = await app.inject({ method: 'GET', url: `/api/nutrition/today/swap-options?mealId=${encodeURIComponent(lunch.id)}&foodId=nao-existe`, headers: auth })
    expect(missing.statusCode).toBe(404)
  })

  it('histórico: mais recentes primeiro; treino passado sem sessão → treino-não-realizado', async () => {
    fake.db.daily_nutrition_plans.push(
      { user_id: 'u1', date: '2026-10-12', day_type: 'treino', plan: { targets: { kcal: 2320 } }, swaps: [] },
      { user_id: 'u1', date: '2026-10-13', day_type: 'treino', plan: { targets: { kcal: 2320 } }, swaps: [] },
      { user_id: 'u1', date: '2026-10-11', day_type: 'descanso', plan: { targets: { kcal: 1960 } }, swaps: [] },
    )
    fake.db.workout_sessions.push({ user_id: 'u1', date: '2026-10-13' })
    const res = await app.inject({ method: 'GET', url: '/api/nutrition/history?limit=10', headers: auth })
    expect(res.statusCode).toBe(200)
    expect(res.json().days).toEqual([
      { date: '2026-10-13', dayType: 'treino', status: 'concluido', targets: { kcal: 2320 } },
      { date: '2026-10-12', dayType: 'treino', status: 'treino-nao-realizado', targets: { kcal: 2320 } },
      { date: '2026-10-11', dayType: 'descanso', status: 'concluido', targets: { kcal: 1960 } },
    ])
  })
})
