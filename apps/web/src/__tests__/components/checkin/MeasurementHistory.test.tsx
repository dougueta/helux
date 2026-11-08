import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MeasurementHistory } from '@/components/checkin/MeasurementHistory'

// Spec 029 (US2 + US5): registros com origem do %, séries por origem e métricas derivadas.

const w = (date: string, weight_kg: number) => ({ id: date, date, weight_kg })
const WEIGHTS = [w('2026-10-30', 82.4), w('2026-10-31', 82.4), w('2026-11-01', 82.4)]

const MEASUREMENTS = [
  { id: 'm2', measured_on: '2026-11-01', created_at: '2026-11-01T10:00:00Z', waist_cm: 88, neck_cm: 40, body_fat_navy_pct: 18.3, body_fat_device_pct: 16, body_fat_device_source: 'bioimpedancia' as const, arm_left_cm: 38, arm_right_cm: 38.5 },
  { id: 'm1', measured_on: '2026-10-01', created_at: '2026-10-01T10:00:00Z', waist_cm: 90, neck_cm: 40, body_fat_navy_pct: 19.3 },
]

describe('MeasurementHistory', () => {
  it('sem registros mostra o convite para registrar', () => {
    render(<MeasurementHistory measurements={[]} weights={[]} heightCm={178} />)
    expect(screen.getByText(/nenhum registro de medidas/i)).toBeInTheDocument()
  })

  it('cada registro mostra o % com a origem, lado a lado quando há fita e aparelho', () => {
    render(<MeasurementHistory measurements={MEASUREMENTS} weights={WEIGHTS} heightCm={178} />)
    const rec = screen.getByRole('article', { name: /01\/11\/2026/ })
    expect(within(rec).getByText('Gordura (fita)')).toBeInTheDocument()
    expect(within(rec).getByText('Gordura (bioimpedância)')).toBeInTheDocument()
    expect(within(rec).getByText('Braço esq./dir.')).toBeInTheDocument()
  })

  it('variação do % só entre registros da mesma origem (SC-004)', () => {
    render(<MeasurementHistory measurements={MEASUREMENTS} weights={WEIGHTS} heightCm={178} />)
    const rec = screen.getByRole('article', { name: /01\/11\/2026/ })
    // fita: 19,3 → 18,3 = −1,0; bioimpedância não tem anterior → sem variação
    expect(within(rec).getByText('−1,0')).toBeInTheDocument()
    expect(within(rec).queryByText(/bioimpedância.*[+−]/)).not.toBeInTheDocument()
  })

  it('massa gorda/magra pelo % efetivo e peso de referência; cintura/altura com referência (US5)', () => {
    render(<MeasurementHistory measurements={MEASUREMENTS} weights={WEIGHTS} heightCm={178} />)
    const rec = screen.getByRole('article', { name: /01\/11\/2026/ })
    // 82,4 × 18,3% = 15,1 kg gorda; 67,3 kg magra (pela fita)
    expect(within(rec).getByText('15,1')).toBeInTheDocument()
    expect(within(rec).getByText('67,3')).toBeInTheDocument()
    expect(within(rec).getByText(/pela fita/)).toBeInTheDocument()
    expect(within(rec).getByText('0,49')).toBeInTheDocument()
    expect(within(rec).getByText(/abaixo de 0,5 é a faixa saudável/i)).toBeInTheDocument()
  })

  it('sem peso de referência, não mostra massa gorda/magra', () => {
    render(<MeasurementHistory measurements={MEASUREMENTS} weights={[]} heightCm={178} />)
    expect(screen.queryByText('Massa gorda')).not.toBeInTheDocument()
  })

  it('gráfico de % com uma série por origem', () => {
    const { container } = render(<MeasurementHistory measurements={MEASUREMENTS} weights={WEIGHTS} heightCm={178} />)
    expect(screen.getByRole('img', { name: /% de gordura/i })).toBeInTheDocument()
    expect(container.querySelectorAll('circle[data-series="fita"]')).toHaveLength(2)
    expect(container.querySelectorAll('circle[data-series="bioimpedância"]')).toHaveLength(1)
  })

  it('cada registro tem link para editar', () => {
    render(<MeasurementHistory measurements={MEASUREMENTS} weights={WEIGHTS} heightCm={178} />)
    expect(screen.getAllByRole('link', { name: 'Editar' })[0]).toHaveAttribute('href', '/checkin/medidas/m2')
  })
})
