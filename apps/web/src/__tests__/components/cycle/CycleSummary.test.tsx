import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CycleSummary as Summary } from '@helux/types'
import { CycleSummary } from '@/components/cycle/CycleSummary'

// Spec 024 T105 — resumo do ciclo concluído e o que mudou no próximo.

const SUMMARY: Summary = {
  mesocycleId: 'm1',
  weeks: 4,
  adherence: { forca: { done: 12, planned: 12 }, cardio: { done: 1, planned: 4 }, mobilidade: { done: 0, planned: 0 } },
  exercises: [
    { name: 'Agachamento Livre (Barra)', firstE1rm: 126.7, lastE1rm: 127.9, avgRpe: 8.7, painReports: 0 },
    { name: 'Supino Reto (Barra)', firstE1rm: 80, lastE1rm: 93.3, avgRpe: 7, painReports: 0 },
  ],
  avgRpeByWeek: [7, 8, 8.5, 6],
  pains: [{ region: 'joelho', count: 2 }],
  tirednessAvg: 2.5,
  checkinTrend: { from: '2026-09', to: '2026-10', deltas: { weight_kg: -1.2, waist_cm: -2 }, implausible: [], modifiers: [], suggestGoalChange: 'hipertrofia' },
  findings: [{ kind: 'estagnacao', subject: 'Agachamento Livre (Barra)', evidence: '1RM estimado 126.7 → 127.9 kg (+1%)' }],
  missingData: ['cansaço do dia'],
}
const CHANGES = [{ topic: 'ciclo' as const, choice: 'Agachamento trocado pelo Hack', sources: ['historico' as const], reason: 'estagnou no ciclo anterior' }]

describe('CycleSummary', () => {
  it('aderência por tipo, evolução por exercício, dores e dados que faltaram', () => {
    render(<CycleSummary summary={SUMMARY} changes={CHANGES} />)
    expect(screen.getByText(/força/i)).toBeInTheDocument()
    expect(screen.getByText('12/12')).toBeInTheDocument()
    expect(screen.getByText('1/4')).toBeInTheDocument()
    expect(screen.queryByText('0/0')).not.toBeInTheDocument()
    expect(screen.getByText(/Supino Reto \(Barra\)/)).toBeInTheDocument()
    expect(screen.getByText(/\+17%/)).toBeInTheDocument()
    expect(screen.getByText(/joelho · 2/)).toBeInTheDocument()
    expect(screen.getByText(/faltou: cansaço do dia/i)).toBeInTheDocument()
  })

  it('tendência dos check-ins e o que mudou no próximo ciclo', () => {
    render(<CycleSummary summary={SUMMARY} changes={CHANGES} />)
    expect(screen.getByText(/peso −1,2 kg\/mês/)).toBeInTheDocument()
    expect(screen.getByText('Agachamento trocado pelo Hack')).toBeInTheDocument()
    expect(screen.getByText(/estagnou no ciclo anterior/)).toBeInTheDocument()
  })

  it('sugestão de novo objetivo: aceitar ou recusar', async () => {
    const onAccept = vi.fn()
    const onDecline = vi.fn()
    render(<CycleSummary summary={SUMMARY} changes={CHANGES} onAcceptGoal={onAccept} onDeclineGoal={onDecline} />)
    expect(screen.getByText(/novo objetivo.*hipertrofia/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /mudar para hipertrofia/i }))
    expect(onAccept).toHaveBeenCalledWith('hipertrofia')
    await userEvent.click(screen.getByRole('button', { name: /manter objetivo/i }))
    expect(onDecline).toHaveBeenCalled()
  })
})
