import { apiFetch } from '@/services/api-client'
import type { CycleSummary, PlanDecision } from '@helux/types'

// Spec 024: análise do ciclo concluído (contracts/api.md).

export interface CycleAnalysisView {
  summary: CycleSummary
  changes: PlanDecision[]
}

/** Análise que originou este mesociclo; `null` quando ainda não há (primeiro ciclo). */
export async function getCycleAnalysis(mesocycleId: string): Promise<CycleAnalysisView | null> {
  try {
    return (await apiFetch(`/workout/mesocycle/${mesocycleId}/analysis`)) as CycleAnalysisView
  } catch {
    return null
  }
}
