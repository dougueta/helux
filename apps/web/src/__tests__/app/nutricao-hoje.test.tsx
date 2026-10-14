import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildDayPlan, nutritionFlags } from '@helux/nutrition'

const getTodayMock = vi.fn()
const setDayTypeMock = vi.fn()
const getSwapOptionsMock = vi.fn()
const applySwapMock = vi.fn()
const getHistoryMock = vi.fn()
vi.mock('@/services/nutrition.service', () => ({
  getToday: () => getTodayMock(),
  setDayType: (...a: unknown[]) => setDayTypeMock(...a),
  getSwapOptions: (...a: unknown[]) => getSwapOptionsMock(...a),
  applySwap: (...a: unknown[]) => applySwapMock(...a),
  getHistory: () => getHistoryMock(),
  getPhase: vi.fn().mockResolvedValue({ phase: null, calibrations: [], bodyFatPct: null, missing: [] }),
  startPhase: vi.fn(),
  endPhase: vi.fn(),
}))
vi.mock('@/services/profile.service', () => ({ getProfile: vi.fn().mockResolvedValue(null), upsertProfile: vi.fn() }))

import { NutricaoClient } from '@/app/nutricao/NutricaoClient'

const FLAGS = { ...nutritionFlags([]), intoleranciaLactose: true, b6Baixa: true, lowCarbEficaz: true }
const PHASE = { id: 'phase-1', goal: 'perder_gordura', startedOn: '2026-10-01', durationWeeks: 8, status: 'ativa', baseTargets: { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 } }
const plan = (dayType: 'treino' | 'descanso' = 'treino', geneticsActive = true) =>
  buildDayPlan({ date: '2026-10-14', dayType, base: PHASE.baseTargets, weightKg: 80, flags: FLAGS, geneticsActive, tiredness: null, swaps: [] })
const ok = (over: Record<string, unknown> = {}) => ({ status: 'ok', missing: [], plan: plan(), phase: PHASE, tiredness: null, dayTypeOverride: null, workoutToday: null, ...over })

