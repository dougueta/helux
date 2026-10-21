import { describe, it, expect, vi, beforeEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fakeSupabase } from './helpers/fake-supabase'

vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))

const tirednessMock = vi.fn()
vi.mock('../services/tiredness.service', () => ({
  getTodayTirednessAssessment: tirednessMock,
  todaySlug: (now: Date = new Date()) => now.toISOString().slice(0, 10),
}))

const activeMesocycleMock = vi.fn()
vi.mock('../services/mesocycle.service', () => ({ getActiveMesocycle: activeMesocycleMock }))

const GENERA = {
  nutri: {
    pontos_de_atencao: [
      { caracteristica: 'Intolerância à lactose', snp: 'rs4988235', gene: 'MCM6', genotipo: 'G,G', resultado: 'Predisposição para desenvolver intolerância à lactose' },
    ],
  },
}

const NOW = new Date('2026-10-13T15:00:00Z')

const PHASE_ROW = {
  id: 'phase-1', user_id: 'u1', goal: 'perder_gordura', started_on: '2026-09-01', duration_weeks: 8, status: 'ativa',
  base_targets: { kcal: 2200, proteinG: 176, carbsG: 220, fatG: 61 }, start_checkin_id: 'c1', created_at: '2026-09-01T10:00:00Z',
}

function tables() {
  return {
    user_training_profile: [{ user_id: 'u1', height_cm: 178, birth_date: '1990-05-10', sex: 'masculino' }],
    body_checkins: [
      { id: 'c1', user_id: 'u1', month: '2026-09-01', weight_kg: 82, waist_cm: 90, neck_cm: 39, created_at: '2026-09-01T09:00:00Z' },
      { id: 'c2', user_id: 'u1', month: '2026-10-01', weight_kg: 80.5, waist_cm: 88, neck_cm: 39, created_at: '2026-10-05T09:00:00Z' },
      { id: 'cx', user_id: 'outro', month: '2026-10-01', weight_kg: 60, created_at: '2026-10-10T09:00:00Z' },
    ],
    diet_phases: [PHASE_ROW],
    diet_phase_calibrations: [
      { id: 'k1', phase_id: 'phase-1', user_id: 'u1', checkin_id: 'c1', action: 'inicial', created_at: '2026-09-01T10:00:00Z' },
    ],
    workout_sessions: [{ id: 's1', user_id: 'u1', date: '2026-10-13', created_at: '2026-10-13T11:30:00Z' }],
  }
}

