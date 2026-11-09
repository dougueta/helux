import type { ResolvedDemo } from './engine/types'

/** Demonstração resolvida do item, carregada sob demanda (chunk separado na web). Null se não houver. */
export async function loadDemo(id: string): Promise<ResolvedDemo | null> {
  const { resolveDemo } = await import('./demos')
  return resolveDemo(id)
}
