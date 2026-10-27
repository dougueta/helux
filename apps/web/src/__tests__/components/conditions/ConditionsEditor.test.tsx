import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Spec 024 T060 — editor de condições de saúde.

const RULES_LCA = { maxJointStress: { joelho: 1 }, blockedPatterns: [], blockedExercises: [], maxCardioImpact: 1, minRir: null, cues: ['Joelho alinhado'], medicalNoteOnFlare: false }
const RULES_GOTA = { maxJointStress: {}, blockedPatterns: [], blockedExercises: [], maxCardioImpact: 1, minRir: null, cues: ['Beba água'], medicalNoteOnFlare: true }
const CATALOG = [
  { key: 'lca-reconstrucao', label: 'Reconstrução de LCA', regions: ['joelho'], rules: RULES_LCA },
  { key: 'gota', label: 'Gota', regions: ['sistemica', 'joelho', 'tornozelo'], rules: RULES_GOTA },
]
const GOTA = { id: 'g1', catalogKey: 'gota', customLabel: null, region: 'sistemica', side: null, since: null, count: 1, status: 'controlada', notes: null, flare: null, rules: RULES_GOTA }

const getMock = vi.fn()
const createMock = vi.fn()
const deleteMock = vi.fn()
const startFlareMock = vi.fn()
const endFlareMock = vi.fn()
vi.mock('@/services/conditions.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/conditions.service')>()
  return {
    ...actual,
    getConditions: () => getMock(),
    createCondition: (...a: unknown[]) => createMock(...a),
    deleteCondition: (...a: unknown[]) => deleteMock(...a),
    updateCondition: vi.fn(),
    startFlare: (...a: unknown[]) => startFlareMock(...a),
    endFlare: (...a: unknown[]) => endFlareMock(...a),
  }
})
const resolveGuidanceMock = vi.fn()
vi.mock('@/services/agents.service', () => ({ resolveGuidance: (...a: unknown[]) => resolveGuidanceMock(...a) }))

import { ConditionsEditor } from '@/components/conditions/ConditionsEditor'

describe('ConditionsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue({ conditions: [GOTA], catalog: CATALOG })
  })

  it('lista as condições com as regras em linguagem simples', async () => {
    render(<ConditionsEditor />)
    const item = await screen.findByRole('listitem', { name: /gota/i })
    expect(within(item).getByText(/beba água/i)).toBeInTheDocument()
    expect(within(item).getByText(/cardio impacto baixo/i)).toBeInTheDocument()
  })

  it('adiciona do catálogo com região, lado, quantidade e estado', async () => {
    createMock.mockResolvedValue({ condition: {}, rules: RULES_LCA })
    const user = userEvent.setup()
    render(<ConditionsEditor />)
    await screen.findByRole('listitem', { name: /gota/i })
    await user.selectOptions(screen.getByLabelText(/^condição$/i), 'lca-reconstrucao')
    await user.selectOptions(screen.getByLabelText(/lado/i), 'esquerdo')
    await user.clear(screen.getByLabelText(/quantas vezes/i))
    await user.type(screen.getByLabelText(/quantas vezes/i), '2')
    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    expect(createMock).toHaveBeenCalledWith({ catalogKey: 'lca-reconstrucao', region: 'joelho', side: 'esquerdo', count: 2, status: 'controlada' })
    expect(getMock).toHaveBeenCalledTimes(2)
  })

  it('"outra": descreve, recebe regras propostas e aceita uma', async () => {
    createMock.mockResolvedValue({
      condition: { id: 'o1' },
      proposedGuidance: [{ id: 'sg1', kind: 'restricao-seguranca', text: 'Sem saltos', reason: 'impacto', status: 'pendente', blockedPatterns: [], blockedExercises: [] }],
    })
    resolveGuidanceMock.mockResolvedValue({})
    const user = userEvent.setup()
    render(<ConditionsEditor />)
    await screen.findByRole('listitem', { name: /gota/i })
    await user.selectOptions(screen.getByLabelText(/^condição$/i), 'outra')
    await user.type(screen.getByLabelText(/qual condição/i), 'Fascite plantar')
    await user.selectOptions(screen.getByLabelText(/região/i), 'tornozelo')
    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ customLabel: 'Fascite plantar', region: 'tornozelo' }))
    const proposal = await screen.findByRole('group', { name: /regras propostas/i })
    await user.click(within(proposal).getByRole('button', { name: /aceitar/i }))
    expect(resolveGuidanceMock).toHaveBeenCalledWith('sg1', 'accept')
  })

  it('marca e encerra a crise de gota', async () => {
    startFlareMock.mockResolvedValue(undefined)
    localStorage.setItem('helux:workout-plan', '{"mesocycleId":"m1"}')
    const user = userEvent.setup()
    render(<ConditionsEditor />)
    const item = await screen.findByRole('listitem', { name: /gota/i })
    await user.selectOptions(within(item).getByLabelText(/onde é a crise/i), 'joelho')
    await user.click(within(item).getByRole('button', { name: /marcar crise/i }))
    expect(startFlareMock).toHaveBeenCalledWith('g1', 'joelho')
    // PR #19: a Home não pode mostrar o treino de antes da crise.
    await waitFor(() => expect(localStorage.getItem('helux:workout-plan')).toBeNull())
  })

  it('crise ativa aparece com o prazo e pode ser encerrada', async () => {
    getMock.mockResolvedValue({ conditions: [{ ...GOTA, flare: { region: 'joelho', until: '2026-10-29' } }], catalog: CATALOG })
    const user = userEvent.setup()
    render(<ConditionsEditor />)
    const item = await screen.findByRole('listitem', { name: /gota/i })
    await waitFor(() => expect(item).toHaveTextContent(/crise no joelho até 29\/10/i))
    await user.click(within(item).getByRole('button', { name: /a crise acabou/i }))
    expect(endFlareMock).toHaveBeenCalledWith('g1')
  })

  it('remove uma condição', async () => {
    deleteMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ConditionsEditor />)
    const item = await screen.findByRole('listitem', { name: /gota/i })
    await user.click(within(item).getByRole('button', { name: /remover/i }))
    expect(deleteMock).toHaveBeenCalledWith('g1')
  })
})
