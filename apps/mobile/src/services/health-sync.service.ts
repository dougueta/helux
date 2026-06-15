import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecoveryData } from '@helux/types'
import { healthKit } from './healthkit'

export const RECOVERY_KEY = 'helux:recovery-data'
export const LAST_SYNC_KEY = 'helux:last-sync-at'

export interface SyncResult {
  recovery: RecoveryData
  syncedAt: Date
}

export async function syncHealthData(
  userId: string,
  token: string,
  apiUrl: string,
): Promise<SyncResult> {
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)

  const [samples, recovery] = await Promise.all([
    healthKit.readSamples(from, to),
    healthKit.readRecovery(from, to),
  ])

  // Persist locally before POST — data stays available even offline
  await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(recovery))
  await AsyncStorage.setItem(LAST_SYNC_KEY, to.toISOString())

  try {
    await fetch(`${apiUrl}/api/health/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(samples),
    })
  } catch (err) {
    console.error('[HealthSync] POST failed, data saved locally:', err)
  }

  return { recovery, syncedAt: to }
}

export async function fetchLatestRecovery(
  token: string,
  apiUrl: string,
  signal?: AbortSignal,
): Promise<RecoveryData | null> {
  try {
    const res = await fetch(`${apiUrl}/api/recovery/latest`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() as RecoveryData
  } catch (err) {
    console.error('[fetchLatestRecovery]', err)
    return null
  }
}
