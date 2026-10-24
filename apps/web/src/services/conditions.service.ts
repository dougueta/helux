import { apiFetch } from '@/services/api-client'
import type { ConditionRules, HealthCondition, HealthConditionInput, Region, SharedGuidance } from '@helux/types'

// Spec 024: condições de saúde e cirurgias (contracts/api.md).

export type ConditionView = HealthCondition & { rules: ConditionRules }
export interface CatalogConditionView {
  key: string
  label: string
  regions: Region[]
  rules: ConditionRules
}

export async function getConditions(): Promise<{ conditions: ConditionView[]; catalog: CatalogConditionView[] }> {
  return (await apiFetch('/api/conditions')) as { conditions: ConditionView[]; catalog: CatalogConditionView[] }
}

export async function createCondition(
  input: Partial<HealthConditionInput> & Pick<HealthConditionInput, 'region' | 'status'>,
): Promise<{ condition: HealthCondition; rules?: ConditionRules; proposedGuidance?: SharedGuidance[]; notice?: string }> {
  return (await apiFetch('/api/conditions', { method: 'POST', body: JSON.stringify(input) })) as {
    condition: HealthCondition
    rules?: ConditionRules
    proposedGuidance?: SharedGuidance[]
    notice?: string
  }
}

export async function updateCondition(id: string, patch: Partial<Pick<HealthCondition, 'side' | 'since' | 'count' | 'status' | 'notes'>>): Promise<void> {
  await apiFetch(`/api/conditions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export async function deleteCondition(id: string): Promise<void> {
  await apiFetch(`/api/conditions/${id}`, { method: 'DELETE' })
}

export async function startFlare(id: string, region: Region, until?: string): Promise<void> {
  await apiFetch(`/api/conditions/${id}/flare`, { method: 'POST', body: JSON.stringify(until ? { region, until } : { region }) })
}

export async function endFlare(id: string): Promise<void> {
  await apiFetch(`/api/conditions/${id}/flare`, { method: 'DELETE' })
}

const REGION_LABEL: Record<Region, string> = {
  joelho: 'joelho',
  ombro: 'ombro',
  lombar: 'lombar',
  quadril: 'quadril',
  tornozelo: 'tornozelo',
  cotovelo: 'cotovelo',
  punho: 'punho',
  sistemica: 'corpo todo',
}

export const regionLabel = (r: Region) => REGION_LABEL[r]

const IMPACT = ['sem impacto', 'impacto baixo', 'impacto alto'] as const

/** Regras em linguagem do usuário (FR-006: visíveis ao usuário). */
export function describeRules(r: ConditionRules): string[] {
  return [
    ...Object.entries(r.maxJointStress).map(([j, l]) => (l === 0 ? `Sem carga no ${j}` : `Carga moderada no ${j}`)),
    r.maxCardioImpact !== null ? `Cardio ${IMPACT[r.maxCardioImpact]}${r.maxCardioImpact === 0 ? ' (bike, elíptico, natação, remo)' : ''}` : null,
    r.minRir !== null ? `Sempre deixar ${r.minRir} repetições na reserva` : null,
    ...r.cues,
  ].filter((x): x is string => !!x)
}
