import type { GeneticProfileView } from '@helux/types'

/** Resultado da leitura do perfil genético (spec 017, FR-010). */
export type DnaState =
  | { status: 'ok'; profile: GeneticProfileView }
  | { status: 'missing' }
  | { status: 'error' }

/**
 * Lê `GET /genetic-profile` no servidor. 404 = teste não carregado;
 * qualquer outra falha (status, rede, JSON) = erro de carregamento.
 */
export async function loadGeneticProfile(): Promise<DnaState> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/genetic-profile`, {
      next: { revalidate: 3600 },
    } as RequestInit)
    if (res.status === 404) return { status: 'missing' }
    if (!res.ok) return { status: 'error' }
    const body = (await res.json()) as Partial<GeneticProfileView> | null
    if (!body || typeof body !== 'object') return { status: 'error' }
    const traits = Array.isArray(body.traits) ? body.traits : []
    return { status: 'ok', profile: { ...(body as GeneticProfileView), traits } }
  } catch {
    return { status: 'error' }
  }
}
