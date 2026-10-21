'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DayType, MealItem } from '@helux/types'
import { anchorMealTimes } from '@helux/nutrition'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Segmented } from '@/components/ui/Segmented'
import { Skeleton } from '@/components/ui/Skeleton'
import { applySwap, getHistory, getToday, setDayType, type HistoryDay, type TodayResponse } from '@/services/nutrition.service'
import { DayTargets } from './DayTargets'
import { MealCard } from './MealCard'
import { RecoveryCard } from './RecoveryCard'
import { SwapSheet } from './SwapSheet'

const ACTIVE_WORKOUT_KEY = 'helux:active-workout'

const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: 'treino', label: 'Treino' },
  { value: 'descanso', label: 'Descanso' },
]

const STATUS_LABEL: Record<HistoryDay['status'], string> = {
  ativo: 'Hoje',
  concluido: 'Concluído',
  'treino-nao-realizado': 'Treino não realizado',
}

/** Início do treino ativo neste aparelho (o treino de hoje que ainda não terminou). */
function activeWorkoutStart(): string | undefined {
  try {
    const raw = localStorage.getItem(ACTIVE_WORKOUT_KEY)
    const startedAt = raw ? (JSON.parse(raw) as { startedAt?: string }).startedAt : undefined
    return startedAt && startedAt.slice(0, 10) === new Date().toISOString().slice(0, 10) ? startedAt : undefined
  } catch {
    return undefined
  }
}

function formatDay(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Seção Hoje da aba Nutrição (spec 018, US1). */
export function TodaySection({ onGoToPhase }: { onGoToPhase: () => void }) {
  const [today, setToday] = useState<TodayResponse | null>(null)
  const [history, setHistory] = useState<HistoryDay[]>([])
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [swapping, setSwapping] = useState<{ mealId: string; item: MealItem } | null>(null)

  const load = useCallback(() => {
    setError(false)
    getToday().then(setToday, () => setError(true))
    getHistory().then(days => setHistory(days.filter(d => d.status !== 'ativo')), () => setHistory([]))
  }, [])

  useEffect(load, [load])

  const plan = useMemo(() => {
    if (today?.status !== 'ok') return null
    return anchorMealTimes(today.plan, {
      startedAt: activeWorkoutStart(),
      finishedAt: today.workoutToday?.finishedAt,
      now: new Date().toISOString(),
    })
  }, [today])

  async function changeDayType(dayType: DayType) {
    setBusy(true)
    try {
      setToday(await setDayType(dayType))
    } finally {
      setBusy(false)
    }
  }

  async function pick(toFoodId: string) {
    if (!swapping) return
    const swap = { mealId: swapping.mealId, fromFoodId: swapping.item.foodId, toFoodId }
    setSwapping(null)
    setToday(await applySwap(swap))
  }

  if (error) {
    return (
      <div style={{ marginTop: 20 }}>
        <Banner kind="err" title="Não foi possível carregar o dia">
          O serviço de nutrição não respondeu. Tente de novo em instantes.
        </Banner>
      </div>
    )
  }
  if (!today) return <Skeleton h={220} style={{ marginTop: 20 }} />

  if (today.status !== 'ok' || !plan) {
    return (
      <section style={{ marginTop: 24 }}>
        <h2 className="t-section">Comece pela fase de dieta</h2>
        <p className="t-secondary" style={{ marginTop: 6 }}>
          O plano do dia sai das metas da sua fase de dieta. Inicie uma fase para ver as refeições de hoje.
        </p>
        <div style={{ marginTop: 16 }}>
          <Button kind="primary" block onClick={onGoToPhase}>
            Ir para Fase
          </Button>
        </div>
      </section>
    )
  }

  return (
    <>
      {plan.recovery && <RecoveryCard recovery={plan.recovery} />}
      {!plan.genetics.active && (
        <div style={{ marginTop: 20 }}>
          <Banner kind="warn" title="Personalização genética inativa">
            O teste genético não foi carregado: o plano segue as diretrizes esportivas padrão.
          </Banner>
        </div>
      )}

      <div className="hx-field" style={{ marginTop: 20 }}>
        <span className="t-secondary">Hoje é dia de</span>
        <Segmented
          label="tipo do dia"
          options={DAY_TYPES}
          value={plan.dayType}
          onChange={changeDayType}
          disabled={busy || today.workoutToday !== null}
        />
        {today.workoutToday && <span className="t-caption dim">Você já treinou hoje.</span>}
      </div>

      <DayTargets plan={plan} />

      <section style={{ marginTop: 24 }}>
        <SectionHeader title="Refeições" />
        {plan.meals.map(meal => (
          <MealCard key={meal.id} meal={meal} onSwap={item => setSwapping({ mealId: meal.id, item })} />
        ))}
      </section>

      {history.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <SectionHeader title="Dias anteriores" />
          <ul aria-label="Dias anteriores" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {history.map(d => (
              <li key={d.date} style={{ display: 'flex', gap: 8, padding: '10px 0', borderTop: '1px solid var(--hairline)' }}>
                <span className="t-body" style={{ flex: 1 }}>
                  {formatDay(d.date)}
                </span>
                <span className="t-secondary">{`${d.dayType === 'treino' ? 'Treino' : 'Descanso'} · ${STATUS_LABEL[d.status]}`}</span>
                <span className="n-sm dim">{`${d.targets.kcal} kcal`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SwapSheet mealId={swapping?.mealId ?? ''} item={swapping?.item ?? null} onClose={() => setSwapping(null)} onPick={pick} />
    </>
  )
}
