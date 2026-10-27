import { CARDIO_BANK, type CardioBankEntry } from '@helux/types'

// O catálogo vive em @helux/types (a web também usa); aqui fica a busca.
export { CARDIO_BANK, type CardioBankEntry } from '@helux/types'

const BY_ID = new Map(CARDIO_BANK.map(e => [e.id, e]))
const BY_NAME = new Map(CARDIO_BANK.map(e => [e.name, e]))

/** Modalidade de cardio pelo id ou pelo nome. */
export function findCardio(idOrName: string): CardioBankEntry | undefined {
  return BY_ID.get(idOrName) ?? BY_NAME.get(idOrName)
}
