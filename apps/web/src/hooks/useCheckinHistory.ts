'use client'

import { useState, useEffect } from 'react'
import { getCheckins } from '@/services/checkin.service'
import type { BodyCheckin } from '@helux/types'

export function useCheckinHistory(limit = 13) {
  const [checkins, setCheckins] = useState<BodyCheckin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCheckins(limit)
      .then(setCheckins)
      .finally(() => setLoading(false))
  }, [limit])

  return { checkins, loading }
}
