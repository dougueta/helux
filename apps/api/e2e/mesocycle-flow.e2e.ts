/**
 * Verificação de ponta a ponta do fluxo de mesociclo (spec 017, roteiro do
 * quickstart da spec 006): API real (buildApp) + Supabase local (auth real,
 * RLS) + IA simulada por padrão (E2E_REAL_AI=1 usa a real).
 *
 * Os cenários compartilham um único usuário novo e rodam em ordem.
 */
import { describe, it, expect, beforeAll, afterAll, inject } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AdjustedWorkoutPlanView, PlannedExercise } from '@helux/types'
import { startFakeAnthropic, type FakeAnthropic } from './fake-anthropic'
import { resolveAiMode } from './prerequisites'

const BACKGROUND_TIMEOUT_MS = Number(process.env.E2E_BACKGROUND_TIMEOUT_MS ?? 30_000)

let app: FastifyInstance
let apiUrl: string
let fakeAi: FakeAnthropic | null = null
let admin: SupabaseClient
let userId: string
let token: string
/** Exercícios da sessão A do 1º ciclo sem ajuste — base dos asserts de ajuste. */
let baseExercises: PlannedExercise[]
let totalSessions: number

async function getPlan(): Promise<AdjustedWorkoutPlanView> {
  const res = await fetch(`${apiUrl}/workout/latest-plan`, { headers: { Authorization: `Bearer ${token}` } })
  expect(res.status, 'GET /workout/latest-plan').toBe(200)
  return (await res.json()) as AdjustedWorkoutPlanView
}

