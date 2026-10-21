/** Evento SSE já decodificado (spec 022: chat dos agentes). */
export interface SSEEvent {
  event: string
  data: unknown
}

/**
 * Lê um corpo `text/event-stream` (via `fetch`, porque o EventSource não envia
 * `Authorization`) e chama `onEvent` a cada bloco `event:`/`data:` completo.
 */
export async function readSSE(body: ReadableStream<Uint8Array>, onEvent: (e: SSEEvent) => void): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (value) buffer += decoder.decode(value, { stream: true })
    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      const event = /^event: ?(.*)$/m.exec(block)?.[1]
      const raw = /^data: ?(.*)$/m.exec(block)?.[1]
      if (!event || raw === undefined) continue
      try {
        onEvent({ event, data: JSON.parse(raw) })
      } catch {
        // bloco malformado: ignora
      }
    }
    if (done) break
  }
}
