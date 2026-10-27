import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Spec 024 T096 — revisar treinos suspeitos: "É real" ou "Excluir" (com confirmação).

const { getSessionsToReview, confirmSession, deleteSession } = vi.hoisted(() => ({ getSessionsToReview: vi.fn(), confirmSession: vi.fn(), deleteSession: vi.fn() }))
vi.mock('@/services/session-checkins.service', () => ({ getSessionsToReview, confirmSession, deleteSession }))

import { ReviewSessions } from '@/components/progress/ReviewSessions'

const SUSPECT = [
  { id: 's1', date: '2026-09-23', durationS: 124, exercises: ['Supino Reto (Barra)'], reasons: ['duração de 2 min'] },
  { id: 's2', date: '2026-09-22', durationS: 3600, exercises: [], reasons: ['sem séries registradas'] },
]

describe('ReviewSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionsToReview.mockResolvedValue(SUSPECT)
    confirmSession.mockResolvedValue(undefined)
    deleteSession.mockResolvedValue(undefined)
  })

  it('avisa quantos treinos parecem testes e mostra os motivos', async () => {
    render(<ReviewSessions />)
    expect(await screen.findByText(/2 treinos parecem testes/i)).toBeInTheDocument()
    expect(screen.getByText(/duração de 2 min/)).toBeInTheDocument()
    expect(screen.getByText(/sem séries registradas/)).toBeInTheDocument()
  })

  it('"É real" confirma e tira da lista', async () => {
    render(<ReviewSessions />)
    const row = (await screen.findByText(/duração de 2 min/)).closest('li')!
    await userEvent.click(within(row).getByRole('button', { name: /é real/i }))
    expect(confirmSession).toHaveBeenCalledWith('s1')
    await waitFor(() => expect(screen.queryByText(/duração de 2 min/)).not.toBeInTheDocument())
  })

  it('"Excluir" pede confirmação antes de apagar', async () => {
    render(<ReviewSessions />)
    const row = (await screen.findByText(/sem séries registradas/)).closest('li')!
    await userEvent.click(within(row).getByRole('button', { name: /excluir/i }))
    expect(deleteSession).not.toHaveBeenCalled()
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /^excluir$/i }))
    expect(deleteSession).toHaveBeenCalledWith('s2')
    await waitFor(() => expect(screen.queryByText(/sem séries registradas/)).not.toBeInTheDocument())
  })

  it('sem suspeitas: nada', async () => {
    getSessionsToReview.mockResolvedValue([])
    const { container } = render(<ReviewSessions />)
    await waitFor(() => expect(getSessionsToReview).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
