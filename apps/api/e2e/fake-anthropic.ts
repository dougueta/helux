import http from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * Substituto determinístico da API da Anthropic para a suíte e2e (spec 017).
 * Implementa só `POST /v1/messages`, devolvendo sempre o mesmo mesociclo, no
 * formato que `generateMesocyclePlan` (@helux/ai) espera. A API aponta para
 * cá via ANTHROPIC_BASE_URL.
 */
export interface FakeAnthropic {
  url: string
  readonly calls: number
  close(): Promise<void>
}

const exercise = (name: string, sets: number, weight: string) => ({ name, sets, reps: '8-10', weight })

// Nomes do EXERCISE_BANK, para o enriquecimento (músculo, variantes) acontecer como em produção.
export const FAKE_MESOCYCLE = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  daysPerWeek: 4,
  splitType: 'Upper/Lower',
  rationale: 'Mesociclo fixo da IA simulada (e2e).',
  sessions: [
    { letter: 'A', focus: 'Inferior', exercises: [exercise('Agachamento Livre (Barra)', 4, '80kg'), exercise('Leg Press 45°', 3, '150kg')] },
    { letter: 'B', focus: 'Superior', exercises: [exercise('Supino Reto (Barra)', 4, '60kg')] },
    { letter: 'C', focus: 'Inferior', exercises: [exercise('Levantamento Terra (Barra)', 4, '100kg')] },
    { letter: 'D', focus: 'Superior', exercises: [exercise('Remada Curvada (Barra)', 4, '60kg')] },
  ],
}

export async function startFakeAnthropic(): Promise<FakeAnthropic> {
  let calls = 0

  const server = http.createServer((req, res) => {
    req.resume()
    req.on('end', () => {
      if (req.method !== 'POST' || req.url !== '/v1/messages') {
        res.writeHead(404, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: req.url } }))
        return
      }
      calls++
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          id: `msg_fake_${calls}`,
          type: 'message',
          role: 'assistant',
          model: 'fake',
          stop_reason: 'end_turn',
          stop_sequence: null,
          content: [{ type: 'text', text: '```json\n' + JSON.stringify(FAKE_MESOCYCLE) + '\n```' }],
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
