/**
 * Itens das Rotinas Complementares no catálogo (028 FR-036): demonstração e orientação do item
 * correspondente, pelo id da Rotina. Sem correspondente aprovado, a tela mostra a indisponibilidade.
 */
import { resolvePlannedItem, routineCatalogId, type ResolvedItem } from '@helux/exercises'

export function resolveRoutineItem(id: string, name: string): ResolvedItem {
  return resolvePlannedItem({ name, sets: 1, reps: '', weight: '—', catalogId: routineCatalogId(id) })
}

/** Passos da orientação do catálogo (posição inicial e execução); sem orientação, as dicas da Rotina. */
export function routineSteps(resolved: ResolvedItem, fallback: string[]): string[] {
  const g = resolved.guidance
  return g ? [...g.setup, ...g.steps] : fallback
}
