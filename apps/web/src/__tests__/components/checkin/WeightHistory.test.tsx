import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeightHistory } from '@/components/checkin/WeightHistory'

// Spec 029 (US1, FR-006): aba Peso — gráfico, lista, editar e apagar.

vi.mock('@/lib/dates', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return { ...actual, todayLocal: () => '2026-11-08' }
})
const deleteWeightMock = vi.fn()
vi.mock('@/services/weights.service', () => ({ deleteWeight: (...a: unknown[]) => deleteWeightMock(...a) }))

const w = (date: string, weight_kg: number) => ({ id: date, date, weight_kg })
const WEIGHTS = [w('2026-11-06', 82), w('2026-11-07', 82.6), w('2026-11-08', 81.7)]

describe('WeightHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteWeightMock.mockResolvedValue(undefined)
  })

  it('sem pesagens convida a registrar', () => {
    render(<WeightHistory weights={[]} />)
    expect(screen.getByRole('link', { name: 'Registrar peso' })).toHaveAttribute('href', '/checkin/peso')
  })

  it('gráfico com a tendência no rótulo e lista do mais recente para o mais antigo', () => {
    render(<WeightHistory weights={WEIGHTS} />)
    expect(screen.getByRole('img', { name: /tendência de 82,1 kg/ })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText('08/11/2026')).toBeInTheDocument()
    expect(within(items[0]).getByText('tendência 82,1')).toBeInTheDocument()
  })

  it('editar leva ao registro de peso daquela data', () => {
    render(<WeightHistory weights={WEIGHTS} />)
    expect(screen.getByRole('link', { name: 'Editar pesagem de 07/11/2026' })).toHaveAttribute('href', '/checkin/peso?data=2026-11-07')
  })

  it('apagar pede confirmação e recarrega', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    render(<WeightHistory weights={WEIGHTS} onChanged={onChanged} />)
    await user.click(screen.getByRole('button', { name: 'Apagar pesagem de 07/11/2026' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Apagar' }))
    expect(deleteWeightMock).toHaveBeenCalledWith('2026-11-07')
    await vi.waitFor(() => expect(onChanged).toHaveBeenCalled())
  })
})
