import { apiFetch } from '@/services/api-client'

export async function getGeneticProfile(): Promise<unknown | null> {
  try {
    return await apiFetch('/genetic-profile')
  } catch {
    return null
  }
}

/** Envia o laudo Genera (JSON) para a conta do usuário (spec 024). */
export async function uploadGeneticReport(report: unknown): Promise<{ uploadedAt: string; traits: number }> {
  return (await apiFetch('/api/genetics/report', { method: 'POST', body: JSON.stringify(report) })) as { uploadedAt: string; traits: number }
}

export async function deleteGeneticReport(): Promise<void> {
  await apiFetch('/api/genetics/report', { method: 'DELETE' })
}
