import { apiFetch } from '@/services/api-client'
import type { BodyMeasurement, MeasurementInput, NavyStatus } from '@helux/types'

// Spec 029 (US2): registros de medidas com fita.

export interface SavedMeasurement {
  measurement: BodyMeasurement
  navy_status: NavyStatus
}

export async function listMeasurements(limit = 24): Promise<BodyMeasurement[]> {
  const data = (await apiFetch(`/api/measurements?limit=${limit}`)) as { measurements: BodyMeasurement[] }
  return data.measurements ?? []
}

export async function createMeasurement(input: MeasurementInput): Promise<SavedMeasurement> {
  return apiFetch('/api/measurements', { method: 'POST', body: JSON.stringify(input) }) as Promise<SavedMeasurement>
}

export async function updateMeasurement(id: string, input: MeasurementInput): Promise<SavedMeasurement> {
  return apiFetch(`/api/measurements/${id}`, { method: 'PUT', body: JSON.stringify(input) }) as Promise<SavedMeasurement>
}

export async function deleteMeasurement(id: string): Promise<void> {
  await apiFetch(`/api/measurements/${id}`, { method: 'DELETE' })
}
