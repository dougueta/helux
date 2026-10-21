import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecoveryData } from '@helux/types'
import { healthKit } from './healthkit'

export const RECOVERY_KEY = 'helux:recovery-data'
export const LAST_SYNC_KEY = 'helux:last-sync-at'

export interface SyncResult {
  recovery: RecoveryData
  syncedAt: Date
}

// Spec 023 / FR-007: o plano gratuito do Render hiberna e leva 30–60 s para acordar.
// O POST é repetido em erro de rede, timeout e 502/503/504; outros status falham na hora.
export const HEALTH_SYNC_RETRY_DELAYS_MS = [2000, 4000, 8000]
export const HEALTH_SYNC_TIMEOUT_MS = 45_000
const MAX_ATTEMPTS = 3
const TRANSIENT_STATUS = new Set([502, 503, 504])

export interface SyncOptions {
  /** Espera entre tentativas; injetável para os testes. */
  sleep?: (ms: number) => Promise<void>
  timeoutMs?: number
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function postWithRetry(
  url: string,
  init: RequestInit,
  { sleep = defaultSleep, timeoutMs = HEALTH_SYNC_TIMEOUT_MS }: SyncOptions,
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let res: Response | undefined
    let error: unknown
    try {
      res = await fetch(url, { ...init, signal: controller.signal })
    } catch (err) {
      error = err // erro de rede ou timeout (abort): transitório
    } finally {
      clearTimeout(timer)
    }
    if (res?.ok) return
    if (res) {
      error = new Error(`HTTP ${res.status}`)
      if (!TRANSIENT_STATUS.has(res.status)) throw error
    }
    if (attempt >= MAX_ATTEMPTS) throw error
    await sleep(HEALTH_SYNC_RETRY_DELAYS_MS[attempt - 1])
  }
}

export async function syncHealthData(
  userId: string,
  token: string,
  apiUrl: string,
  options: SyncOptions = {},
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
    await postWithRetry(
      `${apiUrl}/api/health/sync`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(samples),
      },
      options,
    )
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
