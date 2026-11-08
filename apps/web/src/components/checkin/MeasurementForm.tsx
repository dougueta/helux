'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BodyMeasurement, DeviceBodyFatSource, MeasurementInput, NavyStatus, UserTrainingProfile } from '@helux/types'
import { navyEstimate } from '@helux/nutrition'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Segmented } from '@/components/ui/Segmented'
import { ApiError } from '@/services/api-client'
import { getProfile } from '@/services/profile.service'
import { createMeasurement, deleteMeasurement, updateMeasurement } from '@/services/measurements.service'
import { todayLocal } from '@/lib/dates'

// Spec 029 (US2): registro de medidas com fita. O % pela fita é o padrão (o
// servidor salva); o % de aparelho é opcional e exige a origem.

type FieldName =
  | 'neck_cm' | 'waist_cm' | 'hip_cm' | 'shoulders_cm' | 'chest_cm'
  | 'arm_left_cm' | 'arm_right_cm' | 'leg_left_cm' | 'leg_right_cm' | 'calf_left_cm' | 'calf_right_cm'
  | 'squat_kg' | 'bench_kg' | 'deadlift_kg' | 'body_fat_device_pct'

/** Espelha os limites da API (apps/api/src/routes/measurements.ts). */
const FIELDS: Record<FieldName, { label: string; full: string; unit: string; min: number; max: number }> = {
  neck_cm: { label: 'Pescoço', full: 'Pescoço (cm)', unit: 'cm', min: 20, max: 70 },
  waist_cm: { label: 'Cintura', full: 'Cintura (cm)', unit: 'cm', min: 30, max: 300 },
  hip_cm: { label: 'Quadril', full: 'Quadril (cm)', unit: 'cm', min: 30, max: 300 },
  shoulders_cm: { label: 'Ombros', full: 'Ombros (cm)', unit: 'cm', min: 60, max: 200 },
  chest_cm: { label: 'Peitoral', full: 'Peitoral (cm)', unit: 'cm', min: 50, max: 200 },
  arm_left_cm: { label: 'Braço esq.', full: 'Braço esquerdo (cm)', unit: 'cm', min: 10, max: 100 },
  arm_right_cm: { label: 'Braço dir.', full: 'Braço direito (cm)', unit: 'cm', min: 10, max: 100 },
  leg_left_cm: { label: 'Coxa esq.', full: 'Coxa esquerda (cm)', unit: 'cm', min: 10, max: 150 },
  leg_right_cm: { label: 'Coxa dir.', full: 'Coxa direita (cm)', unit: 'cm', min: 10, max: 150 },
  calf_left_cm: { label: 'Panturrilha esq.', full: 'Panturrilha esquerda (cm)', unit: 'cm', min: 15, max: 80 },
  calf_right_cm: { label: 'Panturrilha dir.', full: 'Panturrilha direita (cm)', unit: 'cm', min: 15, max: 80 },
  squat_kg: { label: 'Agachamento', full: 'Agachamento (kg)', unit: 'kg', min: 0, max: 1000 },
  bench_kg: { label: 'Supino', full: 'Supino (kg)', unit: 'kg', min: 0, max: 1000 },
  deadlift_kg: { label: 'Terra', full: 'Terra (kg)', unit: 'kg', min: 0, max: 1000 },
  body_fat_device_pct: { label: '% de gordura', full: 'Gordura (%)', unit: '%', min: 1, max: 70 },
}
const ALL = Object.keys(FIELDS) as FieldName[]

const COMPOSITION: FieldName[] = ['neck_cm', 'waist_cm', 'hip_cm', 'shoulders_cm', 'chest_cm']
const LIMBS: [string, FieldName, FieldName][] = [
  ['Braço', 'arm_left_cm', 'arm_right_cm'],
  ['Coxa', 'leg_left_cm', 'leg_right_cm'],
  ['Panturrilha', 'calf_left_cm', 'calf_right_cm'],
]
const PERF: FieldName[] = ['squat_kg', 'bench_kg', 'deadlift_kg']

const SOURCES: { value: DeviceBodyFatSource; label: string }[] = [
  { value: 'bioimpedancia', label: 'Bioimpedância' },
  { value: 'adipometro', label: 'Adipômetro' },
  { value: 'dexa', label: 'DEXA' },
  { value: 'outro', label: 'Outro' },
]

