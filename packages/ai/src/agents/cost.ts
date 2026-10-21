import type { UsageRecord } from '@helux/types'

/** Data da tabela de preços (atualizar junto com os valores). */
export const PRICING_VERSION = '2026-10-06'

interface Price {
  /** US$ por milhão de tokens. */
  input: number
  output: number
  cacheRead: number
}

const PRICES: Record<string, Price> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-opus-5': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
}

const DEFAULT_MODEL = 'claude-opus-5-5'
/** Escrita de cache: 1,25× a entrada (TTL 5 min) ou 2× (TTL 1 h). */
const CACHE_WRITE_FACTOR = { '5m': 1.25, '1h': 2 } as const

/** Custo em US$ de uma chamada, pelo `usage` da resposta e o modelo efetivo (R11). */
export function computeCostUsd(u: UsageRecord): number {
  const p = PRICES[u.model] ?? PRICES[DEFAULT_MODEL]
  const write = p.input * CACHE_WRITE_FACTOR[u.cacheTtl ?? '5m']
  const usd =
    u.input_tokens * p.input + u.output_tokens * p.output + u.cache_read_input_tokens * p.cacheRead + u.cache_creation_input_tokens * write
  return usd / 1_000_000
}
