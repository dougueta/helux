import { describe, it, expect } from 'vitest'
import { readSSE } from '@/lib/sse'

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch))
      c.close()
    },
  })
}

describe('readSSE (022 T024)', () => {
  it('eventos completos e quebrados entre pedaços', async () => {
    const out: { event: string; data: unknown }[] = []
    await readSSE(streamOf(['event: start\ndata: {"a":1}\n\nevent: del', 'ta\ndata: {"text":"Ol', 'á"}\n\n', 'event: done\ndata: {}\n\n']), e => out.push(e))
    expect(out).toEqual([
      { event: 'start', data: { a: 1 } },
      { event: 'delta', data: { text: 'Olá' } },
      { event: 'done', data: {} },
    ])
  })

  it('ignora blocos sem data ou com JSON inválido', async () => {
    const out: unknown[] = []
    await readSSE(streamOf([': ping\n\nevent: x\ndata: {oops\n\nevent: ok\ndata: 1\n\n']), e => out.push(e))
    expect(out).toEqual([{ event: 'ok', data: 1 }])
  })
})
