/** Stream simulado do chat no modo mock (spec 021 + 022 R12) — completado na T034. */
export async function mockChatResponse(_body: string): Promise<Response> {
  return new Response(JSON.stringify({ error: 'Chat indisponível no modo mock' }), { status: 503 })
}
