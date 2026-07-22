'use client'

import { useState, useEffect } from 'react'
import { getLatestPlan, generatePlan as generatePlanService, getWorkoutHistory } from '@/services/workout.service'
import { getGeneticProfile } from '@/services/genetics.service'
import { getLatestRecovery } from '@/services/recovery.service'
import { getCheckins } from '@/services/checkin.service'
import type { AdjustedWorkoutPlanView } from '@helux/types'

const STORAGE_KEY = 'helux:workout-plan'

function loadFromStorage(): AdjustedWorkoutPlanView | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AdjustedWorkoutPlanView) : null
  } catch {
    return null
  }
}

function saveToStorage(plan: AdjustedWorkoutPlanView) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  } catch {}
}

export function useWorkoutPlan() {
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

  async function generatePlan() {
    setGenerating(true)
    setGenerationError(null)
    try {
      const [profile, recovery, history, checkins] = await Promise.all([
        getGeneticProfile(),
        getLatestRecovery(),
        getWorkoutHistory(5),
        getCheckins(2),
      ])
      const checkinsSorted = [...checkins].sort((a, b) => a.month.localeCompare(b.month))
      const generated = await generatePlanService(profile, recovery, history, checkinsSorted)
      // POST /workout/generate (manual button) still returns the legacy single-session
      // shape — wrap it into an AdjustedWorkoutPlanView-compatible view so it can be
      // stored alongside mesocycle-backed plans. Known gap: this bypasses the mesocycle
      // entirely (see specs/006-mesociclo-treino-backend/plan.md — Complexity Tracking).
      const newPlan: AdjustedWorkoutPlanView = {
        mesocycleId: null,
        generatedAt: generated.generatedAt,
        today: {
          letter: '',
          focus: '',
          exercises: generated.exercises,
          adjusted: false,
        },
        upcoming: [],
        progress: null,
      }
      saveToStorage(newPlan)
      setPlanState(newPlan)
    } catch (e) {
      setGenerationError(e instanceof Error ? e.message : 'Erro ao gerar plano')
    } finally {
      setGenerating(false)
    }
  }

  function setPlan(p: AdjustedWorkoutPlanView | null) {
    if (p) saveToStorage(p)
    setPlanState(p)
  }

  return { plan, loading, generating, error, generationError, setPlan, generatePlan }
}
