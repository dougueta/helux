import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecoveryData } from '@helux/types'
import { AuthService } from '../services/auth.service'
import { fetchLatestRecovery, RECOVERY_KEY, LAST_SYNC_KEY } from '../services/health-sync.service'
import { useAuth } from './useAuth'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export function useHealthSync() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [recovery, setRecovery] = useState<RecoveryData | null>(null)

  // Load cached data from AsyncStorage on mount (offline fallback)
  useEffect(() => {
    AsyncStorage.getItem(RECOVERY_KEY).then(raw => {
      if (raw) setRecovery(JSON.parse(raw) as RecoveryData)
    })
    AsyncStorage.getItem(LAST_SYNC_KEY).then(raw => {
      if (raw) setLastSyncAt(new Date(raw))
    })
  }, [])

  const sync = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = await AuthService.getAccessToken()
      const data = await fetchLatestRecovery(token, API_URL)
      if (data) {
        await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(data))
        const now = new Date()
        await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString())
        setRecovery(data)
        setLastSyncAt(now)
      }
    } catch (err) {
      console.error('[useHealthSync]', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  // Auto-fetch on mount when session is available
  useEffect(() => {
    if (!session) return
    let mounted = true
    const controller = new AbortController()

    const autoFetch = async () => {
      const token = session.access_token
      try {
        const data = await fetchLatestRecovery(token, API_URL, controller.signal)
        if (!mounted) return
        if (data) {
          setRecovery(data)
          const now = new Date()
          setLastSyncAt(now)
          await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(data))
          await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString())
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('[useHealthSync] auto-fetch', err)
      }
    }

    autoFetch()
    return () => {
      mounted = false
      controller.abort()
    }
  }, [session])

  return { sync, loading, lastSyncAt, recovery }
}
