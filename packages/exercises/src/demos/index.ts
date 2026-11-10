/**
 * Registro de movimentos base e demonstrações por item (R6, R7).
 * Cada família (`demos/<família>.ts`) exporta suas bases e um `DemoSpec` por id do catálogo.
 * A web carrega este módulo sob demanda, por `loadDemo`, para não pesar nas demais telas.
 */
import { resolveDemoSpec } from '../engine/resolve-demo'
import type { DemoSpec, MovementBase, ResolvedDemo } from '../engine/types'
import { AGACHAR } from './agachar'
import { CORE } from './core'
import { DOBRAR_QUADRIL } from './dobrar-quadril'
import { EMPURRAR_HORIZONTAL } from './empurrar-horizontal'
import { EMPURRAR_VERTICAL } from './empurrar-vertical'
import { ISOLAMENTO_BRACOS } from './isolamento-bracos'
import { ISOLAMENTO_TRONCO } from './isolamento-tronco'
import { ISOLAMENTO_PERNAS } from './isolamento-pernas'
import { PREPARACAO_ATIVACAO } from './preparacao-ativacao'
import { PREPARACAO_QUADRIL } from './preparacao-quadril'
import { PUXAR_HORIZONTAL } from './puxar-horizontal'
import { PUXAR_VERTICAL } from './puxar-vertical'

export interface DemoFamily {
  bases: MovementBase[]
  demos: Record<string, DemoSpec>
}

export interface DemoRegistry {
  bases: Record<string, MovementBase>
  demos: Record<string, DemoSpec>
  resolve(id: string): ResolvedDemo | null
}

export function createRegistry(families: DemoFamily[]): DemoRegistry {
  const bases: Record<string, MovementBase> = {}
  const demos: Record<string, DemoSpec> = {}
  for (const family of families) {
    for (const base of family.bases) {
      if (bases[base.key]) throw new Error(`base duplicada: ${base.key}`)
      bases[base.key] = base
    }
    for (const [id, spec] of Object.entries(family.demos)) {
      if (demos[id]) throw new Error(`demonstração duplicada: ${id}`)
      demos[id] = spec
    }
  }
  return {
    bases,
    demos,
    resolve: (id) => (demos[id] ? resolveDemoSpec(id, demos[id], bases) : null),
  }
}

/** Famílias registradas. Cada lote acrescenta a sua aqui. */
const FAMILIES: DemoFamily[] = [AGACHAR, DOBRAR_QUADRIL, EMPURRAR_HORIZONTAL, PUXAR_HORIZONTAL, PUXAR_VERTICAL, CORE, ISOLAMENTO_PERNAS, EMPURRAR_VERTICAL, ISOLAMENTO_BRACOS, ISOLAMENTO_TRONCO, PREPARACAO_ATIVACAO, PREPARACAO_QUADRIL]

const REGISTRY = createRegistry(FAMILIES)

export const MOVEMENT_BASES = REGISTRY.bases
export const DEMO_SPECS = REGISTRY.demos
export const resolveDemo = REGISTRY.resolve
