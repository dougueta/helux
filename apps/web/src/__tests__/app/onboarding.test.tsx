import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Spec 024 T047 — onboarding em 6 passos, retomável e pré-preenchido.

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const getMock = vi.fn()
const saveMock = vi.fn()
const completeMock = vi.fn()
vi.mock('@/services/onboarding.service', () => ({
  getOnboarding: () => getMock(),
  saveOnboardingStep: (...a: unknown[]) => saveMock(...a),
  completeOnboarding: () => completeMock(),
}))
vi.mock('@/components/conditions/ConditionsEditor', () => ({ ConditionsEditor: () => <div>editor de condições</div> }))

import { OnboardingClient } from '@/app/onboarding/OnboardingClient'

const STATE = (over: Record<string, unknown> = {}) => ({
  step: null,
  completedAt: null,
  profile: { level: 'intermediario', trainingTime: '3 anos', timeOff: '8 meses', goalPrimary: null, cardioLikes: [], cardioAvoid: [], updatedAt: '' },
  preferences: { availableDays: [1, 2, 4, 5], maxSessionMinutes: 60, location: 'academia', availableEquipment: [], favoriteExercises: [], exercisesToAvoid: [], priorityMuscleGroups: [], trainingStyle: null, freeInstructions: null, updatedAt: null },
  conditions: [],
  suggestions: { goalText: 'Voltar a correr 5km sem dor no joelho', injuryText: '3 cirurgias de LCA' },
  ...over,
})

describe('OnboardingClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue(STATE())
    saveMock.mockImplementation(async () => STATE())
    completeMock.mockResolvedValue({ completedAt: '2026-10-24T12:00:00Z' })
  })

  it('passo 1: mostra o objetivo escrito antes e salva o objetivo estruturado', async () => {
    const user = userEvent.setup()
    render(<OnboardingClient />)
    expect(await screen.findByText(/voltar a correr 5km sem dor no joelho/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Condicionamento' }))
    await user.type(screen.getByLabelText(/meta/i), 'correr 5 km sem dor')
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(saveMock).toHaveBeenCalledWith(expect.objectContaining({ step: 2, goal: expect.objectContaining({ primary: 'condicionamento', target: 'correr 5 km sem dor' }) }))
    expect(await screen.findByRole('heading', { name: /experiência/i })).toBeInTheDocument()
  })

  it('retoma do passo salvo; no passo de condições mostra a lesão escrita antes', async () => {
    getMock.mockResolvedValue(STATE({ step: 3 }))
    render(<OnboardingClient />)
    expect(await screen.findByRole('heading', { name: /saúde/i })).toBeInTheDocument()
    expect(screen.getByText(/3 cirurgias de LCA/)).toBeInTheDocument()
    expect(screen.getByText('editor de condições')).toBeInTheDocument()
  })

  it('cardio: escolhe modalidades de que gosta e as que quer evitar', async () => {
    getMock.mockResolvedValue(STATE({ step: 5 }))
    const user = userEvent.setup()
    render(<OnboardingClient />)
    await screen.findByRole('heading', { name: /cardio/i })
    await user.click(screen.getByRole('checkbox', { name: /gosto: bike ergométrica$/i }))
    await user.click(screen.getByRole('checkbox', { name: /evitar: corrida$/i }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(saveMock).toHaveBeenCalledWith({ step: 6, cardio: { likes: ['bike'], avoid: ['corrida'] } })
  })

  it('revisão: conclui e vai para a Home', async () => {
    getMock.mockResolvedValue(STATE({ step: 6, profile: { ...STATE().profile, goalPrimary: 'condicionamento' } }))
    localStorage.setItem('helux:workout-plan', '{"mesocycleId":"m1"}')
    const user = userEvent.setup()
    render(<OnboardingClient />)
    await user.click(await screen.findByRole('button', { name: /concluir/i }))
    expect(completeMock).toHaveBeenCalled()
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'))
    expect(localStorage.getItem('helux:workout-plan')).toBeNull()
  })

  it('erro ao concluir aparece na tela', async () => {
    getMock.mockResolvedValue(STATE({ step: 6 }))
    completeMock.mockRejectedValue(new Error('Faltam respostas no onboarding.'))
    const user = userEvent.setup()
    render(<OnboardingClient />)
    await user.click(await screen.findByRole('button', { name: /concluir/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/faltam respostas/i)
  })
})
