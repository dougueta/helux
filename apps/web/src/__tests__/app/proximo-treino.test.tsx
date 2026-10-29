import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EXERCISES, planWith, tirednessStub } from './_planFixture'

const router = { replace: vi.fn(), push: vi.fn(), back: vi.fn() }
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/services/api-client', async importOriginal => ({
  ...(await importOriginal<typeof import('@/services/api-client')>()),
  apiFetch: vi.fn(),
}))

const hooks = vi.hoisted(() => ({
  plan: null as unknown,
  isActive: false,
  startWorkout: vi.fn(),
  openStart: vi.fn(),
  tirednessArgs: null as unknown,
}))
vi.mock('@/hooks/useWorkoutPlan', () => ({
  useWorkoutPlan: () => ({ plan: hooks.plan, loading: false, generating: false, refetch: vi.fn() }),
}))
vi.mock('@/hooks/useActiveWorkout', () => ({
  useActiveWorkout: () => ({ isActive: hooks.isActive, loaded: true, startWorkout: hooks.startWorkout }),
}))
vi.mock('@/hooks/useTirednessFlow', () => ({
  useTirednessFlow: (args: unknown) => {
    hooks.tirednessArgs = args
    return tirednessStub(hooks.openStart)
  },
}))

import { ProximoTreinoClient } from '@/app/treinos/proximo/ProximoTreinoClient'
import { apiFetch } from '@/services/api-client'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  hooks.plan = planWith()
  hooks.isActive = false
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

describe('ProximoTreinoClient (spec 026, US2)', () => {
  it('mostra o treino completo por fase, com prescrição e descanso', () => {
    render(<ProximoTreinoClient plan={null} />)
    expect(screen.getByText('Treino A — Peito e costas')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Aquecimento' })).toHaveTextContent('Esteira leve')
    const main = screen.getByRole('list', { name: 'Treino principal' })
    expect(within(main).getAllByText('4 × 8–10')).toHaveLength(2)
    expect(within(main).getByText('60kg')).toBeInTheDocument()
    expect(within(main).getAllByText('descanso 90s')).toHaveLength(2)
    expect(screen.getByRole('list', { name: 'Volta à calma' })).toHaveTextContent('Alongamento de peitoral')
  })

  it('mostra os ajustes do dia só como texto, sem seletor de cansaço', () => {
    hooks.plan = planWith({
      adjusted: true,
      adjustmentReason: 'Cansaço alto: volume reduzido',
      changes: [{ name: 'Supino Reto', setsBefore: 4, setsAfter: 3, weightBefore: '60kg', weightAfter: '60kg' }],
    })
    render(<ProximoTreinoClient plan={null} />)
    expect(screen.getByText('Cansaço alto: volume reduzido')).toBeInTheDocument()
    expect(screen.queryByText('Como você está hoje')).not.toBeInTheDocument()
  })

  it('abre a execução do exercício só leitura e não escreve nada', async () => {
    const user = userEvent.setup()
    render(<ProximoTreinoClient plan={null} />)
    await user.click(screen.getByRole('button', { name: /^ver execução de Supino Reto/ }))
    expect(screen.getByRole('dialog', { name: 'Execução do exercício' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Variantes (2)' }))
    expect(screen.queryByRole('button', { name: /^Trocar/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(hooks.startWorkout).not.toHaveBeenCalled()
    expect(hooks.openStart).not.toHaveBeenCalled()
    expect(apiFetch).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })

  it('"Iniciar treino" segue o fluxo da Home com os mesmos exercícios', async () => {
    const user = userEvent.setup()
    render(<ProximoTreinoClient plan={null} />)
    await user.click(screen.getByRole('button', { name: 'Iniciar treino' }))
    expect(hooks.openStart).toHaveBeenCalledTimes(1)
    const args = hooks.tirednessArgs as { today: { exercises: unknown }; onStart: (e: unknown) => void }
    expect(args.today.exercises).toBe(EXERCISES)
    args.onStart(EXERCISES)
    expect(hooks.startWorkout).toHaveBeenCalledWith(EXERCISES)
    expect(router.push).toHaveBeenCalledWith('/workout')
  })

  it('com treino em andamento, oferece continuar sem iniciar outro', async () => {
    hooks.isActive = true
    const user = userEvent.setup()
    render(<ProximoTreinoClient plan={null} />)
    expect(screen.getByText('Treino em andamento')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar treino' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuar treino' }))
    expect(router.push).toHaveBeenCalledWith('/workout')
    expect(hooks.startWorkout).not.toHaveBeenCalled()
    expect(hooks.openStart).not.toHaveBeenCalled()
  })

  it('sem próximo treino, volta para a aba Treinos', () => {
    hooks.plan = { ...planWith(), today: null }
    render(<ProximoTreinoClient plan={null} />)
    expect(router.replace).toHaveBeenCalledWith('/treinos')
  })

  it('"voltar" vai para a origem sem depender do histórico (revisão PR #20)', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<ProximoTreinoClient plan={null} from="home" />)
    await user.click(screen.getByRole('button', { name: 'voltar' }))
    expect(router.push).toHaveBeenLastCalledWith('/')
    unmount()
    render(<ProximoTreinoClient plan={null} />)
    await user.click(screen.getByRole('button', { name: 'voltar' }))
    expect(router.push).toHaveBeenLastCalledWith('/treinos')
    expect(router.back).not.toHaveBeenCalled()
  })
})
