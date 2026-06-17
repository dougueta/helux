import { apiFetch } from '@/services/api-client'

export async function getGeneticProfile(): Promise<unknown | null> {
  try {
    return await apiFetch('/genetic-profile')
  } catch {
    return null
  }
}
