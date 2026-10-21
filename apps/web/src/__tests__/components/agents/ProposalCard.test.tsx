import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { WorkoutAdjustmentProposal } from '@helux/types'
import { ProposalCard } from '@/components/agents/ProposalCard'

const PROPOSAL: WorkoutAdjustmentProposal = {
  id: 'p1',
  mesocycleId: 'm1',
  kind: 'ajuste-sessao',
  sessionIndexes: [1],
  before: [],
  after: [],
  changes: [
    { sessionIndex: 1, letter: 'B', kind: 'trocado', before: 'Remada Curvada (Barra)', after: 'Remada Unilateral (Halteres)' },
    { sessionIndex: 1, letter: 'B', kind: 'removido', before: 'Face Pull (Cabo) 3x12 20 kg', after: null },
  ],
  reason: 'No hotel só há halteres leves.',
  status: 'pendente',
  createdAt: '2026-10-20T10:00:00Z',
}

describe('ProposalCard (022, FR-009)', () => {
  it('mostra o motivo e cada mudança antes → depois', () => {
    render(<ProposalCard proposal={PROPOSAL} onResolve={vi.fn()} />)
    expect(screen.getByText('No hotel só há halteres leves.')).toBeInTheDocument()
    expect(screen.getByText(/Remada Curvada \(Barra\)/)).toBeInTheDocument()
    expect(screen.getByText(/Remada Unilateral \(Halteres\)/)).toBeInTheDocument()
    expect(screen.getByText(/removido/i)).toBeInTheDocument()
  })

  it('aceitar e recusar chamam onResolve; depois os botões somem', async () => {
    const onResolve = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    const { rerender } = render(<ProposalCard proposal={PROPOSAL} onResolve={onResolve} />)
    await user.click(screen.getByRole('button', { name: /aplicar mudanças/i }))
    expect(onResolve).toHaveBeenCalledWith('accept')
    rerender(<ProposalCard proposal={{ ...PROPOSAL, status: 'aceita' }} onResolve={onResolve} />)
    expect(screen.queryByRole('button', { name: /aplicar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/aplicada/i)).toBeInTheDocument()
  })

  it('recusar', async () => {
    const onResolve = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ProposalCard proposal={PROPOSAL} onResolve={onResolve} />)
    await user.click(screen.getByRole('button', { name: /manter como está/i }))
    expect(onResolve).toHaveBeenCalledWith('reject')
  })
})
