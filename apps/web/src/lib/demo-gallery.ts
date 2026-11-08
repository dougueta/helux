import type { CatalogKind, Guidance, ResolvedDemo } from '@helux/exercises'
import { CATALOG, PENDING_IDS, resolveDemo } from '@helux/exercises/src/gallery'

/** Item exibido na galeria de desenvolvimento (028, FR-024). */
export interface GalleryItem {
  id: string
  name: string
  kind: CatalogKind
  pending: boolean
  demo: ResolvedDemo | null
  guidance: Guidance | null
}

export interface GalleryParams {
  ids?: string
  kind?: string
  pending?: string
  phase?: string
  frame?: string
  card?: string
}

export const KIND_LABEL: Record<CatalogKind, string> = { forca: 'Força', preparacao: 'Preparação', cardio: 'Cardio' }

export function galleryItems(): GalleryItem[] {
  return CATALOG.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    pending: PENDING_IDS.has(item.id),
    demo: resolveDemo(item.id),
    guidance: item.guidance ?? null,
  }))
}

/** `ids` restringe e ordena; `kind` filtra o catálogo; `pending=1` mostra só pendentes. */
export function filterGallery(items: GalleryItem[], params: GalleryParams): GalleryItem[] {
  let out = items
  if (params.ids) {
    const byId = new Map(items.map((i) => [i.id, i]))
    out = params.ids.split(',').map((id) => byId.get(id.trim())).filter((i): i is GalleryItem => !!i)
  }
  if (params.kind) out = out.filter((i) => i.kind === params.kind)
  if (params.pending === '1') out = out.filter((i) => i.pending)
  return out
}

/** Fase fixa da captura, entre 0 e 1; ausente ou inválida = animação normal. */
export function parsePhase(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : undefined
}

/** "Força: 3/122", por catálogo. */
export function coverageLines(items: GalleryItem[]): string[] {
  return (Object.keys(KIND_LABEL) as CatalogKind[]).map((kind) => {
    const ofKind = items.filter((i) => i.kind === kind)
    return `${KIND_LABEL[kind]}: ${ofKind.filter((i) => !i.pending).length}/${ofKind.length}`
  })
}
