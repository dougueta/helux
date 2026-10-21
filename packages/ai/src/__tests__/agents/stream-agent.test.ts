import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SOURCE_KEYS, type AgentStreamEvent, type IntegratedProfile } from '@helux/types'

const { mockStream } = vi.hoisted(() => ({ mockStream: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn(() => ({ beta: { messages: { stream: mockStream } } })) }))

import { streamAgentReply, type AgentToolHandler } from '../../agents/stream-agent'
import { AgentRefusalError } from '../../agents/client'

const PROFILE: IntegratedProfile = {
  generatedAt: '2026-10-20T10:00:00Z',
  sources: Object.fromEntries(SOURCE_KEYS.map(k => [k, { status: 'vazia', updatedAt: null, summary: '', data: null }])) as IntegratedProfile['sources'],
}
const DAY = { date: '2026-10-20', todaySession: 'B — Costas', tiredness: 'normal', notices: [] }
const USAGE = { input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 5000 }

type Block = { type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: unknown }

/** Stream falso: emite os deltas de texto ao chamar finalMessage. */
function fakeStream(content: Block[], stop_reason = 'end_turn') {
  const listeners: ((d: string) => void)[] = []
  return {
    on(event: string, cb: (d: string) => void) {
      if (event === 'text') listeners.push(cb)
      return this
    },
    async finalMessage() {
      for (const b of content) if (b.type === 'text') for (const chunk of b.text.match(/.{1,5}/g) ?? []) listeners.forEach(l => l(chunk))
      return { model: 'claude-opus-5-5', stop_reason, content, usage: USAGE }
    },
  }
}

const handler = vi.fn<AgentToolHandler>(async call => {
  if (call.name === 'record_conversation_fact') {
    return { content: 'Relato registrado.', event: { type: 'fact' as const, fact: { id: 'f1', category: call.value.category, text: call.value.text, originAgent: 'medicina' as const, createdAt: '', updatedAt: '' } } }
  }
  return { content: 'ok' }
})

beforeEach(() => {
  mockStream.mockReset()
  handler.mockClear()
})

