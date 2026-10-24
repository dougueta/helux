'use client'

import type { PainReport, Region } from '@helux/types'

// Spec 024 (FR-017/018): peças comuns dos check-ins de antes e depois do treino.

const chip = (on: boolean) => ({
  minWidth: 40,
  minHeight: 40,
  padding: '0 12px',
  borderRadius: 999,
  border: '1px solid var(--hairline)',
  background: on ? 'var(--accent)' : 'transparent',
  color: on ? 'var(--accent-ink)' : 'var(--text)',
  font: 'inherit',
  cursor: 'pointer',
})

/** Escala de 1 a `max` em um toque; o rótulo acessível é "<nome> <n>". */
export function ScaleRow({ label, max, value, onChange, low, high }: { label: string; max: number; value?: number; onChange: (n: number) => void; low: string; high: string }) {
  return (
    <fieldset style={{ border: 0, margin: '16px 0 0', padding: 0 }}>
      <legend className="t-secondary" style={{ color: 'var(--text)' }}>
        {label}
      </legend>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button key={n} type="button" aria-label={`${label} ${n}`} aria-pressed={value === n} onClick={() => onChange(n)} style={chip(value === n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="t-caption" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  )
}

const PAIN_REGIONS: { region: Region; label: string }[] = [
  { region: 'joelho', label: 'Joelho' },
  { region: 'ombro', label: 'Ombro' },
  { region: 'lombar', label: 'Lombar' },
  { region: 'quadril', label: 'Quadril' },
  { region: 'tornozelo', label: 'Tornozelo' },
  { region: 'cotovelo', label: 'Cotovelo' },
  { region: 'punho', label: 'Punho' },
]
const INTENSITY: { value: PainReport['intensity']; label: string }[] = [
  { value: 1, label: 'leve' },
  { value: 2, label: 'moderada' },
  { value: 3, label: 'forte' },
]

/** Dor por região: tocar na região marca dor leve; a intensidade ajusta. */
export function PainPicker({ value, onChange }: { value: PainReport[]; onChange: (pains: PainReport[]) => void }) {
  const toggle = (region: Region) =>
    onChange(value.some(p => p.region === region) ? value.filter(p => p.region !== region) : [...value, { region, intensity: 1 }])
  const setIntensity = (region: Region, intensity: PainReport['intensity']) => onChange(value.map(p => (p.region === region ? { ...p, intensity } : p)))
  return (
    <fieldset style={{ border: 0, margin: '16px 0 0', padding: 0 }}>
      <legend className="t-secondary" style={{ color: 'var(--text)' }}>
        Alguma dor?
      </legend>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {PAIN_REGIONS.map(({ region, label }) => {
          const on = value.some(p => p.region === region)
          return (
            <button key={region} type="button" aria-pressed={on} onClick={() => toggle(region)} style={chip(on)}>
              {label}
            </button>
          )
        })}
      </div>
      {value.map(p => {
        const label = PAIN_REGIONS.find(r => r.region === p.region)?.label.toLowerCase() ?? p.region
        return (
          <div key={p.region} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <span className="t-caption" style={{ minWidth: 72 }}>
              {label}
            </span>
            {INTENSITY.map(i => (
              <button key={i.value} type="button" aria-label={`Dor no ${label}: ${i.label}`} aria-pressed={p.intensity === i.value} onClick={() => setIntensity(p.region, i.value)} style={chip(p.intensity === i.value)}>
                {i.label}
              </button>
            ))}
          </div>
        )
      })}
    </fieldset>
  )
}