const NAVY_MESSAGE: Record<Exclude<NavyStatus, 'ok'>, string> = {
  'sem-perfil': 'Para estimar o % de gordura pela fita, informe altura e sexo no Perfil.',
  'sem-medidas': 'Medidas insuficientes para estimar o % de gordura (mulheres: informe também o quadril).',
  inconsistente: 'Essas medidas parecem inconsistentes para estimar o % de gordura (a cintura precisa ser maior que o pescoço). Confira onde passou a fita.',
}

const grid = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 } as const

const toStr = (v?: number | null) => (v != null ? String(v).replace('.', ',') : '')

/** Aceita vírgula decimal (teclado pt-BR): "82,5" → 82.5. */
function toNum(v: string): number | undefined {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isNaN(n) ? undefined : n
}

export function MeasurementForm({
  measurement,
  returnTo,
  renderGuide,
}: {
  /** Edição de um registro existente. */
  measurement?: BodyMeasurement
  returnTo?: string
  /** US4: botão "Onde medir?" ao lado de cada medida com fita. */
  renderGuide?: (field: FieldName) => React.ReactNode
} = {}) {
  const router = useRouter()
  const today = todayLocal()
  const [fields, setFields] = useState<Record<FieldName, string>>(
    () => Object.fromEntries(ALL.map(k => [k, toStr(measurement?.[k] as number | null | undefined)])) as Record<FieldName, string>,
  )
  const [date, setDate] = useState(measurement?.measured_on ?? today)
  const [notes, setNotes] = useState(measurement?.notes ?? '')
  const [deviceOpen, setDeviceOpen] = useState(measurement?.body_fat_device_pct != null)
  const [source, setSource] = useState<DeviceBodyFatSource | null>(measurement?.body_fat_device_source ?? null)
  const [fieldError, setFieldError] = useState<{ name: FieldName; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sourceError, setSourceError] = useState(false)
  const [afterSave, setAfterSave] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserTrainingProfile | null>(null)

  useEffect(() => {
    getProfile().then(setProfile, () => setProfile(null))
  }, [])

  const destination = returnTo ?? '/checkin/history?aba=medidas'
  const update = (name: FieldName, value: string) => setFields(f => ({ ...f, [name]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)
    setSourceError(false)

    const values: Partial<Record<FieldName, number>> = {}
    for (const name of ALL) {
      if (name === 'body_fat_device_pct' && !deviceOpen) continue
      const n = toNum(fields[name])
      if (n === undefined) continue
      const { min, max, full } = FIELDS[name]
      if (n < min || n > max) {
        setFieldError({ name, message: `${full}: valor deve estar entre ${min} e ${max}.` })
        return
      }
      values[name] = n
    }
    if (values.body_fat_device_pct !== undefined && !source) {
      setSourceError(true)
      return
    }
    if (Object.keys(values).length === 0 && !notes.trim()) {
      setError('Preencha pelo menos uma medida.')
      return
    }
    if (date > today) {
      setError('A data não pode ser no futuro.')
      return
    }

    const input: MeasurementInput = {
      measured_on: date,
      ...values,
      ...(values.body_fat_device_pct !== undefined ? { body_fat_device_source: source } : {}),
      notes: notes.trim() || null,
    }

    setSaving(true)
    try {
      const res = measurement ? await updateMeasurement(measurement.id, input) : await createMeasurement(input)
      const triedNavy = values.waist_cm !== undefined && values.neck_cm !== undefined
      if (triedNavy && res.navy_status !== 'ok') {
        setAfterSave(`Medidas salvas. ${NAVY_MESSAGE[res.navy_status]}`)
        return
      }
      router.push(destination)
    } catch (err) {
      const path = err instanceof ApiError ? err.details?.[0]?.path?.[0] : undefined
      if (typeof path === 'string' && path in FIELDS) {
        const { full, min, max } = FIELDS[path as FieldName]
        setFieldError({ name: path as FieldName, message: `${full}: valor deve estar entre ${min} e ${max}.` })
      } else {
        setError('Erro ao salvar as medidas. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!measurement) return
    setConfirmDelete(false)
    try {
      await deleteMeasurement(measurement.id)
      router.push(destination)
    } catch {
      setError('Erro ao apagar o registro. Tente novamente.')
    }
  }

  const renderField = (name: FieldName, guide = true) => (
    <div key={name}>
      <Field
        label={FIELDS[name].label}
        unit={FIELDS[name].unit}
        value={fields[name]}
        onChange={v => update(name, v)}
        error={fieldError?.name === name ? fieldError.message : null}
      />
      {guide && renderGuide?.(name)}
    </div>
  )

  const waist = toNum(fields.waist_cm)
  const neck = toNum(fields.neck_cm)
  const preview =
    waist !== undefined && neck !== undefined
      ? navyEstimate({ heightCm: profile?.heightCm, sex: profile?.sex }, { waistCm: waist, neckCm: neck, hipCm: toNum(fields.hip_cm) })
      : null

  if (afterSave) {
    return (
      <div style={{ marginTop: 24 }}>
        <Banner kind="warn" title="Sem % de gordura neste registro">
          {afterSave}
        </Banner>
        <div style={{ marginTop: 16 }}>
          <Button kind="primary" block onClick={() => router.push(destination)}>
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="hx-field" style={{ marginTop: 24, maxWidth: 200 }}>
        <label htmlFor="measurement-date">Data</label>
        <div className="hx-input">
          <input
            id="measurement-date"
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value || today)}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', font: 'inherit' }}
          />
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <SectionHeader title="Composição" />
        <div style={grid}>{COMPOSITION.map(n => renderField(n))}</div>
        {preview && (
          <p className="t-secondary" style={{ marginTop: 12 }}>
            {preview.pct !== null
              ? `Gordura estimada pela fita métrica (método da Marinha): ${String(preview.pct).replace('.', ',')}%`
              : NAVY_MESSAGE[preview.status as Exclude<NavyStatus, 'ok'>]}
          </p>
        )}

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="hx-btn hx-btn--ghost"
            aria-expanded={deviceOpen}
            onClick={() => setDeviceOpen(o => !o)}
          >
            Tenho uma medição de aparelho
          </button>
          {deviceOpen && (
            <div style={{ marginTop: 12 }}>
              <div style={grid}>{renderField('body_fat_device_pct', false)}</div>
              <div style={{ marginTop: 12 }}>
                <Segmented label="Origem da medição" options={SOURCES} value={source} onChange={v => (setSource(v), setSourceError(false))} />
                {sourceError && (
                  <p className="hx-field-help is-err" role="alert" style={{ marginTop: 6 }}>
                    Escolha a origem da medição (bioimpedância, adipômetro, DEXA ou outro).
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <SectionHeader title="Membros" />
        {LIMBS.map(([title, left, right]) => (
          <div key={title} style={{ marginTop: 8 }}>
            <div style={grid}>
              {renderField(left, false)}
              {renderField(right, false)}
            </div>
            {renderGuide?.(left)}
          </div>
        ))}
      </section>

      <section style={{ marginTop: 28 }}>
        <SectionHeader title="Performance" />
        <div style={grid}>{PERF.map(n => renderField(n, false))}</div>
      </section>

      <div className="hx-field" style={{ marginTop: 28 }}>
        <label htmlFor="measurement-notes">Observações (opcional)</label>
        <div className="hx-input" style={{ height: 'auto', padding: '10px 14px' }}>
          <textarea
            id="measurement-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 15, resize: 'vertical' }}
          />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16 }}>
          <Banner kind="err" title="Não foi possível salvar">
            {error}
          </Banner>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'grid', gap: 8 }}>
        <Button type="submit" kind="primary" size="lg" block loading={saving}>
          Salvar medidas
        </Button>
        {measurement && (
          <Button type="button" kind="ghost" block onClick={() => setConfirmDelete(true)}>
            Apagar registro
          </Button>
        )}
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        role="alertdialog"
        title="Apagar este registro de medidas?"
        actions={
          <>
            <Button kind="danger" block onClick={handleDelete}>
              Apagar
            </Button>
            <Button kind="ghost" block onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </>
        }
      />
    </form>
  )
}

export type { FieldName as MeasurementFieldName }
