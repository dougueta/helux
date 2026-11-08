import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MeasureGuide, MEASURE_GUIDE } from '@/components/checkin/MeasureGuide'
import { MeasurementFormWithGuide } from '@/components/checkin/MeasurementFormWithGuide'

// Spec 029 (US4): protocolo de medição e "Onde medir?" com silhueta.

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/profile.service', () => ({ getProfile: () => Promise.resolve(null) }))
vi.mock('@/services/measurements.service', () => ({
  createMeasurement: vi.fn(),
  updateMeasurement: vi.fn(),
  deleteMeasurement: vi.fn(),
}))

describe('MeasureGuide', () => {
  it('tem o texto de onde medir para as 8 medidas (US4-2)', () => {
    expect(Object.keys(MEASURE_GUIDE).sort()).toEqual(['arm', 'calf', 'chest', 'hip', 'leg', 'neck', 'shoulders', 'waist'])
    expect(MEASURE_GUIDE.neck.text).toMatch(/logo abaixo do pomo de adão/i)
    expect(MEASURE_GUIDE.waist.text).toMatch(/altura do umbigo.*barriga relaxada.*fim da expiração/i)
    expect(MEASURE_GUIDE.hip.text).toMatch(/parte mais larga dos glúteos/i)
    expect(MEASURE_GUIDE.shoulders.text).toMatch(/volta completa.*parte mais larga dos ombros/i)
    expect(MEASURE_GUIDE.chest.text).toMatch(/linha dos mamilos/i)
    expect(MEASURE_GUIDE.arm.text).toMatch(/ponto mais largo, relaxado/i)
    expect(MEASURE_GUIDE.leg.text).toMatch(/meio entre a virilha e o joelho/i)
    expect(MEASURE_GUIDE.calf.text).toMatch(/ponto mais largo.*em pé/i)
  })

  it('destaca o marcador da medida pedida na silhueta', () => {
    const { container } = render(<MeasureGuide measure="waist" />)
    expect(screen.getByRole('img', { name: /onde medir: cintura/i })).toBeInTheDocument()
    expect(container.querySelector('[data-measure="waist"]')).toHaveAttribute('data-active', 'true')
    expect(container.querySelector('[data-measure="neck"]')).toHaveAttribute('data-active', 'false')
  })
})

describe('MeasurementFormWithGuide', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra o protocolo geral de medição (US4-1)', async () => {
    render(<MeasurementFormWithGuide />)
    expect(await screen.findByText(/de manhã, em jejum, depois de ir ao banheiro, antes de treinar/i)).toBeInTheDocument()
    expect(screen.getByText(/fita justa, sem apertar/i)).toBeInTheDocument()
  })

  it('"Onde medir?" abre a folha com a silhueta e o texto da medida', async () => {
    const user = userEvent.setup()
    render(<MeasurementFormWithGuide />)
    await user.click(await screen.findByRole('button', { name: 'Onde medir: Cintura' }))
    const sheet = await screen.findByRole('dialog', { name: /onde medir: cintura/i })
    expect(within(sheet).getByText(/altura do umbigo/i)).toBeInTheDocument()
  })

  it('membros têm um "Onde medir?" por par (braço, coxa, panturrilha)', async () => {
    render(<MeasurementFormWithGuide />)
    for (const name of ['Braço', 'Coxa', 'Panturrilha', 'Pescoço', 'Quadril', 'Ombros', 'Peitoral']) {
      expect(await screen.findByRole('button', { name: `Onde medir: ${name}` })).toBeInTheDocument()
    }
  })
})
