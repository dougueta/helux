'use client'

import { useState } from 'react'
import type { UserTrainingProfile, UserTrainingProfileInput } from '@helux/types'

interface ProfileFormProps {
  initial: UserTrainingProfile | null
  saving: boolean
  onSave: (input: UserTrainingProfileInput) => Promise<void>
}

type Level = '' | 'iniciante' | 'intermediario' | 'avancado'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--hairline)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 15,
  color: 'var(--text)',
  minHeight: 44,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--text-faint)',
  marginBottom: 4,
}

export function ProfileForm({ initial, saving, onSave }: ProfileFormProps) {
  const [goal, setGoal] = useState(initial?.goal ?? '')
  const [level, setLevel] = useState<Level>(initial?.level ?? '')
  const [trainingTime, setTrainingTime] = useState(initial?.trainingTime ?? '')
  const [timeOff, setTimeOff] = useState(initial?.timeOff ?? '')
  const [currentInjury, setCurrentInjury] = useState(initial?.currentInjury ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: UserTrainingProfileInput = {
      goal,
      trainingTime,
      timeOff,
      currentInjury,
      ...(level ? { level } : {}),
    }
    await onSave(input)
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ padding: '0 16px 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="goal" style={labelStyle}>OBJETIVO DE TREINO ATUAL</label>
        <textarea
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={2}
          style={{ ...fieldStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="level" style={labelStyle}>NÍVEL DE EXPERIÊNCIA</label>
        <select
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value as Level)}
          style={fieldStyle}
        >
          <option value="">Selecione</option>
          <option value="iniciante">Iniciante</option>
          <option value="intermediario">Intermediário</option>
          <option value="avancado">Avançado</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <div>
          <label htmlFor="trainingTime" style={labelStyle}>TEMPO TREINANDO</label>
          <input
            id="trainingTime"
            type="text"
            value={trainingTime}
            onChange={(e) => setTrainingTime(e.target.value)}
            placeholder="ex.: 3 anos"
            style={fieldStyle}
          />
        </div>
        <div>
          <label htmlFor="timeOff" style={labelStyle}>TEMPO PARADO (opcional)</label>
          <input
            id="timeOff"
            type="text"
            value={timeOff}
            onChange={(e) => setTimeOff(e.target.value)}
            placeholder="ex.: 6 meses"
            style={fieldStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="currentInjury" style={labelStyle}>LESÃO OU PROBLEMA FÍSICO ATUAL (opcional)</label>
        <textarea
          id="currentInjury"
          value={currentInjury}
          onChange={(e) => setCurrentInjury(e.target.value)}
          rows={2}
          style={{ ...fieldStyle, resize: 'vertical' }}
        />
      </div>

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
        {saving ? 'Salvando…' : 'Salvar perfil'}
      </button>
    </form>
  )
}
