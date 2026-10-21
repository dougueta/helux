import type { MockDataset, MockLocalStorageState } from './types'

export const MOCK_STATE_KEY = 'helux_mock_state_v1'

export interface MockStore {
  getDataset(): MockDataset
  /** Aplica um merge raso do retorno do updater e persiste. */
  updateDataset(updater: (current: MockDataset) => Partial<MockDataset>): MockDataset
  /** Restaura as fixtures da persona atual. */
  reset(): MockDataset
  /** Troca a persona e descarta as mutações. */
  loadPersona(personaId: string): MockDataset
  /** O estado salvo estava corrompido e foi descartado (aviso da Dev Bar). */
  wasCorrupted(): boolean
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/**
 * Estado mutável do modo mock (spec 021, US4): cópia do dataset da persona em
 * `localStorage`. Sem `window` (servidor), trabalha só em memória com as fixtures.
 */
export function createMockStore({
  factory,
  getPersonaId,
}: {
  factory: (personaId: string) => MockDataset
  getPersonaId: () => string
}): MockStore {
  let corrupted = false
  let state: MockLocalStorageState

  function fresh(personaId: string): MockLocalStorageState {
    return { version: 1, personaId, dataset: factory(personaId), updatedAt: new Date().toISOString() }
  }

  function save() {
    try {
      storage()?.setItem(MOCK_STATE_KEY, JSON.stringify(state))
    } catch {
      // quota ou modo privado: segue em memória
    }
  }

  function load(): MockLocalStorageState {
    const personaId = getPersonaId()
    const raw = storage()?.getItem(MOCK_STATE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as MockLocalStorageState
        if (parsed?.version === 1 && parsed.dataset && typeof parsed.dataset === 'object') {
          if (parsed.personaId === personaId) return parsed
          return fresh(personaId)
        }
      } catch {
        // cai no aviso abaixo
      }
      corrupted = true
    }
    return fresh(personaId)
  }

  state = load()
  save()

  return {
    getDataset: () => state.dataset,
    updateDataset(updater) {
      state = { ...state, dataset: { ...state.dataset, ...updater(state.dataset) }, updatedAt: new Date().toISOString() }
      save()
      return state.dataset
    },
    reset() {
      state = fresh(state.personaId)
      save()
      return state.dataset
    },
    loadPersona(personaId) {
      state = fresh(personaId)
      save()
      return state.dataset
    },
    wasCorrupted: () => corrupted,
  }
}