describe('streamAgentReply (022 T022)', () => {
  it('pedido: Opus 5.5, effort low, fallback, ferramentas do agente e 3 blocos de sistema com cache', async () => {
    mockStream.mockReturnValueOnce(fakeStream([{ type: 'text', text: 'Olá!' }]))
    await streamAgentReply({ agent: 'medicina', profile: PROFILE, dayContext: DAY, history: [], userMessage: 'Oi', handleTool: handler, onEvent: vi.fn() })
    const p = mockStream.mock.calls[0][0]
    expect(p).toMatchObject({ model: 'claude-opus-5-5', output_config: { effort: 'low' }, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default', tool_choice: { type: 'auto' }, cache_control: { type: 'ephemeral' } })
    expect(p.tools.map((t: { name: string }) => t.name)).toEqual(['record_conversation_fact', 'propose_shared_guidance', 'suggest_specialist'])
    expect(p.system[0]).toMatchObject({ cache_control: { type: 'ephemeral', ttl: '1h' } })
    expect(p.system[0].text).toContain('Medicina Esportiva')
    expect(p.system[1]).toMatchObject({ cache_control: { type: 'ephemeral' } })
    expect(p.system[2].cache_control).toBeUndefined()
    expect(p.system[2].text).toContain('2026-10-20')
    expect(p.messages).toEqual([{ role: 'user', content: 'Oi' }])
  })

  it('repassa os deltas e devolve o texto, o api_content e o uso', async () => {
    mockStream.mockReturnValueOnce(fakeStream([{ type: 'text', text: 'Descanse hoje.' }]))
    const events: AgentStreamEvent[] = []
    const r = await streamAgentReply({ agent: 'treino', profile: PROFILE, dayContext: DAY, history: [], userMessage: 'Oi', handleTool: handler, onEvent: e => events.push(e) })
    expect(events.filter(e => e.type === 'delta').map(e => (e as { text: string }).text).join('')).toBe('Descanse hoje.')
    expect(r.text).toBe('Descanse hoje.')
    expect(r.apiContent).toEqual([{ role: 'assistant', content: [{ type: 'text', text: 'Descanse hoje.' }] }])
    expect(r.usages[0]).toMatchObject({ operation: 'chat', agent: 'treino', cache_read_input_tokens: 5000 })
  })

  it('laço de ferramentas: valida, executa, devolve todos os tool_result numa mensagem e continua', async () => {
    mockStream
      .mockReturnValueOnce(
        fakeStream(
          [
            { type: 'text', text: 'Anotei. ' },
            { type: 'tool_use', id: 't1', name: 'record_conversation_fact', input: { category: 'sintoma', text: 'dor no ombro' } },
            { type: 'tool_use', id: 't2', name: 'record_conversation_fact', input: { category: 'xx', text: 'a' } },
          ],
          'tool_use',
        ),
      )
      .mockReturnValueOnce(fakeStream([{ type: 'text', text: 'Procure avaliação.' }]))
    const events: AgentStreamEvent[] = []
    const r = await streamAgentReply({ agent: 'medicina', profile: PROFILE, dayContext: DAY, history: [], userMessage: 'dor', handleTool: handler, onEvent: e => events.push(e) })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(events.find(e => e.type === 'fact')).toBeTruthy()
    const second = mockStream.mock.calls[1][0].messages
    expect(second).toHaveLength(3)
    expect(second[2].role).toBe('user')
    expect(second[2].content).toEqual([
      { type: 'tool_result', tool_use_id: 't1', content: 'Relato registrado.' },
      { type: 'tool_result', tool_use_id: 't2', content: expect.stringMatching(/relato inválido/), is_error: true },
    ])
    expect(r.text).toBe('Anotei. Procure avaliação.')
    expect(r.apiContent).toHaveLength(3)
    expect(r.usages).toHaveLength(2)
  })

  it('ferramenta fora do agente → is_error sem executar', async () => {
    mockStream
      .mockReturnValueOnce(fakeStream([{ type: 'tool_use', id: 't1', name: 'propose_session_adjustment', input: { request: 'x', scope: 'hoje' } }], 'tool_use'))
      .mockReturnValueOnce(fakeStream([{ type: 'text', text: 'ok' }]))
    await streamAgentReply({ agent: 'nutricao', profile: PROFILE, dayContext: DAY, history: [], userMessage: 'x', handleTool: handler, onEvent: vi.fn() })
    expect(handler).not.toHaveBeenCalled()
    expect(mockStream.mock.calls[1][0].messages[2].content[0]).toMatchObject({ is_error: true })
  })

  it('no máximo 3 iterações de ferramentas', async () => {
    mockStream.mockImplementation(() => fakeStream([{ type: 'tool_use', id: 't', name: 'suggest_specialist', input: { to: 'medicina', reason: 'x' } }], 'tool_use'))
    await streamAgentReply({ agent: 'treino', profile: PROFILE, dayContext: DAY, history: [], userMessage: 'x', handleTool: handler, onEvent: vi.fn() })
    expect(mockStream).toHaveBeenCalledTimes(4)
    expect(handler).toHaveBeenCalledTimes(3)
  })

  it('max_tokens com tool_use: não executa a ferramenta', async () => {
    mockStream.mockReturnValueOnce(fakeStream([{ type: 'text', text: 'parcial' }, { type: 'tool_use', id: 't', name: 'suggest_specialist', input: { to: 'medicina' } }], 'max_tokens'))
    const r = await streamAgentReply({ agent: 'treino', profile: PROFILE, dayContext: DAY, history: [], userMessage: 'x', handleTool: handler, onEvent: vi.fn() })
    expect(handler).not.toHaveBeenCalled()
    expect(r.text).toBe('parcial')
  })

  it('recusa → AgentRefusalError', async () => {
    mockStream.mockReturnValueOnce(fakeStream([], 'refusal'))
    await expect(streamAgentReply({ agent: 'treino', profile: PROFILE, dayContext: DAY, history: [], userMessage: 'x', handleTool: handler, onEvent: vi.fn() })).rejects.toBeInstanceOf(AgentRefusalError)
  })

  it('histórico vai antes da mensagem nova, sem alteração', async () => {
    mockStream.mockReturnValueOnce(fakeStream([{ type: 'text', text: 'ok' }]))
    const history = [
      { role: 'user' as const, content: 'antes' },
      { role: 'assistant' as const, content: [{ type: 'text' as const, text: 'resposta' }] },
    ]
    await streamAgentReply({ agent: 'treino', profile: PROFILE, dayContext: DAY, history, userMessage: 'agora', handleTool: handler, onEvent: vi.fn() })
    expect(mockStream.mock.calls[0][0].messages).toEqual([...history, { role: 'user', content: 'agora' }])
  })

  it('métricas para o log (R13): latência, primeiro texto, stop_reason e rodadas', async () => {
    mockStream.mockReturnValueOnce(fakeStream([{ type: 'text', text: 'ok' }]))
    const r = await streamAgentReply({ agent: 'treino', profile: PROFILE, dayContext: DAY, history: [], userMessage: 'x', handleTool: handler, onEvent: vi.fn() })
    expect(r.metrics).toMatchObject({ stopReason: 'end_turn', iterations: 1, fallbackUsed: false })
    expect(r.metrics.latencyMs).toBeGreaterThanOrEqual(0)
    expect(r.metrics.firstTokenMs).toBeGreaterThanOrEqual(0)
  })
})
