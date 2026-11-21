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
  blind?: string
  seed?: string
  answers?: string
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

export const BLIND_SIZE = 20

/** Gerador determinístico (mulberry32): a mesma semente repete o mesmo sorteio. */
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Semente do sorteio: número inteiro da URL, ou 1. */
export function parseSeed(raw: string | undefined): number {
  const n = Number(raw)
  return Number.isInteger(n) ? n : 1
}

/**
 * Sorteio do teste às cegas (028, SC-006): até `size` itens aprovados e com demonstração,
 * em ordem embaralhada pela semente. A legenda sai, porque pode entregar o nome.
 */
export function blindDraw(items: GalleryItem[], seed: number, size = BLIND_SIZE): GalleryItem[] {
  const pool = items.filter((i) => !i.pending && i.demo)
  const rand = seeded(seed)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, size).map((i) => {
    const { caption: _caption, ...demo } = i.demo!
    return { ...i, demo }
  })
}
