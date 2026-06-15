import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecoveryData } from '@helux/types'
import { AuthService } from '../services/auth.service'
import { syncHealthData, RECOVERY_KEY } from '../services/health-sync.service'
import { useAuth } from './useAuth'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export function useHealthSync() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [recovery, setRecovery] = useState<RecoveryData | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(RECOVERY_KEY).then(raw => {
      if (raw) setRecovery(JSON.parse(raw) as RecoveryData)
    })
  }, [])

  const sync = async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = await AuthService.getAccessToken()
      const result = await syncHealthData(session.user.id, token, API_URL)
      setLastSyncAt(result.syncedAt)
      setRecovery(result.recovery)
    } catch (err) {
      console.error('[useHealthSync]', err)
    } finally {
      setLoading(false)
    }
  }

  return { sync, loading, lastSyncAt, recovery }
}
