'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { UserTrainingProfile } from '@helux/types'
import { Shell } from '@/components/layout/Shell'
import { MeasurementHistory } from '@/components/checkin/MeasurementHistory'
import { WeightHistory } from '@/components/checkin/WeightHistory'
import { Segmented } from '@/components/ui/Segmented'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMeasurements } from '@/hooks/useMeasurements'
import { useWeights } from '@/hooks/useWeights'
import { getProfile } from '@/services/profile.service'

// Spec 029: histórico em duas abas — pesagens (com tendência) e medidas.

type Tab = 'peso' | 'medidas'

function Loading() {
  return (
    <div aria-busy="true" aria-label="carregando histórico">
      {[0, 1, 2].map(i => (
        <Skeleton key={i} h={120} style={{ marginTop: 16 }} />
      ))}
    </div>
  )
}

function HistoryContent() {
  const params = useSearchParams()
  const [tab, setTab] = useState<Tab>(params.get('aba') === 'medidas' ? 'medidas' : 'peso')
  const { weights, loading: loadingWeights, reload: reloadWeights } = useWeights(180)
  const { measurements, loading: loadingMeasurements } = useMeasurements(24)
  const [profile, setProfile] = useState<UserTrainingProfile | null>(null)

  useEffect(() => {
    getProfile().then(setProfile, () => setProfile(null))
  }, [])

  return (
    <>
      <div style={{ marginTop: 20 }}>
        <Segmented
          tabs
          label="Histórico"
          options={[
            { value: 'peso', label: 'Peso' },
            { value: 'medidas', label: 'Medidas' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'peso' ? (
        loadingWeights ? <Loading /> : <WeightHistory weights={weights} onChanged={reloadWeights} />
      ) : loadingMeasurements || loadingWeights ? (
        <Loading />
      ) : (
        <MeasurementHistory measurements={measurements} weights={weights} heightCm={profile?.heightCm ?? null} />
      )}
    </>
  )
}

export default function CheckinHistoryPage() {
  return (
    <Shell>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
        <div>
          <p className="t-secondary">Check-in</p>
          <h1 className="t-display" style={{ marginTop: 4 }}>
            Histórico
          </h1>
        </div>
        <Link href="/checkin" className="hx-btn hx-btn--secondary">
          Registrar
        </Link>
      </header>
      <Suspense fallback={<Loading />}>
        <HistoryContent />
      </Suspense>
    </Shell>
  )
}
