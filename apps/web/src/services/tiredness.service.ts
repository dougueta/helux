import { apiFetch } from '@/services/api-client'
import type { DailyTirednessSignal } from '@helux/types'

export async function markTiredToday(): Promise<DailyTirednessSignal> {
  return apiFetch('/api/tiredness-today', { method: 'POST' }) as Promise<DailyTirednessSignal>
}

export async function clearTiredToday(): Promise<DailyTirednessSignal> {
  return apiFetch('/api/tiredness-today', { method: 'DELETE' }) as Promise<DailyTirednessSignal>
}
