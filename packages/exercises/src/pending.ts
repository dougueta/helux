import pending from './review/pending.json'

/** Itens ainda não aprovados (R12). A lista só diminui. */
export const PENDING_IDS: ReadonlySet<string> = new Set(pending.ids)

/** O item está fora da lista de pendências e usa a demonstração nova (FR-032). */
export function isDemoReady(id: string): boolean {
  return !PENDING_IDS.has(id)
}
