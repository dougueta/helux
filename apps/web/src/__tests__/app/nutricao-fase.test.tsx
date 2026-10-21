import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const getPhaseMock = vi.fn()
const startPhaseMock = vi.fn()
const endPhaseMock = vi.fn()
vi.mock('@/services/nutrition.service', () => ({
  getPhase: () => getPhaseMock(),
  startPhase: (...a: unknown[]) => startPhaseMock(...a),
  endPhase: () => endPhaseMock(),
  getToday: vi.fn().mockResolvedValue({ status: 'no-phase', missing: [] }),
  getHistory: vi.fn().mockResolvedValue([]),
}))

const upsertProfileMock = vi.fn()
vi.mock('@/services/profile.service', () => ({
  getProfile: vi.fn().mockResolvedValue(null),
  upsertProfile: (...a: unknown[]) => upsertProfileMock(...a),
}))

import { NutricaoClient } from '@/app/nutricao/NutricaoClient'

const TARGETS = { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 }
const PHASE = { id: 'phase-1', goal: 'perder_gordura', startedOn: '2026-09-01', durationWeeks: 8, status: 'ativa', baseTargets: { ...TARGETS, kcal: 2030 } }
const CALIBRATIONS = [
  { id: 'k2', action: 'reduzir', before: TARGETS, after: { ...TARGETS, kcal: 2030 }, reason: 'Peso −0,12%/sem, acima do esperado (−1 a −0,25%/sem): −150 kcal no carboidrato.', metrics: {}, createdAt: '2026-10-01T10:00:00Z' },
  { id: 'k1', action: 'inicial', before: null, after: TARGETS, reason: 'Fase iniciada: perder gordura por 8 semanas, a partir de 80 kg.', metrics: {}, createdAt: '2026-09-01T10:00:00Z' },
]

async function openFase() {
  const user = userEvent.setup()
  render(<NutricaoClient />)
  await user.click(await screen.findByRole('tab', { name: 'Fase' }))
  return user
}