describe('Nutrição › Hoje (spec 018, US1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getHistoryMock.mockResolvedValue([])
  })

  it('abre em Hoje: metas do dia, água, badges e as 5 refeições', async () => {
    getTodayMock.mockResolvedValue(ok())
    render(<NutricaoClient />)

    expect(await screen.findByText('2320')).toBeInTheDocument()
    expect(screen.getByText(/176 g/)).toBeInTheDocument()
    expect(screen.getByText(/3,3 L de água/)).toBeInTheDocument()
    expect(screen.getAllByText('Sem lactose').length).toBeGreaterThan(0)
    const meals = screen.getAllByRole('article')
    expect(meals.map((m) => within(m).getByRole('heading').textContent)).toEqual(['Café da manhã', 'Almoço', 'Pré-treino', 'Pós-treino', 'Jantar'])
    expect(within(meals[2]).getByText('60–90 min antes de treinar')).toBeInTheDocument()
  })

  it('expandir a refeição mostra a justificativa genética', async () => {
    getTodayMock.mockResolvedValue(ok())
    const user = userEvent.setup()
    render(<NutricaoClient />)
    const lunch = (await screen.findAllByRole('article'))[1]
    expect(within(lunch).queryByText(/MCM6/)).not.toBeInTheDocument()
    await user.click(within(lunch).getByRole('button', { name: /por que esses alimentos/i }))
    expect(within(lunch).getByText(/MCM6/)).toBeInTheDocument()
  })

  it('marcar "hoje é descanso" recalcula o dia', async () => {
    getTodayMock.mockResolvedValue(ok())
    setDayTypeMock.mockResolvedValue(ok({ plan: plan('descanso'), dayTypeOverride: 'descanso' }))
    const user = userEvent.setup()
    render(<NutricaoClient />)

    await user.click(await screen.findByRole('button', { name: 'Descanso' }))
    expect(setDayTypeMock).toHaveBeenCalledWith('descanso')
    expect(await screen.findByRole('heading', { name: 'Ceia' })).toBeInTheDocument()
  })

  it('com treino salvo hoje, o tipo do dia fica travado em treino', async () => {
    getTodayMock.mockResolvedValue(ok({ workoutToday: { finishedAt: new Date().toISOString() } }))
    render(<NutricaoClient />)
    expect(await screen.findByRole('button', { name: 'Descanso' })).toBeDisabled()
  })

  it('pós-treino com hora no relógio quando o treino de hoje terminou', async () => {
    const finishedAt = new Date().toISOString()
    getTodayMock.mockResolvedValue(ok({ workoutToday: { finishedAt } }))
    render(<NutricaoClient />)
    const post = (await screen.findAllByRole('article'))[3]
    expect(within(post).getByText(/^\d{2}:\d{2}–\d{2}:\d{2}$/)).toBeInTheDocument()
    expect(within(post).getByText('Agora')).toBeInTheDocument()
  })

  it('treino em andamento (treino ativo no aparelho) muda o pós-treino', async () => {
    localStorage.setItem('helux:active-workout', JSON.stringify({ startedAt: new Date().toISOString() }))
    getTodayMock.mockResolvedValue(ok())
    render(<NutricaoClient />)
    const post = (await screen.findAllByRole('article'))[3]
    expect(within(post).getByText('Até 60 min após terminar o treino')).toBeInTheDocument()
  })

  it('troca rápida: lista opções e aplica', async () => {
    const p = plan()
    const lunch = p.meals[1]
    const item = lunch.items[0]
    getTodayMock.mockResolvedValue(ok({ plan: p }))
    getSwapOptionsMock.mockResolvedValue([
      { food: { id: 'tilapia', name: 'Filé de tilápia grelhado', group: 'proteina', portion: { grams: 100, household: '1 filé' }, macros: { kcal: 128, proteinG: 26.2, carbsG: 0, fatG: 2.7 }, tags: [] }, portions: 1.5, macros: { kcal: 192, proteinG: 39.3, carbsG: 0, fatG: 4 } },
    ])
    applySwapMock.mockResolvedValue(ok({ plan: p }))
    const user = userEvent.setup()
    render(<NutricaoClient />)

    const lunchCard = (await screen.findAllByRole('article'))[1]
    await user.click(within(lunchCard).getByRole('button', { name: `trocar ${item.name}` }))
    expect(getSwapOptionsMock).toHaveBeenCalledWith(lunch.id, item.foodId)
    await user.click(await screen.findByRole('button', { name: /Filé de tilápia grelhado/ }))
    expect(applySwapMock).toHaveBeenCalledWith({ mealId: lunch.id, fromFoodId: item.foodId, toFoodId: 'tilapia' })
  })

  it('sem fase: convida a iniciar e leva para a seção Fase', async () => {
    getTodayMock.mockResolvedValue({ status: 'no-phase', missing: [] })
    const user = userEvent.setup()
    render(<NutricaoClient />)
    await user.click(await screen.findByRole('button', { name: /ir para fase/i }))
    expect(screen.getByRole('tab', { name: 'Fase' })).toHaveAttribute('aria-selected', 'true')
  })

  it('genética inativa: avisa e não mostra badges genéticos', async () => {
    getTodayMock.mockResolvedValue(ok({ plan: plan('treino', false) }))
    render(<NutricaoClient />)
    expect(await screen.findByText(/personalização genética inativa/i)).toBeInTheDocument()
    expect(screen.queryByText('Sem lactose')).not.toBeInTheDocument()
  })

  it('histórico dos dias anteriores', async () => {
    getTodayMock.mockResolvedValue(ok())
    getHistoryMock.mockResolvedValue([
      { date: '2026-10-13', dayType: 'treino', status: 'treino-nao-realizado', targets: { kcal: 2320, proteinG: 176, carbsG: 259, fatG: 64 } },
    ])
    render(<NutricaoClient />)
    const history = await screen.findByRole('list', { name: 'Dias anteriores' })
    expect(within(history).getByText(/treino não realizado/i)).toBeInTheDocument()
  })

  it('erro ao carregar mostra aviso', async () => {
    getTodayMock.mockRejectedValue(new Error('boom'))
    render(<NutricaoClient />)
    expect(await screen.findByText(/não foi possível carregar o dia/i)).toBeInTheDocument()
  })
})
