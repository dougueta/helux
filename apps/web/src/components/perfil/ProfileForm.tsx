'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { UserTrainingProfile, UserTrainingProfileInput } from '@helux/types'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { BodyDataFields, bodyDataFrom, bodyDataToInput } from './BodyDataFields'

interface ProfileFormProps {
  initial: UserTrainingProfile | null
  saving: boolean
  onSave: (input: UserTrainingProfileInput) => Promise<void>
}

type Level = 'iniciante' | 'intermediario' | 'avancado'

const LEVELS: { value: Level; label: string }[] = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

// Campo de texto no invólucro `.hx-input` da v2, com a fonte de texto (o padrão da folha é mono, para números).
const textInput: CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: 'transparent',
  border: 0,
  outline: 'none',
  color: 'var(--text)',
  font: 'inherit',
  fontSize: 15,
  fontWeight: 400,
  letterSpacing: 0,
}

function TextField({
  id,
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  return (
    <div className="hx-field">
      <label htmlFor={id}>{label}</label>
      <div className="hx-input" style={multiline ? { height: 'auto', padding: '10px 14px' } : undefined}>
        {multiline ? (
          <textarea id={id} value={value} rows={2} onChange={e => onChange(e.target.value)} style={{ ...textInput, resize: 'vertical' }} />
        ) : (
          <input id={id} type="text" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={textInput} />
        )}
      </div>
    </div>
  )
}

/** Perfil de treino (spec 008) no visual v2 (FR-023). */
export function ProfileForm({ initial, saving, onSave }: ProfileFormProps) {
  const [goal, setGoal] = useState(initial?.goal ?? '')
  const [level, setLevel] = useState<Level | null>(initial?.level ?? null)
  const [trainingTime, setTrainingTime] = useState(initial?.trainingTime ?? '')
  const [timeOff, setTimeOff] = useState(initial?.timeOff ?? '')
  const [currentInjury, setCurrentInjury] = useState(initial?.currentInjury ?? '')
  const [body, setBody] = useState(() => bodyDataFrom(initial))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: UserTrainingProfileInput = {
      goal,
      trainingTime,
      timeOff,
      currentInjury,
      ...(level ? { level } : {}),
      ...bodyDataToInput(body),
    }
    await onSave(input)
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 28 }}>
      <TextField id="goal" label="Objetivo de treino atual" value={goal} onChange={setGoal} multiline />

      <div className="hx-field">
        <span className="t-secondary">Nível de experiência</span>
        <Segmented label="nível de experiência" options={LEVELS} value={level} onChange={setLevel} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
        <TextField id="trainingTime" label="Tempo treinando" value={trainingTime} onChange={setTrainingTime} placeholder="ex.: 3 anos" />
        <TextField id="timeOff" label="Tempo parado (opcional)" value={timeOff} onChange={setTimeOff} placeholder="ex.: 6 meses" />
      </div>

      <TextField
        id="currentInjury"
        label="Lesão ou problema físico atual (opcional)"
        value={currentInjury}
        onChange={setCurrentInjury}
        multiline
      />
      {currentInjury.trim() && (
        <Link href="/equipe?agente=medicina" className="t-secondary" style={{ color: 'var(--text)', marginTop: -12 }}>
          Conversar com a Medicina Esportiva sobre isso
        </Link>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="t-section">Dados corporais</h2>
        <p className="t-secondary">Usados para calcular as metas de nutrição e o % de gordura pela fita métrica.</p>
        <BodyDataFields value={body} onChange={setBody} />
      </section>

      <Button type="submit" kind="primary" size="lg" block loading={saving} disabled={saving}>
        {saving ? 'Salvando…' : 'Salvar perfil'}
      </Button>
    </form>
  )
}
