'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DietGoal } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Segmented'
import { Skeleton } from '@/components/ui/Skeleton'
import { endPhase, getPhase, startPhase, type PhaseResponse } from '@/services/nutrition.service'
import { CalibrationList } from './CalibrationList'
import { GOAL_LABEL, PhaseCard } from './PhaseCard'
import { ProfileGate } from './ProfileGate'

const GOALS = (Object.keys(GOAL_LABEL) as DietGoal[]).map(value => ({ value, label: GOAL_LABEL[value] }))

function StartPhaseForm({ onStarted }: { onStarted: () => void }) {
  const [goal, setGoal] = useState<DietGoal>('perder_gordura')
  const [weeks, setWeeks] = useState('8')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(weeks)
    if (!Number.isInteger(n) || n < 4 || n > 52) {
      setError('A duração deve ficar entre 4 e 52 semanas.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await startPhase(goal, n)
      onStarted()
    } catch {
      setError('Não foi possível iniciar a fase. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 className="t-section">Iniciar uma fase de dieta</h2>
        <p className="t-secondary" style={{ marginTop: 6 }}>
          As metas saem do seu último check-in e são recalibradas a cada novo check-in.
        </p>
      </div>
      <div className="hx-field">
        <span className="t-secondary">Objetivo</span>
        <Segmented label="objetivo da fase" options={GOALS} value={goal} onChange={setGoal} />
      </div>
      <Field label="Duração" unit="semanas" value={weeks} onChange={setWeeks} error={error} inputProps={{ inputMode: 'numeric' }} />
      <Button type="submit" kind="primary" size="lg" block loading={saving}>
        Iniciar fase
      </Button>
    </form>
  )
}

/** Seção Fase da aba Nutrição (spec 018, US0). */
export function PhaseSection() {
  const [data, setData] = useState<PhaseResponse | null>(null)
  const [error, setError] = useState(false)
  const [ending, setEnding] = useState(false)

  const load = useCallback(() => {
    setError(false)
    getPhase().then(setData, () => setError(true))
  }, [])

  useEffect(load, [load])

  async function end() {
    setEnding(true)
    try {
      await endPhase()
      load()
    } finally {
      setEnding(false)
    }
  }

  if (error) {
    return (
      <div style={{ marginTop: 20 }}>
        <Banner kind="err" title="Não foi possível carregar a fase">
          O serviço de nutrição não respondeu. Tente de novo em instantes.
        </Banner>
      </div>
    )
  }
  if (!data) return <Skeleton h={180} style={{ marginTop: 20 }} />
  if (!data.phase && data.missing.length > 0) return <ProfileGate missing={data.missing} onDone={load} />

  return (
    <>
      {data.phase ? (
        <PhaseCard phase={data.phase} bodyFatPct={data.bodyFatPct} ending={ending} onEnd={end} />
      ) : (
        <StartPhaseForm onStarted={load} />
      )}
      <CalibrationList calibrations={data.calibrations} />
    </>
  )
}
