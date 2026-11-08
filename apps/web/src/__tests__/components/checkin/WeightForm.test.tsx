import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeightForm } from '@/components/checkin/WeightForm'

// Spec 029 (US1): registrar o peso em segundos, uma pesagem por dia.

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))

vi.mock('@/lib/dates', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return { ...actual, todayLocal: () => '2026-11-08' }
})

const listWeightsMock = vi.fn()
const saveWeightMock = vi.fn()
vi.mock('@/services/weights.service', () => ({
  listWeights: (...a: unknown[]) => listWeightsMock(...a),
  saveWeight: (...a: unknown[]) => saveWeightMock(...a),
}))

const STABLE = [
  { id: 'a', date: '2026-11-05', weight_kg: 82 },
  { id: 'b', date: '2026-11-06', weight_kg: 82 },
  { id: 'c', date: '2026-11-07', weight_kg: 82 },
]

describe('WeightForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listWeightsMock.mockResolvedValue(STABLE)
    saveWeightMock.mockResolvedValue({ weight: { id: 'n', date: '2026-11-08', weight_kg: 82.4 }, replaced: false })
  })

  it('salva o peso com vírgula decimal na data de hoje e volta ao Check-in', async () => {
    const user = userEvent.setup()
    render(<WeightForm />)
    await user.type(await screen.findByLabelText('Peso'), '82,4')
    await user.click(screen.getByRole('button', { name: /salvar peso/i }))
    expect(saveWeightMock).toHaveBeenCalledWith('2026-11-08', 82.4)
    expect(pushMock).toHaveBeenCalledWith('/checkin')
  })

  it('data padrão é hoje e não aceita datas futuras', async () => {
    render(<WeightForm />)
    const date = (await screen.findByLabelText('Data')) as HTMLInputElement
    expect(date.value).toBe('2026-11-08')
    expect(date.max).toBe('2026-11-08')
  })

  it('mostra o lembrete do protocolo de pesagem (FR-015)', async () => {
    render(<WeightForm />)
    expect(await screen.findByText(/de manhã, em jejum, depois de ir ao banheiro/i)).toBeInTheDocument()
  })

  it('peso fora de 20–500 mostra erro e não salva', async () => {
    const user = userEvent.setup()
    render(<WeightForm />)
    await user.type(await screen.findByLabelText('Peso'), '8')
    await user.click(screen.getByRole('button', { name: /salvar peso/i }))
    expect(await screen.findByText(/entre 20 e 500/i)).toBeInTheDocument()
    expect(saveWeightMock).not.toHaveBeenCalled()
  })

  it('pede confirmação quando o peso difere mais de 3 kg da tendência (FR-005)', async () => {
    const user = userEvent.setup()
    render(<WeightForm />)
    await screen.findByText(/tendência/i)
    await user.type(screen.getByLabelText('Peso'), '87,5')
    await user.click(screen.getByRole('button', { name: /salvar peso/i }))
    const dialog = await screen.findByRole('dialog')
    expect(saveWeightMock).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: /salvar mesmo assim/i }))
    expect(saveWeightMock).toHaveBeenCalledWith('2026-11-08', 87.5)
  })

  it('avisa que vai substituir quando já há pesagem no dia escolhido (FR-002)', async () => {
    listWeightsMock.mockResolvedValue([...STABLE, { id: 'd', date: '2026-11-08', weight_kg: 81.9 }])
    render(<WeightForm />)
    expect(await screen.findByText(/já há uma pesagem neste dia \(81,9 kg\)/i)).toBeInTheDocument()
  })
})
