import { CARDIO_BANK } from '@helux/types'
import { CARDIO_GUIDANCE } from './cardio-guidance'
import { DEMO_SPECS } from './demos'
import { PREPARATION_ITEMS } from './preparation'
import { STRENGTH_EXERCISES } from './strength'
import type { CatalogItem, CatalogKind, Gear } from './types'

/** Item de qualquer catálogo, com o implemento esperado na demonstração. */
export interface CatalogEntry extends CatalogItem {
  /** implemento que a demonstração deve usar; null quando o catálogo não define um */
  gear: Gear | null
}

/** Todos os itens dos três catálogos, na ordem força → preparação → cardio, com a demonstração do registro. */
export const CATALOG: CatalogEntry[] = [
  ...STRENGTH_EXERCISES.map((e) => ({ ...e, demo: e.demo ?? DEMO_SPECS[e.id] })),
  ...PREPARATION_ITEMS.map((p) => ({ ...p, demo: p.demo ?? DEMO_SPECS[p.id], gear: null })),
  ...CARDIO_BANK.map((c) => ({
    id: c.id,
    name: c.name,
    kind: 'cardio' as CatalogKind,
    guidance: CARDIO_GUIDANCE[c.id]?.guidance,
    demo: CARDIO_GUIDANCE[c.id]?.demo ?? DEMO_SPECS[c.id],
    gear: null,
  })),
]

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]))

export function findCatalogItem(id: string): CatalogEntry | undefined {
  return BY_ID.get(id)
}