async function postSession(): Promise<void> {
  const res = await fetch(`${apiUrl}/api/workouts/sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      exercises: [{ name: 'Agachamento Livre (Barra)', sets: [{ reps: 8, weight: 60, effort: 8 }] }],
    }),
  })
  expect(res.status, 'POST /api/workouts/sessions').toBe(201)
}

async function mesocycleRows(): Promise<Array<{ id: string; sessions: Array<{ completedAt: string | null }> }>> {
  const { data, error } = await admin
    .from('mesocycle_plans')
    .select('id, sessions')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

/**
 * Espera o trabalho fire-and-forget da API chegar ao banco. `probe` devolve o
 * valor observado; `done` decide se ele já é o esperado. Em caso de timeout, a
 * falha mostra o esperado e o último valor obtido.
 */
async function waitFor<T>(expected: string, probe: () => Promise<T>, done: (value: T) => boolean): Promise<T> {
  const deadline = Date.now() + BACKGROUND_TIMEOUT_MS
  let last: T
  do {
    last = await probe()
    if (done(last)) return last
    await new Promise((r) => setTimeout(r, 250))
  } while (Date.now() < deadline)
  throw new Error(
    `[e2e] Tempo esgotado (${BACKGROUND_TIMEOUT_MS} ms)\n  esperado: ${expected}\n  obtido:   ${JSON.stringify(last)}`,
  )
}

async function setHrv(value: number | null): Promise<void> {
  const del = await admin.from('health_samples').delete().eq('user_id', userId)
  if (del.error) throw del.error
  if (value === null) return
  const now = new Date()
  const { error } = await admin.from('health_samples').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    type: 'hrv',
    value,
    unit: 'ms',
    start_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    end_at: now.toISOString(),
  })
  if (error) throw error
}

function kg(weight: string): number | null {
  const match = /^\s*(\d+(?:[.,]\d+)?)\s*kg\s*$/i.exec(weight)
  return match ? Number(match[1].replace(',', '.')) : null
}

beforeAll(async () => {
  const env = inject('localEnv')
  const aiMode = resolveAiMode(process.env)

  process.env.SUPABASE_URL = env.apiUrl
  process.env.SUPABASE_ANON_KEY = env.anonKey
  if (aiMode === 'fake') {
    fakeAi = await startFakeAnthropic()
    process.env.ANTHROPIC_BASE_URL = fakeAi.url
    process.env.ANTHROPIC_API_KEY = 'fake-key'
  }
  console.info(`[e2e] IA: ${aiMode === 'fake' ? 'simulada (determinística)' : 'REAL (E2E_REAL_AI=1)'}`)

  // As rotas leem SUPABASE_* ao registrar — importar só depois de definir o env.
  const { buildApp } = await import('../src/app')
  app = buildApp()
  await app.listen({ port: 0, host: '127.0.0.1' })
  const address = app.server.address()
  if (!address || typeof address === 'string') throw new Error('[e2e] API sem porta TCP')
  apiUrl = `http://127.0.0.1:${address.port}`

  admin = createClient(env.apiUrl, env.serviceRoleKey, { auth: { persistSession: false } })
  const anon = createClient(env.apiUrl, env.anonKey, { auth: { persistSession: false } })
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@helux.test`
  const { data, error } = await anon.auth.signUp({ email, password: `e2e-${crypto.randomUUID()}` })
  if (error || !data.session || !data.user) throw new Error(`[e2e] Falha no signup do usuário de teste: ${error?.message}`)
  userId = data.user.id
  token = data.session.access_token
})

afterAll(async () => {
  if (userId) await admin?.auth.admin.deleteUser(userId)
  await app?.close()
  await fakeAi?.close()
})

describe('Fluxo do mesociclo (quickstart 006) — ponta a ponta', () => {
  it('1. bootstrap: o primeiro acesso dispara a geração e depois devolve a 1ª sessão do ciclo', async () => {
    const first = await getPlan()
    expect(first.status).toBe('generating')
    expect(first.today).toBeNull()

    const rows = await waitFor('1 mesociclo gravado', mesocycleRows, (r) => r.length >= 1)
    expect(rows).toHaveLength(1)

    const plan = await getPlan()
    expect(plan.status).toBeUndefined()
    expect(plan.mesocycleId).toBe(rows[0].id)
    totalSessions = rows[0].sessions.length
    expect(totalSessions).toBeGreaterThan(1)
    expect(plan.progress).toEqual({ completed: 0, total: totalSessions })
    expect(plan.upcoming).toHaveLength(totalSessions - 1)
    expect(plan.today?.adjusted).toBe(false)
    baseExercises = plan.today!.exercises
    expect(baseExercises.length).toBeGreaterThan(0)
    if (fakeAi) expect(fakeAi.calls).toBe(1)
  })

  it('2a. HRV bom (75 ms): treino sem ajuste', async () => {
    await setHrv(75)
    const plan = await getPlan()
    expect(plan.today?.tiredness?.effectiveLevel).toBe('normal')
    expect(plan.today?.adjusted).toBe(false)
    expect(plan.today?.exercises).toEqual(baseExercises)
  })

  it('2b. HRV médio (50 ms): "cansado" tira uma série e mantém a carga', async () => {
    await setHrv(50)
    const plan = await getPlan()
    expect(plan.today?.tiredness?.effectiveLevel).toBe('cansado')
    plan.today!.exercises.forEach((exercise, i) => {
      const base = baseExercises[i]
      expect(exercise.sets, exercise.name).toBe(Math.max(2, base.sets - 1))
      expect(exercise.weight, exercise.name).toBe(base.weight)
    })
    if (baseExercises.some((e) => e.sets > 2)) expect(plan.today?.adjusted).toBe(true)
  })

  it('2c. HRV baixo (30 ms): "exausto" tira uma série e reduz a carga', async () => {
    await setHrv(30)
    const plan = await getPlan()
    expect(plan.today?.tiredness?.effectiveLevel).toBe('exausto')
    plan.today!.exercises.forEach((exercise, i) => {
      const base = baseExercises[i]
      expect(exercise.sets, exercise.name).toBe(Math.max(2, base.sets - 1))
      const before = kg(base.weight)
      const after = kg(exercise.weight)
      if (before !== null && before > 0) expect(after!, exercise.name).toBeLessThan(before)
    })
    expect(plan.today?.adjusted).toBe(true)
  })

  it('2d. o ajuste do dia nunca grava um mesociclo novo', async () => {
    await setHrv(null)
    expect(await mesocycleRows()).toHaveLength(1)
    if (fakeAi) expect(fakeAi.calls).toBe(1)
  })

  it('3. dias pulados sem treinar não avançam a fila', async () => {
    const [row] = await mesocycleRows()
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await admin
      .from('mesocycle_plans')
      .update({ created_at: fiveDaysAgo, generated_at: fiveDaysAgo })
      .eq('id', row.id)
    if (error) throw error

    const plan = await getPlan()
    expect(plan.mesocycleId).toBe(row.id)
    expect(plan.progress).toEqual({ completed: 0, total: totalSessions })
    expect(plan.today?.exercises).toEqual(baseExercises)
  })

  it('4. ciclo completo: cada treino avança 1 sessão e o último gera o próximo mesociclo', async () => {
    const [cycle1] = await mesocycleRows()
    const letters = (await getPlan()).upcoming.map((u) => u.letter)

    for (let done = 1; done < totalSessions; done++) {
      await postSession()
      const plan = await waitFor(
        `progresso ${done}/${totalSessions}`,
        async () => (await getPlan()).progress,
        (progress) => progress?.completed === done,
      ).then(getPlan)
      expect(plan.mesocycleId).toBe(cycle1.id)
      expect(plan.today?.letter).toBe(letters[done - 1])
      expect(await mesocycleRows()).toHaveLength(1)
      if (fakeAi) expect(fakeAi.calls).toBe(1)
    }

    await postSession()
    const rows = await waitFor('2 mesociclos (o 2º gerado ao completar o 1º)', mesocycleRows, (r) => r.length >= 2)
    expect(rows).toHaveLength(2)
    expect(rows[0].sessions.every((s) => s.completedAt !== null)).toBe(true)
    expect(rows[1].sessions.every((s) => s.completedAt === null)).toBe(true)
    if (fakeAi) expect(fakeAi.calls).toBe(2)

    const plan = await getPlan()
    expect(plan.mesocycleId).toBe(rows[1].id)
    expect(plan.progress).toEqual({ completed: 0, total: rows[1].sessions.length })
    expect(plan.today).not.toBeNull()
  })
})
