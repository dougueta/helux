'use client'

import { useEffect, useState } from 'react'
import type { TrainingPreferences } from '@helux/types'
import { PreferencesForm } from '@/components/agents/PreferencesForm'
import { Banner } from '@/components/ui/Banner'
import { Skeleton } from '@/components/ui/Skeleton'
import { getExerciseCatalog, getPreferences, type CatalogExercise } from '@/services/agents.service'

export function PreferenciasClient() {
  const [data, setData] = useState<{ prefs: TrainingPreferences; catalog: CatalogExercise[] } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([getPreferences(), getExerciseCatalog()]).then(([prefs, catalog]) => setData({ prefs, catalog }), () => setError(true))
  }, [])

  if (error) {
    return (
      <div style={{ marginTop: 20 }}>
        <Banner kind="err" title="Não foi possível carregar as preferências">
          Tente de novo em instantes.
        </Banner>
      </div>
    )
  }
  if (!data) return <Skeleton h={320} style={{ marginTop: 20 }} />
  return <PreferencesForm initial={data.prefs} catalog={data.catalog} />
}
