import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const NOW = new Date().toISOString()

const mockRow = {
  id: 'p-1',
  user_id: 'user-123',
  goal: 'Voltar a correr 5km sem dor no joelho',
  level: 'intermediario',
  training_time: '3 anos',
  time_off: null,
  current_injury: 'Dor leve no ombro direito',
  updated_at: NOW,
}

const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockRow, error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: mockRow, error: null })
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelectAfterUpsert = vi.fn(() => ({ single: mockSingle }))
const mockUpsert = vi.fn((_payload: Record<string, unknown>) => ({ select: mockSelectAfterUpsert }))
const mockFrom = vi.fn((_table: string) => ({
  select: vi.fn(() => ({ eq: mockEq })),
  upsert: mockUpsert,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: mockFrom,
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { profileRoutes } = await import('../routes/profile')
  await app.register(profileRoutes)
  return app
}

describe('GET /api/profile', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    mockMaybeSingle.mockResolvedValue({ data: mockRow, error: null })
    app = await buildApp()
  })

  it('returns 401 without Bearer token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/profile' })
    expect(res.statusCode).toBe(401)
  })

  it('returns the profile mapped to camelCase', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/profile',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.profile).toMatchObject({
      goal: mockRow.goal,
      level: mockRow.level,
      trainingTime: mockRow.training_time,
      timeOff: mockRow.time_off,
      currentInjury: mockRow.current_injury,
    })
  })

  it('returns { profile: null } when the user never filled the profile', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const res = await app.inject({
      method: 'GET',
      url: '/api/profile',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ profile: null })
  })
})

describe('POST /api/profile', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    mockSingle.mockResolvedValue({ data: mockRow, error: null })
    app = await buildApp()
  })

  it('returns 401 without Bearer token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/profile', payload: {} })
    expect(res.statusCode).toBe(401)
  })

  it('upserts only the fields sent, merging with the existing row (FR-011)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { goal: 'Hipertrofia', level: 'avancado' },
    })
    expect(res.statusCode).toBe(200)
    const upsertPayload = mockUpsert.mock.calls[0][0]
    expect(upsertPayload).toMatchObject({ user_id: 'user-123', goal: 'Hipertrofia', level: 'avancado' })
    expect(upsertPayload).not.toHaveProperty('training_time')
    expect(upsertPayload).not.toHaveProperty('time_off')
    expect(upsertPayload).not.toHaveProperty('current_injury')
  })

  it('allows sending an empty string to clear a field (FR-011)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { timeOff: '' },
    })
    expect(res.statusCode).toBe(200)
    const upsertPayload = mockUpsert.mock.calls[0][0]
    expect(upsertPayload).toMatchObject({ time_off: '' })
  })

  it('returns the profile shape reflecting the state after the upsert', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { goal: 'Hipertrofia' },
    })
    const body = res.json()
    expect(body).toHaveProperty('profile')
    expect(body.profile).toHaveProperty('updatedAt')
  })

  it('024: aceita e devolve o objetivo estruturado', async () => {
    mockSingle.mockResolvedValueOnce({ data: { ...mockRow, goal_primary: 'corrida', goal_secondary: 'condicionamento', goal_target: '5 km sem dor', cardio_likes: ['bike'], cardio_avoid: ['corrida'] }, error: null })
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { goalPrimary: 'corrida', goalSecondary: 'condicionamento', goalTarget: '5 km sem dor', cardioLikes: ['bike'], cardioAvoid: ['corrida'] },
    })
    expect(res.statusCode).toBe(200)
    expect(mockUpsert.mock.calls[0][0]).toMatchObject({ goal_primary: 'corrida', goal_secondary: 'condicionamento', goal_target: '5 km sem dor', cardio_likes: ['bike'], cardio_avoid: ['corrida'] })
    expect(res.json().profile).toMatchObject({ goalPrimary: 'corrida', goalSecondary: 'condicionamento', goalTarget: '5 km sem dor', cardioLikes: ['bike'], cardioAvoid: ['corrida'] })
  })

  it('024: objetivo fora da lista, secundário igual ao principal e cardio fora do catálogo → 400', async () => {
    const post = (payload: Record<string, unknown>) => app.inject({ method: 'POST', url: '/api/profile', headers: { Authorization: 'Bearer valid-token' }, payload })
    expect((await post({ goalPrimary: 'ficar-forte' })).statusCode).toBe(400)
    expect((await post({ goalPrimary: 'forca', goalSecondary: 'forca' })).statusCode).toBe(400)
    expect((await post({ cardioLikes: ['pular-corda'] })).statusCode).toBe(400)
    expect((await post({ cardioLikes: ['bike'], cardioAvoid: ['bike'] })).statusCode).toBe(400)
  })

  it('returns 400 when level is outside the enum', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { level: 'expert' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when a text field exceeds the max length', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { goal: 'x'.repeat(301) },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('US3 — updating the profile does not touch mesocycle_plans', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    mockSingle.mockResolvedValue({ data: mockRow, error: null })
    app = await buildApp()
  })

  it('POST /api/profile never touches the mesocycle_plans table', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/profile',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { goal: 'Hipertrofia' },
    })
    const calledTables = mockFrom.mock.calls.map((c) => c[0])
    expect(calledTables).not.toContain('mesocycle_plans')
    expect(calledTables.every((t) => t === 'user_training_profile')).toBe(true)
  })
})

describe('spec 018 — altura, data de nascimento e sexo no perfil', () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  const auth = { Authorization: 'Bearer valid-token' }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    const row = { ...mockRow, height_cm: 178, birth_date: '1990-05-10', sex: 'masculino' }
    mockSingle.mockResolvedValue({ data: row, error: null })
    mockMaybeSingle.mockResolvedValue({ data: row, error: null })
    app = await buildApp()
  })

  it('POST grava height_cm, birth_date e sex', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/profile', headers: auth, payload: { heightCm: 178, birthDate: '1990-05-10', sex: 'masculino' } })
    expect(res.statusCode).toBe(200)
    expect(mockUpsert.mock.calls[0][0]).toMatchObject({ height_cm: 178, birth_date: '1990-05-10', sex: 'masculino' })
    expect(res.json().profile).toMatchObject({ heightCm: 178, birthDate: '1990-05-10', sex: 'masculino' })
  })

  it('GET devolve os três campos', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/profile', headers: auth })
    expect(res.json().profile).toMatchObject({ heightCm: 178, birthDate: '1990-05-10', sex: 'masculino' })
  })

  it.each([
    [{ heightCm: 119 }],
    [{ heightCm: 231 }],
    [{ birthDate: '10/05/1990' }],
    [{ birthDate: '2020-01-01' }],
    [{ birthDate: '1900-01-01' }],
    [{ sex: 'outro' }],
  ])('400 para valor fora da regra: %o', async (payload) => {
    const res = await app.inject({ method: 'POST', url: '/api/profile', headers: auth, payload })
    expect(res.statusCode).toBe(400)
  })
})
