'use client'

import { useState } from 'react'
import type { BodyMeasurement } from '@helux/types'
import { MeasurementForm, type MeasurementFieldName } from '@/components/checkin/MeasurementForm'
import { MEASURE_GUIDE, MEASURE_PROTOCOL, MeasureGuide, type MeasureKey } from '@/components/checkin/MeasureGuide'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'

// Spec 029 (US4): formulário de medidas com o protocolo e o "Onde medir?".

const FIELD_TO_MEASURE: Partial<Record<MeasurementFieldName, MeasureKey>> = {
  neck_cm: 'neck',
  waist_cm: 'waist',
  hip_cm: 'hip',
  shoulders_cm: 'shoulders',
  chest_cm: 'chest',
  arm_left_cm: 'arm',
  leg_left_cm: 'leg',
  calf_left_cm: 'calf',
}

export function MeasurementFormWithGuide(props: { measurement?: BodyMeasurement; returnTo?: string }) {
  const [open, setOpen] = useState<MeasureKey | null>(null)

  return (
    <>
      <details className="hx-plain" style={{ marginTop: 20, paddingTop: 12 }} open={!props.measurement}>
        <summary className="t-heading" style={{ cursor: 'pointer' }}>
          Como medir
        </summary>
        <ul className="t-secondary" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          {MEASURE_PROTOCOL.map(line => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>

      <MeasurementForm
        {...props}
        renderGuide={field => {
          const key = FIELD_TO_MEASURE[field]
          if (!key) return null
          const label = MEASURE_GUIDE[key].label
          return (
            <button
              type="button"
              className="t-caption"
              aria-label={`Onde medir: ${label}`}
              onClick={() => setOpen(key)}
              style={{ background: 'none', border: 0, padding: '4px 0', color: 'var(--accent)', cursor: 'pointer' }}
            >
              Onde medir?
            </button>
          )
        }}
      />

      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        label={open ? `Onde medir: ${MEASURE_GUIDE[open].label}` : 'Onde medir'}
        footer={
          <Button kind="secondary" block onClick={() => setOpen(null)}>
            Entendi
          </Button>
        }
      >
        {open && (
          <>
            <h2 className="t-heading" style={{ marginBottom: 12 }}>
              {MEASURE_GUIDE[open].label}
            </h2>
            <MeasureGuide measure={open} />
          </>
        )}
      </Sheet>
    </>
  )
}
