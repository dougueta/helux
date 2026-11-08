import { apiFetch } from '@/services/api-client'
import type { BodyWeight } from '@helux/types'

// Spec 029 (US1): pesagens diárias.

export async function listWeights(days = 90): Promise<BodyWeight[]> {
  const data = (await apiFetch(`/api/weights?days=${days}`)) as { weights: BodyWeight[] }
  return data.weights ?? []
}

export async function saveWeight(date: string, weightKg: number): Promise<{ weight: BodyWeight; replaced: boolean }> {
  return apiFetch(`/api/weights/${date}`, {
    method: 'PUT',
    body: JSON.stringify({ weight_kg: weightKg }),
  }) as Promise<{ weight: BodyWeight; replaced: boolean }>
}

export async function deleteWeight(date: string): Promise<void> {
  await apiFetch(`/api/weights/${date}`, { method: 'DELETE' })
}
