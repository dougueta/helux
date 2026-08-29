import { apiFetch } from '@/services/api-client'
import type { UserTrainingProfile, UserTrainingProfileInput } from '@helux/types'

export async function getProfile(): Promise<UserTrainingProfile | null> {
  try {
    const data = (await apiFetch('/api/profile')) as { profile: UserTrainingProfile | null }
    return data.profile
  } catch {
    return null
  }
}

export async function upsertProfile(input: UserTrainingProfileInput): Promise<UserTrainingProfile> {
  const data = (await apiFetch('/api/profile', {
    method: 'POST',
    body: JSON.stringify(input),
  })) as { profile: UserTrainingProfile }
  return data.profile
}