describe('Nutrição › Fase (spec 018, US0)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tem as seções Hoje, Fase e Perfil genético (o chat foi para a 022)', async () => {
    getPhaseMock.mockResolvedValue({ phase: PHASE, calibrations: CALIBRATIONS, bodyFatPct: 18.4, missing: [] })
    render(<NutricaoClient />)
    const tabs = await screen.findAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Hoje', 'Fase', 'Perfil genético'])
  })

  it('fase ativa: objetivo, metas atuais, % de gordura e histórico de recalibrações', async () => {
    getPhaseMock.mockResolvedValue({ phase: PHASE, calibrations: CALIBRATIONS, bodyFatPct: 18.4, missing: [] })
    await openFase()

    expect(await screen.findByText('Perder gordura')).toBeInTheDocument()
    expect(screen.getByText('2030')).toBeInTheDocument()
    expect(screen.getByText(/176 g/)).toBeInTheDocument()
    expect(screen.getByText(/18,4%/)).toBeInTheDocument()

    const history = screen.getByRole('list', { name: 'Recalibrações' })
    const items = within(history).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Reduzir')).toBeInTheDocument()
    expect(within(items[0]).getByText(/2180 → 2030 kcal/)).toBeInTheDocument()
    expect(within(items[0]).getByText(/−150 kcal no carboidrato/)).toBeInTheDocument()
  })

  it('sem fase: escolhe objetivo e duração e inicia', async () => {
    getPhaseMock.mockResolvedValueOnce({ phase: null, calibrations: [], bodyFatPct: 18.4, missing: [] })
    getPhaseMock.mockResolvedValueOnce({ phase: PHASE, calibrations: CALIBRATIONS.slice(1), bodyFatPct: 18.4, missing: [] })
    startPhaseMock.mockResolvedValue({ phase: PHASE })
    const user = await openFase()

    await user.click(await screen.findByRole('button', { name: 'Ganhar massa' }))
    const weeks = screen.getByLabelText('Duração')
    await user.clear(weeks)
    await user.type(weeks, '12')
    await user.click(screen.getByRole('button', { name: /iniciar fase/i }))

    expect(startPhaseMock).toHaveBeenCalledWith('ganhar_massa', 12)
    expect(await screen.findByText('Perder gordura')).toBeInTheDocument()
  })

  it('duração fora de 4–52 semanas não envia', async () => {
    getPhaseMock.mockResolvedValue({ phase: null, calibrations: [], bodyFatPct: null, missing: [] })
    const user = await openFase()
    const weeks = await screen.findByLabelText('Duração')
    await user.clear(weeks)
    await user.type(weeks, '2')
    await user.click(screen.getByRole('button', { name: /iniciar fase/i }))
    expect(startPhaseMock).not.toHaveBeenCalled()
    expect(screen.getByText(/entre 4 e 52 semanas/i)).toBeInTheDocument()
  })

  it('faltando altura/nascimento/sexo: pede os dados e salva no perfil', async () => {
    getPhaseMock.mockResolvedValueOnce({ phase: null, calibrations: [], bodyFatPct: null, missing: ['heightCm', 'birthDate', 'sex'] })
    getPhaseMock.mockResolvedValueOnce({ phase: null, calibrations: [], bodyFatPct: null, missing: [] })
    upsertProfileMock.mockResolvedValue({})
    const user = await openFase()

    await user.type(await screen.findByLabelText(/altura/i), '180')
    await user.type(screen.getByLabelText(/data de nascimento/i), '1991-01-10')
    await user.click(screen.getByRole('button', { name: 'Masculino' }))
    await user.click(screen.getByRole('button', { name: /salvar dados/i }))

    expect(upsertProfileMock).toHaveBeenCalledWith({ heightCm: 180, birthDate: '1991-01-10', sex: 'masculino' })
    expect(await screen.findByRole('button', { name: /iniciar fase/i })).toBeInTheDocument()
  })

  it('sem check-in com peso: leva ao check-in', async () => {
    getPhaseMock.mockResolvedValue({ phase: null, calibrations: [], bodyFatPct: null, missing: ['checkinWeight'] })
    await openFase()
    expect(await screen.findByRole('link', { name: /fazer check-in/i })).toHaveAttribute('href', '/checkin?voltar=nutricao')
    expect(screen.queryByRole('button', { name: /iniciar fase/i })).not.toBeInTheDocument()
  })

  it('check-in com mais de 35 dias: pede um check-in atual antes de iniciar a fase (validação do usuário)', async () => {
    getPhaseMock.mockResolvedValue({ phase: null, calibrations: [], bodyFatPct: null, missing: ['checkinStale'] })
    await openFase()
    expect(await screen.findByText(/check-in mais recente tem mais de um mês/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /fazer check-in/i })).toHaveAttribute('href', '/checkin?voltar=nutricao')
    expect(screen.queryByRole('button', { name: /iniciar fase/i })).not.toBeInTheDocument()
  })

  it('perfil e check-in faltando: depois de salvar o perfil, pede o check-in', async () => {
    getPhaseMock.mockResolvedValueOnce({ phase: null, calibrations: [], bodyFatPct: null, missing: ['heightCm', 'birthDate', 'sex', 'checkinStale'] })
    getPhaseMock.mockResolvedValueOnce({ phase: null, calibrations: [], bodyFatPct: null, missing: ['checkinStale'] })
    upsertProfileMock.mockResolvedValue({})
    const user = await openFase()
    expect(await screen.findByText(/depois, um check-in/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/altura/i), '180')
    await user.type(screen.getByLabelText(/data de nascimento/i), '1991-01-10')
    await user.click(screen.getByRole('button', { name: 'Masculino' }))
    await user.click(screen.getByRole('button', { name: /salvar dados/i }))

    expect(await screen.findByRole('link', { name: /fazer check-in/i })).toBeInTheDocument()
  })

  it('fase que passou da duração avisa para iniciar a próxima', async () => {
    getPhaseMock.mockResolvedValue({ phase: { ...PHASE, startedOn: '2026-01-05' }, calibrations: CALIBRATIONS, bodyFatPct: null, missing: [] })
    await openFase()
    expect(await screen.findByText(/fase concluída/i)).toBeInTheDocument()
  })

  it('encerrar a fase', async () => {
    getPhaseMock.mockResolvedValueOnce({ phase: PHASE, calibrations: CALIBRATIONS, bodyFatPct: null, missing: [] })
    getPhaseMock.mockResolvedValueOnce({ phase: null, calibrations: [], bodyFatPct: null, missing: [] })
    endPhaseMock.mockResolvedValue({})
    const user = await openFase()
    await user.click(await screen.findByRole('button', { name: /encerrar fase/i }))
    expect(endPhaseMock).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: /iniciar fase/i })).toBeInTheDocument()
  })

  it('erro ao carregar mostra aviso', async () => {
    getPhaseMock.mockRejectedValue(new Error('boom'))
    await openFase()
    expect(await screen.findByText(/não foi possível carregar/i)).toBeInTheDocument()
  })
})
