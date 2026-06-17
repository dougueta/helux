'use client'

import { useState, useEffect } from 'react'
import { getLatestRecovery } from '@/services/recovery.service'
import type { RecoveryData } from '@helux/types'

export function useRecovery() {
  const [data, setData] = useState<RecoveryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLatestRecovery()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const hasData = data !== null
  const isStale = hasData
    ? new Date().getTime() - new Date(data!.date).getTime() > 24 * 60 * 60 * 1000
    : false

  return { data, loading, hasData, isStale }
}
