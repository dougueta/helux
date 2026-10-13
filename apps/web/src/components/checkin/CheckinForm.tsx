'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCheckin } from '@/hooks/useCheckin'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ApiError } from '@/services/api-client'
import type { CheckinInput, UserTrainingProfile } from '@helux/types'
import { navyBodyFat } from '@helux/nutrition'
import { getProfile } from '@/services/profile.service'

type FieldName = keyof Omit<CheckinInput, 'month' | 'notes'>

// Mirrors the bounds enforced by the Zod schema in apps/api/src/routes/checkins.ts —
// kept here too so the form can validate instantly, without a round trip.
const FIELD_BOUNDS: Record<FieldName, { min: number; max: number; label: string }> = {
  weight_kg: { min: 20, max: 500, label: 'Peso (kg)' },
  body_fat_pct: { min: 1, max: 70, label: 'Gordura (%)' },
  waist_cm: { min: 30, max: 300, label: 'Cintura (cm)' },
  hip_cm: { min: 30, max: 300, label: 'Quadril (cm)' },
  neck_cm: { min: 20, max: 70, label: 'Pescoço (cm)' },
  arm_cm: { min: 10, max: 100, label: 'Braço (cm)' },
  leg_cm: { min: 10, max: 150, label: 'Coxa (cm)' },
  squat_kg: { min: 0, max: 1000, label: 'Agachamento (kg)' },
  bench_kg: { min: 0, max: 1000, label: 'Supino (kg)' },
  deadlift_kg: { min: 0, max: 1000, label: 'Terra (kg)' },
}

function boundsMessage(name: FieldName): string {
  const { label, min, max } = FIELD_BOUNDS[name]
  return `${label}: valor deve estar entre ${min} e ${max}.`
}

// Rótulo curto + unidade fixa no campo v2 (FR-023). A mensagem de erro usa o rótulo completo.
const FIELD_UI: Record<FieldName, { label: string; unit: string }> = {
  weight_kg: { label: 'Peso', unit: 'kg' },
  body_fat_pct: { label: 'Gordura', unit: '%' },
  waist_cm: { label: 'Cintura', unit: 'cm' },
  hip_cm: { label: 'Quadril', unit: 'cm' },
  neck_cm: { label: 'Pescoço', unit: 'cm' },
  arm_cm: { label: 'Braço', unit: 'cm' },
  leg_cm: { label: 'Coxa', unit: 'cm' },
  squat_kg: { label: 'Agachamento', unit: 'kg' },
  bench_kg: { label: 'Supino', unit: 'kg' },
  deadlift_kg: { label: 'Terra', unit: 'kg' },
}

const BODY: FieldName[] = ['weight_kg', 'body_fat_pct', 'waist_cm', 'neck_cm', 'hip_cm', 'arm_cm', 'leg_cm']
const PERF: FieldName[] = ['squat_kg', 'bench_kg', 'deadlift_kg']

const grid = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 } as const

