import { describe, it, expect, beforeEach } from 'vitest'
import { createMockRouter } from '@/mocks/mock-router'
import { createMockStore } from '@/mocks/mock-store'
import { registerMockRoutes } from '@/mocks/routes'
import { datasetForPersona } from '@/mocks/fixtures/personas'
import { today } from '@/mocks/fixtures/clock'

function runtime(persona = 'standard-athlete') {
  const store = createMockStore({ factory: datasetForPersona, getPersonaId: () => persona })
  const router = createMockRouter(store)
  registerMockRoutes(router)
  return { store, router }
}
const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) })
const put = (body: unknown) => ({ method: 'PUT', body: JSON.stringify(body) })

describe('escritas do modo mock (021 T014)', () => {
  beforeEach(() => localStorage.clear())

  it('concluir o treino: entra no histórico, avança o plano e persiste após recarregar', async () => {
    const { router } = runtime()
    const before = (await router.dispatch('/workout/latest-plan')) as { today: { letter: string }; progress: { completed: number } }
    expect(before.today.letter).toBe('B')
    const saved = await router.dispatch(
      '/api/workouts/sessions',
      post({ date: today(), duration_s: 3600, exercises: [{ name: 'Barra Fixa (Peso Corporal)', sets: [{ reps: 8, weight: 0, effort: 8 }] }] }),
    )
    expect(saved).toMatchObject({ date: today(), duration_s: 3600 })

    const reloaded = runtime().router // novo store sobre o mesmo localStorage (F5)
    const plan = (await reloaded.dispatch('/workout/latest-plan')) as { today: { letter: string }; progress: { completed: number } }
    expect(plan.today.letter).toBe('C')
    expect(plan.progress.completed).toBe(before.progress.completed + 1)
    const history = (await reloaded.dispatch('/api/workouts/history?limit=1')) as { sessions: { date: string }[]; total: number }
    expect(history.total).toBe(13)
    expect(history.sessions[0].date).toBe(today())
    const analytics = (await reloaded.dispatch('/api/workouts/analytics')) as { totalSessions: number }
    expect(analytics.totalSessions).toBe(13)
  })

  it('cansaço: PUT grava e reajusta o treino do dia', async () => {
    const { router } = runtime()
    const assessment = (await router.dispatch('/api/tiredness-today', put({ level: 'exausto', overrideAutomatic: true }))) as { effectiveLevel: string }
    expect(assessment.effectiveLevel).toBe('exausto')
    const plan = (await router.dispatch('/workout/latest-plan')) as { today: { adjusted: boolean } }
    expect(plan.today.adjusted).toBe(true)
  })

  it('perfil e check-in (upsert por mês)', async () => {
    const { router } = runtime()
    await router.dispatch('/api/profile', post({ goal: 'força', heightCm: 181 }))
    expect(((await router.dispatch('/api/profile')) as { profile: { goal: string; heightCm: number } }).profile).toMatchObject({ goal: 'força', heightCm: 181 })

    const month = today().slice(0, 7)
    await router.dispatch('/api/checkins', post({ month, weight_kg: 80.5 }))
    await router.dispatch('/api/checkins', post({ month, weight_kg: 80.1 }))
    const { checkins } = (await router.dispatch('/api/checkins')) as { checkins: { month: string; weight_kg: number }[] }
    expect(checkins.filter(c => c.month === month)).toHaveLength(1)
    expect(checkins[0]).toMatchObject({ month, weight_kg: 80.1 })
  })

  it('nutrição: tipo do dia, troca e fase', async () => {
    const { router } = runtime()
    const rest = (await router.dispatch('/api/nutrition/today', put({ dayType: 'descanso' }))) as { plan: { dayType: string }; dayTypeOverride: string }
    expect(rest).toMatchObject({ plan: { dayType: 'descanso' }, dayTypeOverride: 'descanso' })

    const day = (await router.dispatch('/api/nutrition/today')) as { plan: { meals: { id: string; items: { foodId: string }[] }[] } }
    const meal = day.plan.meals[0]
    const fromFoodId = meal.items[0].foodId
    const { options } = (await router.dispatch(`/api/nutrition/today/swap-options?mealId=${meal.id}&foodId=${fromFoodId}`)) as {
      options: { food: { id: string } }[]
    }
    expect(options.length).toBeGreaterThan(0)
    const toFoodId = options[0].food.id
    const swapped = (await router.dispatch('/api/nutrition/today/swap', post({ mealId: meal.id, fromFoodId, toFoodId }))) as {
      plan: { meals: { id: string; items: { foodId: string }[] }[] }
    }
    expect(swapped.plan.meals.find(m => m.id === meal.id)!.items.map(i => i.foodId)).toContain(toFoodId)
    await expect(router.dispatch('/api/nutrition/today/swap', post({ mealId: meal.id, fromFoodId: toFoodId, toFoodId: 'nao-existe' }))).rejects.toThrow()

    const ended = (await router.dispatch('/api/nutrition/phase/end', post({}))) as { phase: { status: string } }
    expect(ended.phase.status).toBe('encerrada')
    expect(((await router.dispatch('/api/nutrition/today')) as { status: string }).status).toBe('no-phase')
    await expect(router.dispatch('/api/nutrition/phase/end', post({}))).rejects.toThrow('HTTP 404')

    const created = (await router.dispatch('/api/nutrition/phase', post({ goal: 'perder_gordura', durationWeeks: 8 }))) as {
      phase: { goal: string; status: string }
      calibration: { action: string }
    }
    expect(created).toMatchObject({ phase: { goal: 'perder_gordura', status: 'ativa' }, calibration: { action: 'inicial' } })
  })

  it('zero-state: iniciar fase sem perfil → needs-profile', async () => {
    const { router } = runtime('zero-state')
    await expect(router.dispatch('/api/nutrition/phase', post({ goal: 'manutencao', durationWeeks: 8 }))).rejects.toThrow('needs-profile')
  })

  it('024: gerar novo plano e repetir a semana respondem sem falhar', async () => {
    const { router } = runtime()
    expect(await router.dispatch('/workout/mesocycle/regenerate', post({}))).toEqual({ status: 'gerando' })
    expect(await router.dispatch('/workout/mesocycle/repeat-week', post({}))).toMatchObject({ mesocycleId: expect.any(String) })
  })

  it('reset desfaz as escritas', async () => {
    const { router, store } = runtime()
    await router.dispatch('/api/profile', post({ goal: 'mudou' }))
    store.reset()
    expect(((await router.dispatch('/api/profile')) as { profile: { goal: string } }).profile.goal).toBe('hipertrofia')
  })
})
