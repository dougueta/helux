'use client'

import { useCallback, useEffect, useState } from 'react'
import type { BodyMeasurement } from '@helux/types'
import { listMeasurements } from '@/services/measurements.service'

/** Registros de medidas, do mais recente para o mais antigo (spec 029). */
export function useMeasurements(limit = 24) {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    return listMeasurements(limit)
      .then(setMeasurements, () => setMeasurements([]))
      .finally(() => setLoading(false))
  }, [limit])

  useEffect(() => {
    void reload()
  }, [reload])

  return { measurements, loading, reload }
}
