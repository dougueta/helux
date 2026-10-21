import http from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * Substituto determinístico da API da Anthropic para a suíte e2e (spec 017).
 * Implementa só `POST /v1/messages` (inclusive `?beta=true`), devolvendo
 * sempre o mesmo mesociclo, no formato que `generateMesocyclePlan` (@helux/ai)
 * espera: saída estruturada (JSON puro) e, com `stream: true`, em SSE como a
 * API real (spec 022). A API aponta para cá via ANTHROPIC_BASE_URL.
 */
export interface FakeAnthropic {
  url: string
  readonly calls: number
  close(): Promise<void>
}

const exercise = (name: string, sets: number, weight: string) => ({ phase: 'principal', name, sets, reps: '8-10', weight, notes: null, supersetGroup: null })

// Nomes do EXERCISE_BANK, para o enriquecimento (músculo, variantes) acontecer como em produção.
export const FAKE_MESOCYCLE = {
  daysPerWeek: 4,
  splitType: 'Upper/Lower',
  rationale: 'Mesociclo fixo da IA simulada (e2e).',
  sessions: [
    { letter: 'A', focus: 'Inferior', exercises: [exercise('Agachamento Livre (Barra)', 4, '80kg'), exercise('Leg Press 45°', 3, '150kg')] },
    { letter: 'B', focus: 'Superior', exercises: [exercise('Supino Reto (Barra)', 4, '60kg')] },
    { letter: 'C', focus: 'Inferior', exercises: [exercise('Levantamento Terra (Barra)', 4, '100kg')] },
    { letter: 'D', focus: 'Superior', exercises: [exercise('Remada Curvada (Barra)', 4, '60kg')] },
  ],
  decisions: [{ topic: 'divisao', choice: 'Upper/Lower', sources: ['perfil'], reason: 'Mesociclo fixo da IA simulada (e2e).' }],
}

/** Eventos SSE de uma resposta de texto, no formato da API de mensagens. */
function sseMessage(id: string, text: string): string {
  const ev = (event: string, data: unknown) => `event: ${event}
data: ${JSON.stringify(data)}

`
  const usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
  return [
    ev('message_start', { type: 'message_start', message: { id, type: 'message', role: 'assistant', model: 'fake', content: [], stop_reason: null, stop_sequence: null, usage } }),
    ev('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }),
    ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } }),
    ev('content_block_stop', { type: 'content_block_stop', index: 0 }),
    ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 0 } }),
    ev('message_stop', { type: 'message_stop' }),
  ].join('')
}

export async function startFakeAnthropic(): Promise<FakeAnthropic> {
  let calls = 0

  const server = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      const path = (req.url ?? '').split('?')[0]
      if (req.method !== 'POST' || path !== '/v1/messages') {
        res.writeHead(404, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: req.url } }))
        return
      }
      calls++
      const id = `msg_fake_${calls}`
      const text = JSON.stringify(FAKE_MESOCYCLE)
      let stream = false
      try {
        stream = (JSON.parse(raw) as { stream?: boolean }).stream === true
      } catch {
        // corpo vazio ou inválido: resposta simples
      }
      if (stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' })
        res.end(sseMessage(id, text))
        return
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          id,
          type: 'message',
          role: 'assistant',
          model: 'fake',
          stop_reason: 'end_turn',
          stop_sequence: null,
          content: [{ type: 'text', text }],
          usage: { input_tokens: 0, output_tokens: 0 },
        }),
      )
    })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}`,
    get calls() {
      return calls
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections()
        server.close((err) => (err ? reject(err) : resolve()))
      }),
  }
}
