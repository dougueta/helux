/**
 * Lista de pendências fixa para os testes da tela (028): os supinos seguem "pendentes" aqui, para que os
 * testes do caminho antigo (animação salva no plano, dicas do plano) não dependam do andamento da revisão.
 * Uso: `vi.mock('@helux/exercises', async (io) => (await import('.../helpers/exercises-pending')).withTestPending(io))`.
 */
export const TEST_PENDING = ['supino-reto-barra', 'supino-reto-halteres', 'supino-maquina']

export async function withTestPending(importOriginal: () => Promise<unknown>) {
  const actual = (await importOriginal()) as typeof import('@helux/exercises')
  return { ...actual, resolvePlannedItem: actual.createResolver({ pending: new Set(TEST_PENDING) }) }
}
