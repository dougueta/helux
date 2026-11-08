import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CheckinSummary } from '@/components/checkin/CheckinSummary'

// Spec 029 (US1): resumo da aba Check-in — tendência, variação e dois botões.

vi.mock('@/lib/dates', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return { ...actual, todayLocal: () => '2026-11-08' }
})

const w = (date: string, weight_kg: number) => ({ id: date, date, weight_kg })

describe('CheckinSummary', () => {
  it('mostra os botões Registrar peso e Registrar medidas', () => {
    render(<CheckinSummary weights={[]} measurements={[]} />)
    expect(screen.getByRole('link', { name: 'Registrar peso' })).toHaveAttribute('href', '/checkin/peso')
    expect(screen.getByRole('link', { name: 'Registrar medidas' })).toHaveAttribute('href', '/checkin/medidas')
  })

  it('mostra o peso de tendência e a variação dos últimos 7 dias', () => {
    const weights = [
      w('2026-10-30', 82), w('2026-10-31', 82), w('2026-11-01', 82),
      w('2026-11-06', 81), w('2026-11-07', 81), w('2026-11-08', 81),
    ]
    render(<CheckinSummary weights={weights} measurements={[]} />)
    expect(screen.getByText('Peso de tendência')).toBeInTheDocument()
    expect(screen.getByText('81,0')).toBeInTheDocument()
    expect(screen.getByText(/−1,0 kg \(−1,2%\) em 7 dias/)).toBeInTheDocument()
  })

  it('com menos de 3 pesagens nos últimos 7 dias, explica que falta pesagem (US1-4)', () => {
    render(<CheckinSummary weights={[w('2026-11-07', 81), w('2026-11-08', 81.2)]} measurements={[]} />)
    expect(screen.getByText(/a tendência precisa de pelo menos 3 pesagens/i)).toBeInTheDocument()
    expect(screen.getByText('81,2')).toBeInTheDocument()
    expect(screen.getByText('Última pesagem')).toBeInTheDocument()
  })

  it('lembra de refazer as medidas com mais de 28 dias e mostra a data do último registro (FR-018)', () => {
    render(<CheckinSummary weights={[]} measurements={[{ id: 'm', measured_on: '2026-10-01', created_at: 'x' }]} />)
    expect(screen.getByText(/hora de refazer as medidas/i)).toBeInTheDocument()
    expect(screen.getByText(/últimas medidas em 01\/10\/2026/i)).toBeInTheDocument()
  })

  it('sem nenhum registro de medidas também lembra', () => {
    render(<CheckinSummary weights={[]} measurements={[]} />)
    expect(screen.getByText(/hora de refazer as medidas|registre suas medidas/i)).toBeInTheDocument()
  })

  it('medidas recentes: sem lembrete', () => {
    render(<CheckinSummary weights={[]} measurements={[{ id: 'm', measured_on: '2026-11-01', created_at: 'x' }]} />)
    expect(screen.queryByText(/hora de refazer as medidas/i)).not.toBeInTheDocument()
  })
})
