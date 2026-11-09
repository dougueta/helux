import { CARDIO_BANK, type PlannedExercise } from '@helux/types'
import { CARDIO_GUIDANCE } from './cardio-guidance'
import { PENDING_IDS } from './pending'
import { PREPARATION_ITEMS } from './preparation'
import { STRENGTH_EXERCISES } from './strength'
import type { CatalogKind, Gear, Guidance, PreparationItem, ResolvedItem, StrengthExercise } from './types'

export { isDemoReady, PENDING_IDS } from './pending'

/** Rótulo do implemento na tela; sem rótulo quando não há implemento. */
export const GEAR_LABEL: Record<Gear, string | null> = {
  barra: 'Barra',
  halteres: 'Halteres',
  kettlebell: 'Kettlebell',
  maquina: 'Máquina',
  smith: 'Smith',
  cabo: 'Cabo',
  corda: 'Corda',
  'peso-corporal': 'Peso corporal',
  elastico: 'Elástico',
  roda: 'Roda abdominal',
  banco: 'Banco',
  'barra-fixa': 'Barra fixa',
  bicicleta: 'Bicicleta',
  remo: 'Remo ergômetro',
  nenhum: null,
}

interface Entry {
  id: string
  name: string
  kind: CatalogKind
  guidance: Guidance | null
  muscles: { primary: string[]; secondary: string[] } | null
  tempo: string | null
  gear: Gear | null
}

export interface ResolverSources {
  strength?: StrengthExercise[]
  preparation?: PreparationItem[]
  /** ids ainda pendentes; por padrão, `pending.json` */
  pending?: ReadonlySet<string>
}

/** Minúsculas, sem acento e sem pontuação, com espaços simples. */
function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Monta a resolução sobre catálogos dados (os testes injetam catálogos próprios).
 * Não importa o registro de demonstrações, que fica no chunk carregado sob demanda.
 */
export function createResolver(sources: ResolverSources = {}) {
  const strength = sources.strength ?? STRENGTH_EXERCISES
  const preparation = sources.preparation ?? PREPARATION_ITEMS
  const pending = sources.pending ?? PENDING_IDS

  const byId = new Map<string, Entry>()
  const strengthByName = new Map<string, Entry>()
  const prepByName = new Map<string, Entry>()

  for (const e of strength) {
    const entry: Entry = { id: e.id, name: e.name, kind: 'forca', guidance: e.guidance ?? null, muscles: e.muscles, tempo: e.tempo, gear: e.gear }
    byId.set(e.id, entry)
    strengthByName.set(e.name, entry)
  }
  for (const p of preparation) {
    const entry: Entry = { id: p.id, name: p.name, kind: 'preparacao', guidance: p.guidance ?? null, muscles: null, tempo: null, gear: null }
    byId.set(p.id, entry)
    for (const n of [p.name, ...p.knownNames]) prepByName.set(normalize(n), entry)
  }
  for (const c of CARDIO_BANK) {
    byId.set(c.id, { id: c.id, name: c.name, kind: 'cardio', guidance: CARDIO_GUIDANCE[c.id]?.guidance ?? null, muscles: null, tempo: null, gear: null })
  }

  /** Ordem de data-model.md, "Resolução de um item na tela". */
  /** O item que o próprio plano descreve, sem variante. */
  function findPlanned(exercise: PlannedExercise): Entry | undefined {
    if (exercise.catalogId) return byId.get(exercise.catalogId)
    if (exercise.cardio) return byId.get(exercise.cardio.modality)
    return strengthByName.get(exercise.name) ?? prepByName.get(normalize(exercise.name))
  }

  function find(exercise: PlannedExercise, variantId?: string): Entry | undefined {
    if (exercise.approachOf) return byId.get(exercise.approachOf)
    // Variante ativa, mesmo fora da lista atual (FR-035).
    const variant = variantId ? byId.get(variantId) : undefined
    if (variant) return variant
    return findPlanned(exercise)
  }

  return function resolve(exercise: PlannedExercise, variantId?: string): ResolvedItem {
    const isApproach = Boolean(exercise.approachOf)
    const entry = find(exercise, variantId)
    if (!entry) {
      return { id: null, name: exercise.name, kind: null, demoState: 'indisponivel', guidance: null, muscles: null, tempo: null, gearLabel: null, isApproach }
    }

    if (!pending.has(entry.id)) {
      return {
        id: entry.id,
        name: entry.name,
        kind: entry.kind,
        demoState: 'nova',
        guidance: entry.guidance,
        muscles: entry.muscles,
        tempo: entry.tempo,
        gearLabel: entry.gear ? GEAR_LABEL[entry.gear] : null,
        isApproach,
      }
    }

    // Pendente: a tela continua como hoje, com a animação salva no plano, quando existe (só força).
    // Uma variante ativa fora da lista não herda a animação de outra.
    const variants = exercise.variants ?? []
    const listed = variantId ? variants.find((v) => v.id === variantId) : undefined
    const active = variantId && byId.has(variantId) ? listed : listed ?? variants.find((v) => v.rec) ?? variants[0]
    const hasLegacy = entry.kind === 'forca' && Boolean(active?.motion)
    // Os dados do plano valem para o item planejado; uma variante usa os próprios (FR-011).
    const isPlanned = !isApproach && entry === findPlanned(exercise)
    return {
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      demoState: hasLegacy ? 'legada' : 'indisponivel',
      guidance: null,
      muscles: isPlanned ? exercise.muscles ?? entry.muscles : entry.muscles,
      tempo: isPlanned ? exercise.tempo ?? entry.tempo : entry.tempo,
      gearLabel: null,
      isApproach,
    }
  }
}

/** Resolve um item do plano para o catálogo (FR-004, FR-005, R7). */
export const resolvePlannedItem = createResolver()
