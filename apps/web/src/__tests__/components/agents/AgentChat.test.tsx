import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/services/api-client'
import type { ChatEvent } from '@/services/agents.service'

const getConversationMock = vi.fn()
const startNewConversationMock = vi.fn()
const streamChatMock = vi.fn()
const resolveGuidanceMock = vi.fn()
const resolveProposalMock = vi.fn()
const deleteFactMock = vi.fn()
vi.mock('@/services/agents.service', () => ({
  getConversation: (...a: unknown[]) => getConversationMock(...a),
  startNewConversation: (...a: unknown[]) => startNewConversationMock(...a),
  streamChat: (...a: unknown[]) => streamChatMock(...a),
  resolveGuidance: (...a: unknown[]) => resolveGuidanceMock(...a),
  resolveProposal: (...a: unknown[]) => resolveProposalMock(...a),
  deleteFact: (...a: unknown[]) => deleteFactMock(...a),
}))

import { AgentChat } from '@/components/agents/AgentChat'

const SOURCES = { ativa: ['perfil', 'genetica'], vazia: ['exames'], desativada: [] }
const GUIDANCE = { id: 'g1', kind: 'restricao-seguranca', text: 'Evitar empurrar acima da cabeça', reason: 'dor no ombro', originAgent: 'medicina', status: 'pendente', startsAt: null, expiresAt: null, durationDays: 10, blockedPatterns: [], blockedExercises: [], createdAt: '' }

function replyWith(events: ChatEvent[]) {
  streamChatMock.mockImplementation(async (_c: string, _m: string, onEvent: (e: ChatEvent) => void) => {
    for (const e of events) onEvent(e)
  })
}

describe('AgentChat (022 T024)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getConversationMock.mockResolvedValue({
      conversation: { id: 'c1', channel: 'medicina', startedAt: '' },
      messages: [
        { id: 'm1', role: 'user', agent: null, content: 'Oi', sourcesUsed: null, createdAt: '' },
        { id: 'm2', role: 'agent', agent: 'medicina', content: 'Olá! Como posso ajudar?', sourcesUsed: SOURCES, createdAt: '' },
      ],
    })
  })

  it('carrega o histórico com o especialista de cada resposta', async () => {
    render(<AgentChat channel="medicina" />)
    expect(await screen.findByText('Olá! Como posso ajudar?')).toBeInTheDocument()
    expect(screen.getAllByText('Medicina Esportiva').length).toBeGreaterThan(0)
  })

  it('envia, mostra a resposta em streaming e os cartões de relato, orientação e encaminhamento', async () => {
    replyWith([
      { event: 'start', data: { userMessageId: 'u2' } },
      { event: 'delta', data: { text: 'Pare o supino ' } },
      { event: 'fact', data: { fact: { id: 'f1', category: 'sintoma', text: 'dor no ombro direito', originAgent: 'medicina', createdAt: '', updatedAt: '' } } },
      { event: 'proposal', data: { guidance: GUIDANCE as never } },
      { event: 'handoff', data: { to: 'treino', reason: 'ajustar o treino da semana' } },
      { event: 'delta', data: { text: 'por 10 dias.' } },
      { event: 'done', data: { agentMessageId: 'a2', agent: 'medicina', sourcesUsed: SOURCES as never } },
    ])
    resolveGuidanceMock.mockResolvedValue({ ...GUIDANCE, status: 'ativa' })
    const onHandoff = vi.fn()
    const user = userEvent.setup()
    render(<AgentChat channel="medicina" onHandoff={onHandoff} />)
    await screen.findByText('Olá! Como posso ajudar?')

    await user.type(screen.getByLabelText(/mensagem/i), 'dor no ombro no supino')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(streamChatMock).toHaveBeenCalledWith('medicina', 'dor no ombro no supino', expect.any(Function))
    expect(screen.getByText('dor no ombro no supino')).toBeInTheDocument()
    expect(await screen.findByText('Pare o supino por 10 dias.')).toBeInTheDocument()
    expect(screen.getByText(/anotei: dor no ombro direito/i)).toBeInTheDocument()

    const card = screen.getByRole('region', { name: /orientação proposta/i })
    expect(within(card).getByText('Evitar empurrar acima da cabeça')).toBeInTheDocument()
    await user.click(within(card).getByRole('button', { name: /aceitar/i }))
    expect(resolveGuidanceMock).toHaveBeenCalledWith('g1', 'accept')
    expect(await within(card).findByText(/ativa/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /continuar com Agente de Treino/i }))
    expect(onHandoff).toHaveBeenCalledWith('treino')
    expect(screen.getAllByText(/Fontes: Perfil, Genética/)).toHaveLength(2)
  })

  it('chat Equipe mostra quem está respondendo (routed)', async () => {
    getConversationMock.mockResolvedValue({ conversation: null, messages: [] })
    replyWith([
      { event: 'start', data: { userMessageId: 'u1' } },
      { event: 'routed', data: { agent: 'nutricao', reason: 'pergunta de alimentação' } },
      { event: 'delta', data: { text: 'Banana com whey isolado.' } },
      { event: 'done', data: { agentMessageId: 'a1', agent: 'nutricao', sourcesUsed: SOURCES as never } },
    ])
    const user = userEvent.setup()
    render(<AgentChat channel="equipe" />)
    await user.type(await screen.findByLabelText(/mensagem/i), 'o que comer antes?')
    await user.click(screen.getByRole('button', { name: /enviar/i }))
    expect(await screen.findByText('Banana com whey isolado.')).toBeInTheDocument()
    expect(screen.getByText('Nutrição Genética')).toBeInTheDocument()
  })

  it('teto atingido: mensagem com link para o Perfil Integrado', async () => {
    streamChatMock.mockRejectedValue(new ApiError('Teto mensal de IA atingido', undefined, 'budget-exceeded'))
    const user = userEvent.setup()
    render(<AgentChat channel="medicina" />)
    await user.type(await screen.findByLabelText(/mensagem/i), 'x')
    await user.click(screen.getByRole('button', { name: /enviar/i }))
    expect(await screen.findByText(/teto mensal de IA/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /aumentar o teto/i })).toHaveAttribute('href', '/perfil/integrado')
  })

  it('erro no meio do stream: avisa e mantém o que já veio', async () => {
    replyWith([
      { event: 'start', data: { userMessageId: 'u2' } },
      { event: 'delta', data: { text: 'Comecei a' } },
      { event: 'error', data: { message: 'O serviço de IA não respondeu.', code: 'ai-unavailable' } },
    ])
    const user = userEvent.setup()
    render(<AgentChat channel="medicina" />)
    await user.type(await screen.findByLabelText(/mensagem/i), 'x')
    await user.click(screen.getByRole('button', { name: /enviar/i }))
    expect(await screen.findByText(/O serviço de IA não respondeu/)).toBeInTheDocument()
  })

  it('nova conversa limpa o histórico', async () => {
    startNewConversationMock.mockResolvedValue({ id: 'c2', channel: 'medicina', startedAt: '' })
    const user = userEvent.setup()
    render(<AgentChat channel="medicina" />)
    await screen.findByText('Olá! Como posso ajudar?')
    await user.click(screen.getByRole('button', { name: /nova conversa/i }))
    expect(startNewConversationMock).toHaveBeenCalledWith('medicina')
    expect(screen.queryByText('Olá! Como posso ajudar?')).not.toBeInTheDocument()
  })
})
