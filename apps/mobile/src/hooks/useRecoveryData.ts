import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecoveryData } from '@helux/types'
import { RECOVERY_KEY } from '../services/health-sync.service'

export function useRecoveryData() {
  const [data, setData] = useState<RecoveryData | null>(null)

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(RECOVERY_KEY)
    if (raw) setData(JSON.parse(raw) as RecoveryData)
  }, [])

  useEffect(() => { load() }, [load])

  return { data, refresh: load }
}