describe('loadNutritionContext (spec 018)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(GENERA))
    tirednessMock.mockResolvedValue({ effectiveLevel: 'cansado' })
    activeMesocycleMock.mockResolvedValue({ id: 'm1', days_per_week: 4 })
  })

  it('junta perfil, check-ins, fase, cansaço, frequência, treino de hoje e genética', async () => {
    const { client } = fakeSupabase(tables())
    const { loadNutritionContext } = await import('../services/nutrition-context.service')

    const ctx = await loadNutritionContext('u1', client as never, NOW)

    expect(ctx.profile).toEqual({ heightCm: 178, birthDate: '1990-05-10', sex: 'masculino' })
    expect(ctx.checkins.map((c) => c.id)).toEqual(['c2', 'c1'])
    expect(ctx.phase).toMatchObject({ id: 'phase-1', goal: 'perder_gordura', startedOn: '2026-09-01', durationWeeks: 8, status: 'ativa', baseTargets: { kcal: 2200 } })
    expect(ctx.lastCalibration).toEqual({ checkinId: 'c1', createdAt: '2026-09-01T10:00:00Z' })
    expect(ctx.tiredness).toBe('cansado')
    expect(ctx.daysPerWeek).toBe(4)
    expect(ctx.workoutToday).toEqual({ finishedAt: '2026-10-13T11:30:00Z' })
    expect(ctx.genetics.active).toBe(true)
    expect(ctx.genetics.flags.intoleranciaLactose).toBe(true)
    expect(ctx.genetics.markers[0]).toMatchObject({ gene: 'MCM6', status: 'atencao' })
    expect(ctx.missing).toEqual([])
    expect(ctx.today).toBe('2026-10-13')
  })

  it('a última calibração ignora as de intervalo curto (base de comparação da próxima)', async () => {
    const t = tables()
    t.diet_phase_calibrations.push({ id: 'k2', phase_id: 'phase-1', user_id: 'u1', checkin_id: 'c2', action: 'intervalo-curto', created_at: '2026-09-10T10:00:00Z' } as never)
    const { client } = fakeSupabase(t)
    const { loadNutritionContext } = await import('../services/nutrition-context.service')
    expect((await loadNutritionContext('u1', client as never, NOW)).lastCalibration).toEqual({ checkinId: 'c1', createdAt: '2026-09-01T10:00:00Z' })
  })

  it('check-in com peso mais antigo que 35 dias → checkinStale (validação do usuário: check-in de julho virou base da fase)', async () => {
    const t = tables()
    t.body_checkins = [{ id: 'c0', user_id: 'u1', month: '2026-07-01', weight_kg: 82, created_at: '2026-07-02T23:17:51Z' }] as never
    const { client } = fakeSupabase(t)
    const { loadNutritionContext } = await import('../services/nutrition-context.service')

    const ctx = await loadNutritionContext('u1', client as never, NOW)

    expect(ctx.missing).toEqual(['checkinStale'])
    expect(ctx.checkins[0].id).toBe('c0')
  })

  it('check-in com até 35 dias vale', async () => {
    const t = tables()
    t.body_checkins = [{ id: 'c0', user_id: 'u1', month: '2026-09-01', weight_kg: 82, created_at: '2026-09-09T09:00:00Z' }] as never
    const { client } = fakeSupabase(t)
    const { loadNutritionContext } = await import('../services/nutrition-context.service')
    expect((await loadNutritionContext('u1', client as never, NOW)).missing).toEqual([])
  })

  it('lista o que falta para calcular a fase', async () => {
    const t = tables()
    t.user_training_profile = [{ user_id: 'u1', height_cm: null, birth_date: null, sex: null }] as never
    t.body_checkins = [{ id: 'c1', user_id: 'u1', month: '2026-10-01', weight_kg: null, created_at: '2026-10-01T09:00:00Z' }] as never
    const { client } = fakeSupabase(t)
    const { loadNutritionContext } = await import('../services/nutrition-context.service')

    const ctx = await loadNutritionContext('u1', client as never, NOW)

    expect(ctx.missing).toEqual(['heightCm', 'birthDate', 'sex', 'checkinWeight'])
  })

  it('sem perfil, fase, mesociclo, treino de hoje e genera.json', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    activeMesocycleMock.mockResolvedValue(null)
    tirednessMock.mockResolvedValue({ effectiveLevel: null })
    const { client } = fakeSupabase({})
    const { loadNutritionContext } = await import('../services/nutrition-context.service')

    const ctx = await loadNutritionContext('u1', client as never, NOW)

    expect(ctx.profile).toEqual({ heightCm: null, birthDate: null, sex: null })
    expect(ctx.checkins).toEqual([])
    expect(ctx.phase).toBeNull()
    expect(ctx.lastCalibration).toBeNull()
    expect(ctx.daysPerWeek).toBeNull()
    expect(ctx.workoutToday).toBeNull()
    expect(ctx.tiredness).toBeNull()
    expect(ctx.genetics).toEqual({ active: false, markers: [], flags: expect.objectContaining({ intoleranciaLactose: false }) })
    expect(ctx.missing).toEqual(['heightCm', 'birthDate', 'sex', 'checkinWeight'])
  })

  it('falha ao ler o cansaço não derruba o contexto', async () => {
    tirednessMock.mockRejectedValue(new Error('boom'))
    const { client } = fakeSupabase(tables())
    const { loadNutritionContext } = await import('../services/nutrition-context.service')
    expect((await loadNutritionContext('u1', client as never, NOW)).tiredness).toBeNull()
  })
})
