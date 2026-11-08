import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MeasurementForm } from '@/components/checkin/MeasurementForm'

// Spec 029 (US2): registro de medidas; % pela fita como padrão; aparelho opcional com origem.

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))

vi.mock('@/lib/dates', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return { ...actual, todayLocal: () => '2026-11-08' }
})

const getProfileMock = vi.fn()
vi.mock('@/services/profile.service', () => ({ getProfile: () => getProfileMock() }))

const createMock = vi.fn()
const updateMock = vi.fn()
const deleteMock = vi.fn()
vi.mock('@/services/measurements.service', () => ({
  createMeasurement: (...a: unknown[]) => createMock(...a),
  updateMeasurement: (...a: unknown[]) => updateMock(...a),
  deleteMeasurement: (...a: unknown[]) => deleteMock(...a),
}))

const saved = (extra: Record<string, unknown> = {}) => ({
  measurement: { id: 'm1', measured_on: '2026-11-08', created_at: 'x', ...extra },
  navy_status: 'ok',
})

describe('MeasurementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getProfileMock.mockResolvedValue({ heightCm: 180, sex: 'masculino' })
    createMock.mockResolvedValue(saved())
    updateMock.mockResolvedValue(saved())
  })

  it('tem as seções e os campos dos dois lados para braço, coxa e panturrilha', async () => {
    render(<MeasurementForm />)
    expect(await screen.findByText('Composição')).toBeInTheDocument()
    expect(screen.getByText('Membros')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
    for (const label of ['Pescoço', 'Cintura', 'Quadril', 'Ombros', 'Peitoral', 'Braço esq.', 'Braço dir.', 'Coxa esq.', 'Coxa dir.', 'Panturrilha esq.', 'Panturrilha dir.']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
  })

  it('mostra a prévia do % pela fita e salva as medidas com a data de hoje', async () => {
    const user = userEvent.setup()
    render(<MeasurementForm />)
    await user.type(await screen.findByLabelText('Cintura'), '90')
    await user.type(screen.getByLabelText('Pescoço'), '40')
    expect(await screen.findByText(/18,4%/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Braço esq.'), '38,5')
    await user.click(screen.getByRole('button', { name: /salvar medidas/i }))
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ measured_on: '2026-11-08', waist_cm: 90, neck_cm: 40, arm_left_cm: 38.5 }))
    expect(pushMock).toHaveBeenCalledWith('/checkin/history?aba=medidas')
  })

  it('sem altura/sexo no perfil, avisa que falta completar o perfil', async () => {
    getProfileMock.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<MeasurementForm />)
    await user.type(await screen.findByLabelText('Cintura'), '90')
    await user.type(screen.getByLabelText('Pescoço'), '40')
    expect(await screen.findByText(/altura e sexo no perfil/i)).toBeInTheDocument()
  })

  it('% de aparelho fica oculto até "Tenho uma medição de aparelho" (FR-011) e exige a origem', async () => {
    const user = userEvent.setup()
    render(<MeasurementForm />)
    await screen.findByLabelText('Cintura')
    expect(screen.queryByLabelText('% de gordura')).not.toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: /tenho uma medição de aparelho/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.type(screen.getByLabelText('% de gordura'), '18')
    await user.click(screen.getByRole('button', { name: /salvar medidas/i }))
    expect(await screen.findByText(/escolha a origem/i)).toBeInTheDocument()
    expect(createMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Bioimpedância' }))
    await user.click(screen.getByRole('button', { name: /salvar medidas/i }))
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ body_fat_device_pct: 18, body_fat_device_source: 'bioimpedancia' }))
  })

  it('medida fora do limite mostra erro no campo e não salva', async () => {
    const user = userEvent.setup()
    render(<MeasurementForm />)
    const neck = await screen.findByLabelText('Pescoço')
    await user.type(neck, '15')
    await user.click(screen.getByRole('button', { name: /salvar medidas/i }))
    expect(neck).toHaveAttribute('aria-invalid', 'true')
    expect(neck).toHaveAccessibleDescription(/pescoço.*entre 20 e 70/i)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('formulário vazio não salva', async () => {
    const user = userEvent.setup()
    render(<MeasurementForm />)
    await screen.findByLabelText('Cintura')
    await user.click(screen.getByRole('button', { name: /salvar medidas/i }))
    expect(await screen.findByText(/preencha pelo menos uma medida/i)).toBeInTheDocument()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('quando o servidor não conseguiu estimar (inconsistente), explica antes de sair', async () => {
    createMock.mockResolvedValue({ ...saved(), navy_status: 'inconsistente' })
    const user = userEvent.setup()
    render(<MeasurementForm />)
    await user.type(await screen.findByLabelText('Cintura'), '40')
    await user.type(screen.getByLabelText('Pescoço'), '41')
    await user.click(screen.getByRole('button', { name: /salvar medidas/i }))
    expect(await screen.findByText(/medidas salvas.*parecem inconsistentes/i)).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(pushMock).toHaveBeenCalled()
  })

  it('modo edição: preenche os valores, atualiza e permite apagar', async () => {
    const m = { id: 'm9', measured_on: '2026-10-01', waist_cm: 91, arm_right_cm: 38, created_at: 'x' }
    const user = userEvent.setup()
    render(<MeasurementForm measurement={m} />)
    expect(await screen.findByLabelText('Cintura')).toHaveValue('91')
    expect(screen.getByLabelText('Braço dir.')).toHaveValue('38')
    await user.click(screen.getByRole('button', { name: /salvar medidas/i }))
    expect(updateMock).toHaveBeenCalledWith('m9', expect.objectContaining({ measured_on: '2026-10-01', waist_cm: 91 }))

    await user.click(screen.getByRole('button', { name: 'Apagar registro' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Apagar' }))
    expect(deleteMock).toHaveBeenCalledWith('m9')
  })

  it('com returnTo, volta para a origem (Nutrição)', async () => {
    const user = userEvent.setup()
    render(<MeasurementForm returnTo="/nutricao" />)
    await user.type(await screen.findByLabelText('Cintura'), '90')
    await user.click(screen.getByRole('button', { name: /salvar medidas/i }))
    await vi.waitFor(() => expect(pushMock).toHaveBeenCalledWith('/nutricao'))
  })
})
