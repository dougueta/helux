import { apiFetch } from '@/services/api-client'
import type { BodyCheckin, CheckinInput } from '@helux/types'

export async function getCheckins(limit = 13): Promise<BodyCheckin[]> {
  try {
    const data = (await apiFetch(`/api/checkins?limit=${limit}`)) as { checkins: BodyCheckin[] }
    return data.checkins ?? []
  } catch {
    return []
  }
}

export async function upsertCheckin(input: CheckinInput): Promise<BodyCheckin> {
  return apiFetch('/api/checkins', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<BodyCheckin>
}
