'use client'

import type { CSSProperties } from 'react'
import type { Sex, UserTrainingProfile, UserTrainingProfileInput } from '@helux/types'
import { Segmented } from '@/components/ui/Segmented'

/** Dados corporais fixos (spec 018): base da TMB e do % de gordura pela Marinha. */
export interface BodyData {
  heightCm: string
  birthDate: string
  sex: Sex | null
}

const SEXES: { value: Sex; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
]

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: 'transparent',
  border: 0,
  outline: 'none',
  color: 'var(--text)',
  font: 'inherit',
  fontSize: 15,
}

export function bodyDataFrom(profile: Pick<UserTrainingProfile, 'heightCm' | 'birthDate' | 'sex'> | null): BodyData {
  return {
    heightCm: profile?.heightCm != null ? String(profile.heightCm) : '',
    birthDate: profile?.birthDate ?? '',
    sex: profile?.sex ?? null,
  }
}

/** Só os campos preenchidos entram no envio. */
export function bodyDataToInput(data: BodyData): Pick<UserTrainingProfileInput, 'heightCm' | 'birthDate' | 'sex'> {
  const height = Number(data.heightCm.replace(',', '.'))
  return {
    ...(data.heightCm.trim() && Number.isFinite(height) ? { heightCm: height } : {}),
    ...(data.birthDate ? { birthDate: data.birthDate } : {}),
    ...(data.sex ? { sex: data.sex } : {}),
  }
}

export function BodyDataFields({ value, onChange }: { value: BodyData; onChange: (next: BodyData) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
        <div className="hx-field">
          <label htmlFor="heightCm">Altura (cm)</label>
          <div className="hx-input">
            <input
              id="heightCm"
              type="number"
              inputMode="decimal"
              min={120}
              max={230}
              value={value.heightCm}
              onChange={e => onChange({ ...value, heightCm: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
        <div className="hx-field">
          <label htmlFor="birthDate">Data de nascimento</label>
          <div className="hx-input">
            <input
              id="birthDate"
              type="date"
              value={value.birthDate}
              onChange={e => onChange({ ...value, birthDate: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      </div>
      <div className="hx-field">
        <span className="t-secondary">Sexo</span>
        <Segmented label="sexo" options={SEXES} value={value.sex} onChange={sex => onChange({ ...value, sex })} />
      </div>
    </div>
  )
}
