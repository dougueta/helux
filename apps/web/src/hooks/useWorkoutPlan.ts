'use client'

import { useState, useEffect } from 'react'
import { getLatestPlan, regeneratePlan, repeatLastWeek } from '@/services/workout.service'
import type { AdjustedWorkoutPlanView } from '@helux/types'

const STORAGE_KEY = 'helux:workout-plan'
/** Intervalo entre consultas enquanto o próximo ciclo é gerado (a geração leva de 1 a 3 min). */
const POLL_MS = 4000
/** Desiste de acompanhar depois de ~6 min; a Home continua mostrando "gerando". */
const MAX_POLLS = 90

function loadFromStorage(): AdjustedWorkoutPlanView | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const plan = JSON.parse(raw) as AdjustedWorkoutPlanView
    // Spec 024: plano solto do gerador antigo (sem mesociclo) não vale mais.
    if (!plan.mesocycleId) return null
    // Spec 011: o ajuste por cansaço vale só para o dia — cache de outro dia é descartado.
    const tirednessDate = plan.today?.tiredness?.date
    if (tirednessDate && tirednessDate !== new Date().toISOString().slice(0, 10)) return null
    // Formato anterior à 011 (plano de mesociclo sem avaliação de cansaço): busca de novo.
    if (plan.today && !plan.today.tiredness) return null
    return plan
  } catch {
    return null
  }
}

function saveToStorage(plan: AdjustedWorkoutPlanView) {
  // Estados de espera (gerando, falhou, onboarding) não vão para o cache.
  if (plan.status || !plan.mesocycleId) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  } catch {}
}

export function clearCachedPlan() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function useWorkoutPlan(options: { pollMs?: number } = {}) {
  const pollMs = options.pollMs ?? POLL_MS
  const [plan, setPlanState] = useState<AdjustedWorkoutPlanView | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  useEffect(() => {
    const cached = loadFromStorage()
    if (cached) {
      setPlanState(cached)
      setLoading(false)
      return
    }
    getLatestPlan()
      .then(p => {
        if (p) saveToStorage(p)
        setPlanState(p)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  function setPlan(p: AdjustedWorkoutPlanView | null) {
    if (p) saveToStorage(p)
    setPlanState(p)
  }

  /**
   * "Gerar novo plano" (spec 024): pede um novo mesociclo ao mesmo Agente de
   * Treino e acompanha até ficar pronto. O plano fica salvo na conta.
   */
  async function generatePlan() {
    setGenerating(true)
    setGenerationError(null)
    clearCachedPlan()
    try {
      await regeneratePlan()
      for (let i = 0; i < MAX_POLLS; i++) {
        const p = await getLatestPlan()
        if (p?.status === 'generation-failed') {
          setPlanState(p)
          setGenerationError('Não foi possível gerar o próximo ciclo. Tente de novo ou repita a última semana.')
          return
        }
        if (p && p.status !== 'generating') {
          setPlan(p)
          return
        }
        if (p) setPlanState(p)
        await sleep(pollMs)
      }
    } catch (e) {
      setGenerationError(e instanceof Error ? e.message : 'Erro ao gerar plano')
    } finally {
      setGenerating(false)
    }
  }

  /** Repete a última semana do ciclo enquanto o próximo não fica pronto (spec 024). */
  async function repeatWeek() {
    setGenerationError(null)
    try {
      await repeatLastWeek()
      await refetch()
    } catch (e) {
      setGenerationError(e instanceof Error ? e.message : 'Não foi possível repetir a semana')
    }
  }

  async function refetch() {
    clearCachedPlan()
    const p = await getLatestPlan()
    setPlan(p)
    return p
  }

  return { plan, loading, generating, error, generationError, setPlan, generatePlan, repeatWeek, refetch }
}
