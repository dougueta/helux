'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCheckin } from '@/hooks/useCheckin'
import type { CheckinInput } from '@helux/types'

type FieldName = keyof Omit<CheckinInput, 'month' | 'notes'>

function NumericField({ label, name, value, onChange }: {
  label: string; name: FieldName; value: string; onChange: (n: FieldName, v: string) => void
}) {
  return (
    <div>
      <label htmlFor={name} style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>
        {label}
      </label>
      <input
        id={name}
        type="number"
        inputMode="decimal"
        step="0.1"
        value={value}
        onChange={e => onChange(name, e.target.value)}
        style={{
          width: '100%',
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 15,
          color: 'var(--text)',
          minHeight: 44,
        }}
      />
    </div>
  )
}

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{
      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'none', border: 'none', padding: '12px 0 8px', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.05em',
      minHeight: 44,
    }}>
      {label}
      <span style={{ fontSize: 18, color: 'var(--text-faint)' }}>{open ? '−' : '+'}</span>
    </button>
  )
}

function currentMonthLabel(): string {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

export function CheckinForm() {
  const router = useRouter()
  const { current, saving, save } = useCheckin()

  const toStr = (v?: number | null) => v != null ? String(v) : ''

  const [fields, setFields] = useState<Record<FieldName, string>>({
    weight_kg: toStr(current?.weight_kg),
    body_fat_pct: toStr(current?.body_fat_pct),
    waist_cm: toStr(current?.waist_cm),
    hip_cm: toStr(current?.hip_cm),
    arm_cm: toStr(current?.arm_cm),
    leg_cm: toStr(current?.leg_cm),
    squat_kg: toStr(current?.squat_kg),
    bench_kg: toStr(current?.bench_kg),
    deadlift_kg: toStr(current?.deadlift_kg),
  })
  const [notes, setNotes] = useState(current?.notes ?? '')
  const [showBody, setShowBody] = useState(true)
  const [showPerf, setShowPerf] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function update(name: FieldName, value: string) {
    setFields(f => ({ ...f, [name]: value }))
  }

  function toNum(v: string): number | undefined {
    const n = parseFloat(v)
    return isNaN(n) ? undefined : n
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const input: Omit<CheckinInput, 'month'> = {
        weight_kg: toNum(fields.weight_kg),
        body_fat_pct: toNum(fields.body_fat_pct),
        waist_cm: toNum(fields.waist_cm),
        hip_cm: toNum(fields.hip_cm),
        arm_cm: toNum(fields.arm_cm),
        leg_cm: toNum(fields.leg_cm),
        squat_kg: toNum(fields.squat_kg),
        bench_kg: toNum(fields.bench_kg),
        deadlift_kg: toNum(fields.deadlift_kg),
        notes: notes.trim() || undefined,
      }
      await save(input)
      router.push('/checkin/history')
    } catch {
      setError('Erro ao salvar check-in. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '0 16px 16px' }}>
      <SectionHeader label="COMPOSIÇÃO CORPORAL" open={showBody} onToggle={() => setShowBody(v => !v)} />
      {showBody && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 8 }}>
          <NumericField label="Peso (kg)" name="weight_kg" value={fields.weight_kg} onChange={update} />
          <NumericField label="Gordura (%)" name="body_fat_pct" value={fields.body_fat_pct} onChange={update} />
          <NumericField label="Cintura (cm)" name="waist_cm" value={fields.waist_cm} onChange={update} />
          <NumericField label="Quadril (cm)" name="hip_cm" value={fields.hip_cm} onChange={update} />
          <NumericField label="Braço (cm)" name="arm_cm" value={fields.arm_cm} onChange={update} />
          <NumericField label="Coxa (cm)" name="leg_cm" value={fields.leg_cm} onChange={update} />
        </div>
      )}

      <SectionHeader label="PERFORMANCE" open={showPerf} onToggle={() => setShowPerf(v => !v)} />
      {showPerf && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 8 }}>
          <NumericField label="Agachamento (kg)" name="squat_kg" value={fields.squat_kg} onChange={update} />
          <NumericField label="Supino (kg)" name="bench_kg" value={fields.bench_kg} onChange={update} />
          <NumericField label="Terra (kg)" name="deadlift_kg" value={fields.deadlift_kg} onChange={update} />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>
          OBSERVAÇÕES (opcional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            background: 'var(--surface-2)',
            border: '1px solid var(--hairline)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 14,
            color: 'var(--text)',
            resize: 'vertical',
          }}
        />
      </div>

      {error && <p style={{ color: 'var(--danger, #f87171)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <button type="submit" disabled={saving} style={{
        width: '100%',
        background: 'var(--accent)',
        color: 'var(--accent-ink)',
        border: 'none',
        borderRadius: 'var(--r-pill)',
        padding: '14px 20px',
        fontSize: 15,
        fontWeight: 600,
        fontFamily: 'var(--font-space-grotesk)',
        cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.7 : 1,
        minHeight: 44,
      }}>
        {saving ? 'Salvando…' : `Salvar check-in de ${currentMonthLabel()}`}
      </button>
    </form>
  )
}
