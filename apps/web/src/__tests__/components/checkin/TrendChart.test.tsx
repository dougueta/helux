import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendChart } from '@/components/checkin/TrendChart'

// Spec 029 (US1): pontos das pesagens + linha da tendência, sem ligar vazios.

describe('TrendChart', () => {
  const series = [
    {
      name: 'Pesagens',
      kind: 'dots' as const,
      points: [
        { date: '2026-10-01', value: 80 },
        { date: '2026-10-02', value: 81 },
        { date: '2026-10-03', value: 82 },
        { date: '2026-10-25', value: 79 },
      ],
    },
    {
      name: 'Tendência',
      kind: 'line' as const,
      points: [
        { date: '2026-10-01', value: null },
        { date: '2026-10-02', value: null },
        { date: '2026-10-03', value: 81 },
        { date: '2026-10-25', value: null },
        { date: '2026-10-26', value: 79.5 },
        { date: '2026-10-27', value: 79.4 },
      ],
    },
  ]

  it('é uma imagem acessível com o rótulo recebido', () => {
    render(<TrendChart label="Peso: tendência 79,4 kg" series={series} />)
    expect(screen.getByRole('img', { name: 'Peso: tendência 79,4 kg' })).toBeInTheDocument()
  })

  it('um ponto por pesagem', () => {
    const { container } = render(<TrendChart label="x" series={series} />)
    expect(container.querySelectorAll('circle[data-series="Pesagens"]')).toHaveLength(4)
  })

  it('linha da tendência quebra onde não há tendência (segmentos separados)', () => {
    const { container } = render(<TrendChart label="x" series={series} />)
    // segmento 1: só 10-03 (ponto isolado, sem linha); segmento 2: 10-26 → 10-27
    expect(container.querySelectorAll('path[data-series="Tendência"]')).toHaveLength(1)
  })

  it('sem nenhum ponto não desenha nada', () => {
    const { container } = render(<TrendChart label="x" series={[{ name: 'P', kind: 'dots', points: [] }]} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
