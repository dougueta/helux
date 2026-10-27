import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TrainingPreferences } from '@helux/types'

const savePreferencesMock = vi.fn()
const resolveProposalMock = vi.fn()
vi.mock('@/services/agents.service', () => ({
  savePreferences: (...a: unknown[]) => savePreferencesMock(...a),
  resolveProposal: (...a: unknown[]) => resolveProposalMock(...a),
}))

import { PreferencesForm } from '@/components/agents/PreferencesForm'

const EMPTY: TrainingPreferences = {
  availableDays: [],
  maxSessionMinutes: null,
  location: null,
  availableEquipment: [],
  favoriteExercises: [],
  exercisesToAvoid: [],
  priorityMuscleGroups: [],
  trainingStyle: null,
  freeInstructions: null,
  updatedAt: null,
}
const CATALOG = [
  { id: 'agachamento-livre-barra', name: 'Agachamento Livre (Barra)', muscleGroup: 'quadriceps', equipment: 'barra' as const, pattern: 'agachar' },
  { id: 'elevacao-pelvica-barra', name: 'Elevação Pélvica (Barra)', muscleGroup: 'gluteo', equipment: 'barra' as const, pattern: 'dobrar-quadril' },
]

describe('PreferencesForm (022 T010, FR-005)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('preenche dias, duração, equipamentos, evitar, grupos e instruções e salva', async () => {
    savePreferencesMock.mockResolvedValue({ preferences: EMPTY, appliesFrom: 'proximo-mesociclo', proposal: null })
    const user = userEvent.setup()
    render(<PreferencesForm initial={EMPTY} catalog={CATALOG} />)

    const days = screen.getByRole('group', { name: /dias disponíveis/i })
    await user.click(within(days).getByRole('button', { name: 'seg' }))
    await user.click(within(days).getByRole('button', { name: 'qua' }))
    await user.type(screen.getByLabelText(/duração máxima/i), '45')
    const equipment = screen.getByRole('group', { name: /equipamentos/i })
    await user.click(within(equipment).getByRole('button', { name: /halteres/i }))
    await user.type(screen.getByLabelText(/buscar exercício/i), 'agach')
    await user.click(screen.getByRole('button', { name: /evitar Agachamento Livre/i }))
    await user.click(within(screen.getByRole('group', { name: /grupos prioritários/i })).getByRole('button', { name: /glúteos/i }))
    await user.type(screen.getByLabelText(/instruções/i), 'nada de agachamento livre')
    await user.click(screen.getByRole('button', { name: /salvar preferências/i }))

    expect(savePreferencesMock).toHaveBeenCalledWith({
      availableDays: [1, 3],
      maxSessionMinutes: 45,
      location: null,
      availableEquipment: ['halteres'],
      favoriteExercises: [],
      exercisesToAvoid: ['agachamento-livre-barra'],
      priorityMuscleGroups: ['gluteo'],
      trainingStyle: null,
      freeInstructions: 'nada de agachamento livre',
    })
    expect(await screen.findByText(/a partir do próximo mesociclo/i)).toBeInTheDocument()
  })

  it('mudança rígida com proposta: mostra o cartão antes → depois', async () => {
    savePreferencesMock.mockResolvedValue({
      preferences: EMPTY,
      appliesFrom: 'imediato',
      proposal: { id: 'p1', mesocycleId: 'm1', kind: 'adaptacao-restricao', sessionIndexes: [1], before: [], after: [], changes: [{ sessionIndex: 1, letter: 'B', kind: 'trocado', before: 'Leg Press 45°', after: 'Agachamento Goblet (Halteres)' }], reason: 'Só halteres.', status: 'pendente', createdAt: '' },
    })
    localStorage.setItem('helux:workout-plan', '{"mesocycleId":"m1"}')
    const user = userEvent.setup()
    render(<PreferencesForm initial={EMPTY} catalog={CATALOG} />)
    await user.click(screen.getByRole('button', { name: /salvar preferências/i }))
    expect(await screen.findByText('Só halteres.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /aplicar mudanças/i }))
    expect(resolveProposalMock).toHaveBeenCalledWith('p1', 'accept')
    await waitFor(() => expect(localStorage.getItem('helux:workout-plan')).toBeNull())
  })

  it('teto atingido: avisa que a adaptação fica para depois', async () => {
    savePreferencesMock.mockResolvedValue({ preferences: EMPTY, appliesFrom: 'imediato', proposal: null, budgetBlocked: true })
    const user = userEvent.setup()
    render(<PreferencesForm initial={EMPTY} catalog={CATALOG} />)
    await user.click(screen.getByRole('button', { name: /salvar preferências/i }))
    expect(await screen.findByText(/teto mensal de IA/i)).toBeInTheDocument()
  })
})
