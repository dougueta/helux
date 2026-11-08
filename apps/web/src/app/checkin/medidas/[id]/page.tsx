'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { BodyMeasurement } from '@helux/types'
import { Shell } from '@/components/layout/Shell'
import { FormSkeleton } from '@/components/ui/FormSkeleton'
import { MeasurementFormWithGuide } from '@/components/checkin/MeasurementFormWithGuide'
import { listMeasurements } from '@/services/measurements.service'

// Spec 029 (FR-013): editar ou apagar um registro de medidas.

export default function EditMeasurementPage({ params }: { params: { id: string } }) {
  const [measurement, setMeasurement] = useState<BodyMeasurement | null | undefined>(undefined)

  useEffect(() => {
    listMeasurements(100).then(
      list => setMeasurement(list.find(m => m.id === params.id) ?? null),
      () => setMeasurement(null),
    )
  }, [params.id])

  return (
    <Shell>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
        <div>
          <p className="t-secondary">Check-in</p>
          <h1 className="t-display" style={{ marginTop: 4 }}>
            Editar medidas
          </h1>
        </div>
        <Link href="/checkin/history?aba=medidas" className="hx-btn hx-btn--ghost">
          Voltar
        </Link>
      </header>
      {measurement === undefined ? (
        <FormSkeleton />
      ) : measurement === null ? (
        <p className="t-secondary" style={{ marginTop: 24 }}>
          Registro não encontrado.
        </p>
      ) : (
        <MeasurementFormWithGuide measurement={measurement} />
      )}
    </Shell>
  )
}
