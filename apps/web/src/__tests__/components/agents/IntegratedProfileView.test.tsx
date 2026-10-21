import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SOURCE_KEYS, type IntegratedProfile } from '@helux/types'

const getIntegratedProfileMock = vi.fn()
const setSourceEnabledMock = vi.fn()
const setBudgetCapMock = vi.fn()
const updateFactMock = vi.fn()
const deleteFactMock = vi.fn()
const removeGuidanceMock = vi.fn()
vi.mock('@/services/agents.service', () => ({
  getIntegratedProfile: () => getIntegratedProfileMock(),
  setSourceEnabled: (...a: unknown[]) => setSourceEnabledMock(...a),
  setBudgetCap: (...a: unknown[]) => setBudgetCapMock(...a),
  updateFact: (...a: unknown[]) => updateFactMock(...a),
  deleteFact: (...a: unknown[]) => deleteFactMock(...a),
  removeGuidance: (...a: unknown[]) => removeGuidanceMock(...a),
}))

import { IntegratedProfileView } from '@/components/agents/IntegratedProfileView'

function profile(pct = 25): IntegratedProfile & { budget: { capUsd: number; spentUsd: number; pct: number } } {
  const sources = Object.fromEntries(SOURCE_KEYS.map(k => [k, { status: 'vazia', updatedAt: null, summary: '', data: null }])) as IntegratedProfile['sources']
  sources.perfil = { status: 'ativa', updatedAt: '2026-09-01T10:00:00Z', summary: 'Objetivo: hipertrofia', data: null }
  sources.exames = { status: 'desativada', updatedAt: null, summary: '', data: null }
  sources.relatos = {
    status: 'ativa',
    updatedAt: '2026-10-19T10:00:00Z',
    summary: '- dor no ombro',
    data: [{ id: 'f1', category: 'sintoma', text: 'dor no ombro direito', originAgent: 'medicina', createdAt: '2026-10-19T10:00:00Z', updatedAt: '2026-10-19T10:00:00Z' }],
  }
  sources.restricoes = {
    status: 'ativa',
    updatedAt: '2026-10-19T10:00:00Z',
    summary: '- evitar',
    data: [{ id: 'g1', kind: 'restricao-seguranca', text: 'Evitar empurrar acima da cabeça', reason: 'dor no ombro', originAgent: 'medicina', status: 'ativa', startsAt: '2026-10-19T10:00:00Z', expiresAt: '2026-11-02T10:00:00Z', durationDays: 14, blockedPatterns: [], blockedExercises: [], createdAt: '' }],
  }
  return { generatedAt: '2026-10-20T10:00:00Z', sources, budget: { capUsd: 20, spentUsd: (20 * pct) / 100, pct } }
}

describe('IntegratedProfileView (022 T019, FR-002/003)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getIntegratedProfileMock.mockResolvedValue(profile())
  })

  it('lista as 12 fontes com status e data; vazia e desativada indicadas', async () => {
    render(<IntegratedProfileView />)
    const list = await screen.findByRole('list', { name: /fontes/i })
    expect(within(list).getAllByRole('listitem')).toHaveLength(12)
    const perfil = within(list).getByText('Perfil').closest('li')!
    expect(perfil).toHaveTextContent(/ativa/)
    expect(perfil).toHaveTextContent(/01\/09\/2026/)
    expect(within(list).getByText('Exames').closest('li')).toHaveTextContent(/desativada/)
    expect(within(list).getByText('Nutrição').closest('li')).toHaveTextContent(/sem dados/)
  })

  it('desligar uma fonte chama a API e recarrega', async () => {
    setSourceEnabledMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<IntegratedProfileView />)
    await user.click(await screen.findByRole('button', { name: /desativar Perfil/i }))
    expect(setSourceEnabledMock).toHaveBeenCalledWith('perfil', false)
    expect(getIntegratedProfileMock).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('button', { name: /ativar Exames/i }))
    expect(setSourceEnabledMock).toHaveBeenCalledWith('exames', true)
  })

  it('relatos editáveis e removíveis; restrição removível', async () => {
    updateFactMock.mockResolvedValue({})
    deleteFactMock.mockResolvedValue(undefined)
    removeGuidanceMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<IntegratedProfileView />)
    const fact = await screen.findByLabelText('relato 1')
    await user.clear(fact)
    await user.type(fact, 'dor no ombro direito ao supinar')
    await user.click(screen.getByRole('button', { name: /salvar relato 1/i }))
    expect(updateFactMock).toHaveBeenCalledWith('f1', 'dor no ombro direito ao supinar')
    await user.click(screen.getByRole('button', { name: /remover relato 1/i }))
    expect(deleteFactMock).toHaveBeenCalledWith('f1')
    expect(screen.getByText('Evitar empurrar acima da cabeça')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /remover restrição Evitar empurrar/i }))
    expect(removeGuidanceMock).toHaveBeenCalledWith('g1')
  })

  it('teto: consumo do mês, aviso em 80% e edição do teto', async () => {
    getIntegratedProfileMock.mockResolvedValue(profile(85))
    setBudgetCapMock.mockResolvedValue({ capUsd: 40, spentUsd: 17, pct: 43 })
    const user = userEvent.setup()
    render(<IntegratedProfileView />)
    expect(await screen.findByText(/US\$ 17,00 de US\$ 20,00/)).toBeInTheDocument()
    expect(screen.getByText(/85% do teto/i)).toBeInTheDocument()
    const cap = screen.getByLabelText(/teto mensal/i)
    await user.clear(cap)
    await user.type(cap, '40')
    await user.click(screen.getByRole('button', { name: /salvar teto/i }))
    expect(setBudgetCapMock).toHaveBeenCalledWith(40)
  })
})
