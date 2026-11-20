import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PeriodCuriositiesSection } from '@/components/calendar/PeriodCuriositiesSection'
import type { PeriodCuriosity } from '@helux/types'

const WEEK_CURIOSITIES: PeriodCuriosity[] = [
  {
    id: 'tonelagem-equivalente',
    scope: 'semana',
    category: 'tonelagem',
    title: 'Volume da semana',
    highlight: '13,5 t',
    description: 'Equivale a levantar ~11 carros populares nesta semana.',
  },
  {
    id: 'maior-carga-periodo',
    scope: 'semana',
    category: 'forca',
    title: 'Série mais pesada',
    highlight: '100 kg × 8',
    description: 'Agachamento Livre liderou as cargas máximas nesta semana.',
  },
]

const MONTH_CURIOSITIES: PeriodCuriosity[] = [
  {
    id: 'tonelagem-equivalente',
    scope: 'mes',
    category: 'tonelagem',
    title: 'Volume total do mês',
    highlight: '42,6 t',
    description: 'Equivale a levantar ~36 carros populares no período.',
  },
  {
    id: 'habito-dia-fiel',
    scope: 'mes',
    category: 'habito',
    title: 'Seu dia mais fiel',
    highlight: 'Terça',
    description: 'Você treinou em 4 terças-feiras neste mês — seu dia mais consistente.',
  },
]

describe('PeriodCuriositiesSection (031 — US3 / T013)', () => {
  it('alterna instantaneamente entre as curiosidades da Semana e do Mês', () => {
    render(
      <PeriodCuriositiesSection
        weekCuriosities={WEEK_CURIOSITIES}
        monthCuriosities={MONTH_CURIOSITIES}
        weekLabel="16 a 22 de nov."
        monthLabel="Novembro 2026"
      />,
    )

    // Padrão: Semana
    expect(screen.getByText('13,5 t')).toBeInTheDocument()
    expect(screen.getByText(/11 carros populares/i)).toBeInTheDocument()

    // Alternar para Mês
    fireEvent.click(screen.getByRole('button', { name: 'Mês' }))
    expect(screen.getByText('42,6 t')).toBeInTheDocument()
    expect(screen.getByText('Terça')).toBeInTheDocument()
    expect(screen.getByText(/4 terças-feiras neste mês/i)).toBeInTheDocument()
  })

  it('exibe estado vazio encorajador sem números zerados quando não há atividades no período', () => {
    render(
      <PeriodCuriositiesSection
        weekCuriosities={[]}
        monthCuriosities={[]}
        weekLabel="16 a 22 de nov."
        monthLabel="Novembro 2026"
      />,
    )

    expect(screen.getByText(/Nenhuma atividade registrada neste período/i)).toBeInTheDocument()
    expect(screen.queryByText(/0 carros/i)).not.toBeInTheDocument()
  })
})
