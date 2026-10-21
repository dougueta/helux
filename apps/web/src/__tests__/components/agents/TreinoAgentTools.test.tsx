import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PlannedExercise } from '@helux/types'
import { ApiError } from '@/services/api-client'

const getAlternativesMock = vi.fn()
const editSessionExerciseMock = vi.fn()
const requestAdjustmentMock = vi.fn()
const resolveProposalMock = vi.fn()
vi.mock('@/services/agents.service', () => ({
  getAlternatives: (...a: unknown[]) => getAlternativesMock(...a),
  editSessionExercise: (...a: unknown[]) => editSessionExerciseMock(...a),
  requestAdjustment: (...a: unknown[]) => requestAdjustmentMock(...a),
  resolveProposal: (...a: unknown[]) => resolveProposalMock(...a),
}))

import { SessionEditSheet } from '@/components/agents/SessionEditSheet'
import { TodayAdjustCard } from '@/components/agents/TodayAdjustCard'
import { PlanRationale } from '@/components/agents/PlanRationale'

const EXERCISE: PlannedExercise = { name: 'Supino Reto (Barra)', sets: 4, reps: '8', weight: '80 kg', phase: 'principal' }

describe('SessionEditSheet (022 T017, FR-009a)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('troca por alternativa e salva', async () => {
    getAlternativesMock.mockResolvedValue([{ exerciseId: 'supino-reto-halteres', name: 'Supino Reto (Halteres)', equipment: 'halteres', violatesSafety: false }])
    editSessionExerciseMock.mockResolvedValue({})
    const onSaved = vi.fn()
    const user = userEvent.setup()
    render(<SessionEditSheet open sessionIndex={1} exerciseIndex={2} exercise={EXERCISE} onClose={vi.fn()} onSaved={onSaved} />)
    await user.click(await screen.findByRole('radio', { name: /Supino Reto \(Halteres\)/ }))
    await user.click(screen.getByRole('button', { name: /^salvar$/i }))
    expect(editSessionExerciseMock).toHaveBeenCalledWith(1, 2, { exerciseId: 'supino-reto-halteres' })
    expect(onSaved).toHaveBeenCalled()
  })

  it('séries/reps/carga e aviso de segurança com "salvar mesmo assim"', async () => {
    getAlternativesMock.mockResolvedValue([])
    editSessionExerciseMock
      .mockRejectedValueOnce(new ApiError('fere restrição', undefined, 'safety-warning', { reasons: ['padrão bloqueado por restrição de segurança'] }))
      .mockResolvedValueOnce({})
    const user = userEvent.setup()
    render(<SessionEditSheet open sessionIndex={1} exerciseIndex={2} exercise={EXERCISE} onClose={vi.fn()} onSaved={vi.fn()} />)
    const sets = await screen.findByLabelText(/séries/i)
    await user.clear(sets)
    await user.type(sets, '3')
    await user.click(screen.getByRole('button', { name: /^salvar$/i }))
    expect(await screen.findByText(/padrão bloqueado por restrição de segurança/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /salvar mesmo assim/i }))
    expect(editSessionExerciseMock).toHaveBeenLastCalledWith(1, 2, { sets: 3, confirmSafetyOverride: true })
  })
})

describe('TodayAdjustCard (022 T017, FR-009)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('pede o ajuste e mostra a proposta; aceitar chama onApplied', async () => {
    requestAdjustmentMock.mockResolvedValue({ id: 'p1', mesocycleId: 'm1', kind: 'ajuste-sessao', sessionIndexes: [1], before: [], after: [], changes: [], reason: 'Versão de 30 min.', status: 'pendente', createdAt: '' })
    resolveProposalMock.mockResolvedValue(undefined)
    const onApplied = vi.fn()
    const user = userEvent.setup()
    render(<TodayAdjustCard onApplied={onApplied} />)
    await user.type(screen.getByLabelText(/o que mudou hoje/i), 'só tenho 30 minutos')
    await user.click(screen.getByRole('button', { name: /pedir ajuste/i }))
    expect(requestAdjustmentMock).toHaveBeenCalledWith('só tenho 30 minutos')
    expect(await screen.findByText('Versão de 30 min.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /aplicar mudanças/i }))
    expect(resolveProposalMock).toHaveBeenCalledWith('p1', 'accept')
    expect(onApplied).toHaveBeenCalled()
  })

  it('teto de IA: mensagem clara', async () => {
    requestAdjustmentMock.mockRejectedValue(new ApiError('Teto mensal de IA atingido', undefined, 'budget-exceeded'))
    const user = userEvent.setup()
    render(<TodayAdjustCard onApplied={vi.fn()} />)
    await user.type(screen.getByLabelText(/o que mudou hoje/i), 'x')
    await user.click(screen.getByRole('button', { name: /pedir ajuste/i }))
    expect(await screen.findByText(/teto mensal de IA/i)).toBeInTheDocument()
  })
})

describe('PlanRationale (022, FR-008/FR-004)', () => {
  it('lista as decisões com as fontes e as fontes não usadas', () => {
    render(
      <PlanRationale
        decisions={[{ topic: 'descanso', choice: 'Descanso de 2 min', sources: ['genetica', 'cansaco'], reason: 'Recuperação muscular média e cansaço de hoje.' }]}
        sourcesUsed={{ ativa: ['genetica', 'cansaco'], vazia: ['exames'], desativada: ['nutricao'] }}
      />,
    )
    expect(screen.getByText('Descanso de 2 min')).toBeInTheDocument()
    expect(screen.getByText(/Genética · Cansaço/)).toBeInTheDocument()
    expect(screen.getByText(/Sem dados: Exames/)).toBeInTheDocument()
    expect(screen.getByText(/Desativadas por você: Nutrição/)).toBeInTheDocument()
  })
})
