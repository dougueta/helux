import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckinForm } from '@/components/checkin/CheckinForm'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/services/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api-client')>()
  return { ...actual, apiFetch: vi.fn() }
})

describe('CheckinForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra erro amigável e não chama a API quando um campo está fora do intervalo permitido', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ checkins: [] })
    const user = userEvent.setup()
    render(<CheckinForm />)

    const bodyFat = await screen.findByLabelText('Gordura (%)')
    await user.type(bodyFat, '180')
    await user.click(screen.getByRole('button', { name: /salvar check-in/i }))

    expect(await screen.findByText(/gordura.*entre 1 e 70/i)).toBeInTheDocument()
    expect(apiFetch).not.toHaveBeenCalledWith('/api/checkins', expect.anything())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('salva com sucesso quando os valores estão dentro do intervalo', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ checkins: [] })
    vi.mocked(apiFetch).mockResolvedValueOnce({ id: 'c-1', month: '2026-07-01', weight_kg: 82 })
    const user = userEvent.setup()
    render(<CheckinForm />)

    const weight = await screen.findByLabelText('Peso (kg)')
    await user.type(weight, '82')
    await user.click(screen.getByRole('button', { name: /salvar check-in/i }))

    expect(await screen.findByRole('button', { name: /salvar check-in/i })).toBeInTheDocument()
    expect(pushMock).toHaveBeenCalledWith('/checkin/history')
  })

  it('mostra a mensagem de validação do servidor mapeada para o rótulo do campo (fallback)', async () => {
    const { apiFetch, ApiError } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ checkins: [] })
    vi.mocked(apiFetch).mockRejectedValueOnce(
      new ApiError('Bad Request', [{ path: ['body_fat_pct'], message: 'Number must be less than or equal to 70' }]),
    )
    const user = userEvent.setup()
    render(<CheckinForm />)

    const bodyFat = await screen.findByLabelText('Gordura (%)')
    await user.type(bodyFat, '50')
    await user.click(screen.getByRole('button', { name: /salvar check-in/i }))

    expect(await screen.findByText(/gordura.*entre 1 e 70/i)).toBeInTheDocument()
  })
})
