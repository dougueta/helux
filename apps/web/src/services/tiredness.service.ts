import { apiFetch } from '@/services/api-client'
import type { TirednessAssessment, TirednessLevel } from '@helux/types'

export async function getTirednessToday(): Promise<TirednessAssessment> {
  return apiFetch('/api/tiredness-today') as Promise<TirednessAssessment>
}

export async function setTirednessToday(level: TirednessLevel, overrideAutomatic: boolean): Promise<TirednessAssessment> {
  return apiFetch('/api/tiredness-today', {
    method: 'PUT',
    body: JSON.stringify({ level, overrideAutomatic }),
  }) as Promise<TirednessAssessment>
}
