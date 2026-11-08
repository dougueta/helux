'use client'

import { CheckinSummary } from '@/components/checkin/CheckinSummary'
import { FormSkeleton } from '@/components/ui/FormSkeleton'
import { useMeasurements } from '@/hooks/useMeasurements'
import { useWeights } from '@/hooks/useWeights'

/** Carrega pesagens e medidas para o resumo da aba Check-in (spec 029). */
export function CheckinHome() {
  const { weights, loading: loadingWeights } = useWeights(30)
  const { measurements, loading: loadingMeasurements } = useMeasurements(1)
  if (loadingWeights || loadingMeasurements) return <FormSkeleton />
  return <CheckinSummary weights={weights} measurements={measurements} />
}
