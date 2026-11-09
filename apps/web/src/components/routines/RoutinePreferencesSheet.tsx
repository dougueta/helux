'use client'

import { useState, useEffect } from 'react'
import {
  CARDIO_BANK,
  type CategoryPreference,
  type ComplementaryCategory,
  type ComplementaryRoutine,
  type Region,
} from '@helux/types'
import { Sheet } from '@/components/ui/Sheet'

const FOCUS_REGIONS: { region: Region; label: string }[] = [
  { region: 'quadril', label: 'Quadril' },
  { region: 'lombar', label: 'Coluna / Lombar' },
  { region: 'joelho', label: 'Joelho' },
  { region: 'tornozelo', label: 'Tornozelo' },
  { region: 'ombro', label: 'Ombros / Torácica' },
]

export function RoutinePreferencesSheet({
  open,
  category,
  routine,
  initialPref,
  onClose,
  onSave,
}: {
  open: boolean
  category: ComplementaryCategory
  routine: ComplementaryRoutine
  initialPref?: CategoryPreference
  onClose: () => void
  onSave: (category: ComplementaryCategory, pref: CategoryPreference) => Promise<void>
}) {
  const [daysPerWeek, setDaysPerWeek] = useState<number>(initialPref?.daysPerWeek ?? routine.daysPerWeek)
  const [targetMinutes, setTargetMinutes] = useState<number>(initialPref?.targetMinutes ?? routine.estimatedMinutes)
  const [preferredModality, setPreferredModality] = useState<string | undefined>(
    initialPref?.preferredModality ?? routine.items[0]?.cardio?.modality,
  )
  const [focusRegions, setFocusRegions] = useState<Region[]>(initialPref?.focusRegions ?? [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDaysPerWeek(initialPref?.daysPerWeek ?? routine.daysPerWeek)
    setTargetMinutes(initialPref?.targetMinutes ?? routine.estimatedMinutes)
    setPreferredModality(initialPref?.preferredModality ?? routine.items[0]?.cardio?.modality)
    setFocusRegions(initialPref?.focusRegions ?? [])
  }, [category, routine, initialPref, open])

  const minuteOptions = category === 'cardio' ? [15, 20, 25, 30, 40] : [5, 10, 15, 20]
  const allowedModalities = routine.items[0]?.cardio?.allowedModalities ?? ['bike']

  const toggleRegion = (region: Region) => {
    setFocusRegions(prev => (prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(category, {
        daysPerWeek,
        targetMinutes,
        ...(category === 'cardio' && preferredModality ? { preferredModality } : {}),
        ...(category === 'alongamento-mobilidade' ? { focusRegions } : {}),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={`Ajustar ${routine.title}`}
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="hx-btn hx-btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="hx-btn hx-btn--primary hx-btn--block"
            disabled={saving}
            onClick={handleSave}
          >
            Salvar ajustes
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
        <h2 className="t-heading">Ajustar {routine.title}</h2>

        <div>
          <p className="t-caption" style={{ marginBottom: 8 }}>Frequência semanal (dias/semana)</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <button
                key={d}
                type="button"
                className={daysPerWeek === d ? 'hx-btn hx-btn--primary' : 'hx-btn hx-btn--secondary'}
                style={{ minHeight: 38, padding: '0 14px' }}
                aria-pressed={daysPerWeek === d}
                onClick={() => setDaysPerWeek(d)}
              >
                {d}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="t-caption" style={{ marginBottom: 8 }}>Duração-alvo</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {minuteOptions.map(min => (
              <button
                key={min}
                type="button"
                className={targetMinutes === min ? 'hx-btn hx-btn--primary' : 'hx-btn hx-btn--secondary'}
                style={{ minHeight: 38, padding: '0 14px' }}
                aria-pressed={targetMinutes === min}
                onClick={() => setTargetMinutes(min)}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>

        {category === 'alongamento-mobilidade' && (
          <div>
            <p className="t-caption" style={{ marginBottom: 8 }}>Foco articular (opcional)</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FOCUS_REGIONS.map(({ region, label }) => {
                const selected = focusRegions.includes(region)
                return (
                  <button
                    key={region}
                    type="button"
                    className={selected ? 'hx-btn hx-btn--primary' : 'hx-btn hx-btn--secondary'}
                    style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }}
                    aria-pressed={selected}
                    onClick={() => toggleRegion(region)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {category === 'cardio' && (
          <div>
            <p className="t-caption" style={{ marginBottom: 8 }}>Modalidade preferida</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {allowedModalities.map(id => {
                const entry = CARDIO_BANK.find(c => c.id === id)
                if (!entry) return null
                const selected = preferredModality === id
                return (
                  <button
                    key={id}
                    type="button"
                    className={selected ? 'hx-btn hx-btn--primary' : 'hx-btn hx-btn--secondary'}
                    style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }}
                    aria-pressed={selected}
                    onClick={() => setPreferredModality(id)}
                  >
                    {entry.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}
