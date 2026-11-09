/**
 * Hash canônico do conteúdo revisado: demonstração resolvida (com a base) + orientação (R12, FR-025).
 * Usado só por testes e scripts. Fica fora de `src/index.ts` para `node:crypto` não entrar no bundle da web.
 */
import { createHash } from 'node:crypto'

/** JSON com chaves ordenadas e sem campos `undefined`. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : canonicalJson(v))).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`
}

export interface HashableContent {
  demo: unknown
  guidance: unknown
}

export function contentHash(content: HashableContent): string {
  return createHash('sha256').update(canonicalJson({ demo: content.demo ?? null, guidance: content.guidance ?? null })).digest('hex')
}
