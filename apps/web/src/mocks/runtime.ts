import { getPersonaId } from '@/lib/data-source'
import { createMockRouter, type MockRouter } from './mock-router'
import { createMockStore, type MockStore } from './mock-store'
import { datasetForPersona } from './fixtures/personas'
import { registerMockRoutes } from './routes'

export interface MockRuntime {
  store: MockStore
  router: MockRouter
}

function build(store: MockStore): MockRuntime {
  const router = createMockRouter(store)
  registerMockRoutes(router)
  return { store, router }
}

let browser: MockRuntime | null = null

/** Store (localStorage) + roteador do navegador, criados na primeira requisição em modo mock. */
export function getBrowserMock(): MockRuntime {
  browser ??= build(createMockStore({ factory: datasetForPersona, getPersonaId }))
  return browser
}

/** Descarta a instância (troca de persona, reset e testes). */
export function resetBrowserMock(): void {
  browser = null
}

/** Servidor (R-C): dataset inicial da persona, sem estado local. */
export function getServerMock(personaId: string): MockRuntime {
  return build(createMockStore({ factory: datasetForPersona, getPersonaId: () => personaId }))
}
