import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecalibrateButton } from '@/components/nutrition/RecalibrationDialog'

// Spec 029 (US3): "Recalibrar dieta" mostra a proposta e só aplica se o usuário confirmar.

const previewMock = vi.fn()
const applyMock = vi.fn()
vi.mock('@/services/nutrition.service', () => ({
  previewRecalibration: () => previewMock(),
  applyRecalibration: () => applyMock(),
}))

const BEFORE = { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 }
const AFTER = { kcal: 2030, proteinG: 175, carbsG: 189, fatG: 64 }
const PROPOSAL = {
  status: 'proposta',
  action: 'reduzir',
  before: BEFORE,
  after: AFTER,
  reason: 'Peso de tendência −0,12%/sem, acima do esperado (−1 a −0,25%/sem): −150 kcal no carboidrato.',
  metrics: { weeks: 4.3, weightFromKg: 80, weightToKg: 79.6, weeklyRatePct: -0.12, waistDeltaCm: -0.5 },
}

async function open() {
  const user = userEvent.setup()
  const onApplied = vi.fn()
  render(<RecalibrateButton onApplied={onApplied} />)
  await user.click(screen.getByRole('button', { name: 'Recalibrar dieta' }))
  return { user, onApplied, dialog: await screen.findByRole('dialog') }
}

describe('RecalibrateButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    applyMock.mockResolvedValue({ calibration: { id: 'k3' } })
  })

  it('proposta: metas atuais → novas, taxa pela tendência, cintura e motivo', async () => {
    previewMock.mockResolvedValue(PROPOSAL)
    const { dialog } = await open()
    expect(within(dialog).getByText('2180 → 2030 kcal')).toBeInTheDocument()
    expect(within(dialog).getByText(/P 176 → 175 g/)).toBeInTheDocument()
    expect(within(dialog).getByText(/80,0 → 79,6 kg/)).toBeInTheDocument()
    expect(within(dialog).getByText(/cintura −0,5 cm/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/^Peso de tendência/)).toBeInTheDocument()
  })

  it('Aplicar chama a API e avisa quem chamou', async () => {
    previewMock.mockResolvedValue(PROPOSAL)
    const { user, dialog, onApplied } = await open()
    await user.click(within(dialog).getByRole('button', { name: 'Aplicar' }))
    expect(applyMock).toHaveBeenCalled()
    await vi.waitFor(() => expect(onApplied).toHaveBeenCalled())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Descartar fecha sem chamar a API', async () => {
    previewMock.mockResolvedValue(PROPOSAL)
    const { user, dialog, onApplied } = await open()
    await user.click(within(dialog).getByRole('button', { name: 'Descartar' }))
    expect(applyMock).not.toHaveBeenCalled()
    expect(onApplied).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('intervalo curto: informa a data em que poderá recalibrar', async () => {
    previewMock.mockResolvedValue({ status: 'intervalo-curto', availableOn: '2026-11-22' })
    const { dialog } = await open()
    expect(within(dialog).getByText(/poderá recalibrar a partir de 22\/11/i)).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Aplicar' })).not.toBeInTheDocument()
  })

  it('faltam pesagens: pede 3 por semana e leva ao registro de peso', async () => {
    previewMock.mockResolvedValue({ status: 'faltam-pesagens', at: ['atual'] })
    const { dialog } = await open()
    expect(within(dialog).getByText(/registre pelo menos 3 por semana/i)).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Registrar peso' })).toHaveAttribute('href', '/checkin/peso?voltar=nutricao')
  })

  it('indisponível: explica o motivo', async () => {
    previewMock.mockResolvedValue({ status: 'indisponivel', missing: ['heightCm'] })
    const { dialog } = await open()
    expect(within(dialog).getByText(/complete altura, data de nascimento e sexo no perfil/i)).toBeInTheDocument()
  })
})
