import { apiFetch } from '@/services/api-client'
import type { RecoveryData } from '@helux/types'

export async function getLatestRecovery(): Promise<RecoveryData | null> {
  try {
    return (await apiFetch('/api/recovery/latest')) as RecoveryData
  } catch {
    return null
  }
}