function currentMonthLabel(): string {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

export function CheckinForm() {
  const router = useRouter()
  const { current, saving, save } = useCheckin()

  const toStr = (v?: number | null) => (v != null ? String(v).replace('.', ',') : '')

  const [fields, setFields] = useState<Record<FieldName, string>>({
    weight_kg: toStr(current?.weight_kg),
    body_fat_pct: toStr(current?.body_fat_pct),
    waist_cm: toStr(current?.waist_cm),
    hip_cm: toStr(current?.hip_cm),
    neck_cm: toStr(current?.neck_cm),
    arm_cm: toStr(current?.arm_cm),
    leg_cm: toStr(current?.leg_cm),
    squat_kg: toStr(current?.squat_kg),
    bench_kg: toStr(current?.bench_kg),
    deadlift_kg: toStr(current?.deadlift_kg),
  })
  const [notes, setNotes] = useState(current?.notes ?? '')
  // Erro de um campo (limites) aparece no próprio campo; os demais, num aviso.
  const [fieldError, setFieldError] = useState<{ name: FieldName; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Spec 018: altura e sexo do perfil para estimar o % de gordura pela Marinha.
  const [profile, setProfile] = useState<UserTrainingProfile | null>(null)
  useEffect(() => {
    getProfile().then(setProfile, () => setProfile(null))
  }, [])

  function update(name: FieldName, value: string) {
    setFields(f => ({ ...f, [name]: value }))
  }

  // Aceita vírgula decimal (teclado pt-BR): "82,5" → 82.5.
  function toNum(v: string): number | undefined {
    const n = parseFloat(v.replace(',', '.'))
    return isNaN(n) ? undefined : n
  }

  function validate(input: Partial<Record<FieldName, number>>): FieldName | null {
    for (const name of Object.keys(FIELD_BOUNDS) as FieldName[]) {
      const value = input[name]
      if (value === undefined) continue
      const { min, max } = FIELD_BOUNDS[name]
      if (value < min || value > max) return name
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)

    const input: Omit<CheckinInput, 'month'> = {
      weight_kg: toNum(fields.weight_kg),
      body_fat_pct: toNum(fields.body_fat_pct),
      waist_cm: toNum(fields.waist_cm),
      hip_cm: toNum(fields.hip_cm),
      neck_cm: toNum(fields.neck_cm),
      arm_cm: toNum(fields.arm_cm),
      leg_cm: toNum(fields.leg_cm),
      squat_kg: toNum(fields.squat_kg),
      bench_kg: toNum(fields.bench_kg),
      deadlift_kg: toNum(fields.deadlift_kg),
      notes: notes.trim() || undefined,
    }

    const invalid = validate(input)
    if (invalid) {
      setFieldError({ name: invalid, message: boundsMessage(invalid) })
      return
    }

    try {
      await save(input)
      router.push('/checkin/history')
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const fieldName = err.details[0].path[0]
        if (typeof fieldName === 'string' && fieldName in FIELD_BOUNDS) {
          setFieldError({ name: fieldName as FieldName, message: boundsMessage(fieldName as FieldName) })
          return
        }
      }
      setError('Erro ao salvar check-in. Tente novamente.')
    }
  }

  const renderField = (name: FieldName) => (
    <Field
      key={name}
      label={FIELD_UI[name].label}
      unit={FIELD_UI[name].unit}
      value={fields[name]}
      onChange={v => update(name, v)}
      error={fieldError?.name === name ? fieldError.message : null}
    />
  )

  const waist = toNum(fields.waist_cm)
  const neck = toNum(fields.neck_cm)
  const navy =
    waist !== undefined && neck !== undefined && profile?.heightCm && profile.sex
      ? navyBodyFat({ sex: profile.sex, heightCm: profile.heightCm, waistCm: waist, neckCm: neck, hipCm: toNum(fields.hip_cm) })
      : null

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section style={{ marginTop: 24 }}>
        <SectionHeader title="Composição corporal" />
        <div style={grid}>{BODY.map(renderField)}</div>
        {waist !== undefined && neck !== undefined && (
          <p className="t-secondary" style={{ marginTop: 12 }}>
            {navy !== null
              ? `Gordura estimada pela fita métrica (método da Marinha): ${String(navy).replace('.', ',')}%`
              : !profile?.heightCm || !profile.sex
                ? 'Para estimar o % de gordura pela fita métrica, informe altura e sexo no Perfil.'
                : 'Medidas insuficientes para estimar o % de gordura (mulheres: informe também o quadril).'}
          </p>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <SectionHeader title="Performance" />
        <div style={grid}>{PERF.map(renderField)}</div>
      </section>

      <div className="hx-field" style={{ marginTop: 28 }}>
        <label htmlFor="checkin-notes">Observações (opcional)</label>
        <div className="hx-input" style={{ height: 'auto', padding: '10px 14px' }}>
          <textarea
            id="checkin-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 0,
              outline: 'none',
              color: 'var(--text)',
              font: 'inherit',
              fontSize: 15,
              resize: 'vertical',
            }}
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

      <div style={{ marginTop: 24 }}>
        <Button type="submit" kind="primary" size="lg" block loading={saving}>
          {`Salvar check-in de ${currentMonthLabel()}`}
        </Button>
      </div>
    </form>
  )
}
