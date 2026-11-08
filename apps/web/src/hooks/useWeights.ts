'use client'

import { useCallback, useEffect, useState } from 'react'
import type { BodyWeight } from '@helux/types'
import { listWeights } from '@/services/weights.service'

/** Pesagens da janela (spec 029); `reload` depois de editar/apagar. */
export function useWeights(days = 90) {
  const [weights, setWeights] = useState<BodyWeight[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    return listWeights(days)
      .then(setWeights, () => setWeights([]))
      .finally(() => setLoading(false))
  }, [days])

  useEffect(() => {
    void reload()
  }, [reload])

  return { weights, loading, reload }
}
