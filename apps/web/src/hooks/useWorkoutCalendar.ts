'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TrainingCalendarMonthView } from '@helux/types'
import { getMondayOfDate } from '@helux/workouts'
import { apiFetch } from '@/services/api-client'

export function shiftMonth(month: string, deltaMonths: number): string {
  const [yStr, mStr] = month.split('-')
  const d = new Date(Date.UTC(Number(yStr), Number(mStr) - 1 + deltaMonths, 1, 12, 0, 0))
  return d.toISOString().slice(0, 7)
}

export function useWorkoutCalendar(initialView?: TrainingCalendarMonthView | null) {
  const cacheRef = useRef<Map<string, TrainingCalendarMonthView>>(new Map())
  if (initialView && !cacheRef.current.has(initialView.month)) {
    cacheRef.current.set(initialView.month, initialView)
  }

  const [view, setView] = useState<TrainingCalendarMonthView | null>(initialView ?? null)
  const [loading, setLoading] = useState(!initialView)
  const [error, setError] = useState<string | null>(null)
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(
    initialView?.defaultSelectedWeekStart ?? '',
  )
  const [selectedDate, setSelectedDate] = useState<string>(
    initialView?.defaultSelectedDate ?? '',
  )

  const applyView = useCallback((next: TrainingCalendarMonthView) => {
    cacheRef.current.set(next.month, next)
    setView(next)
    setSelectedWeekStart(next.defaultSelectedWeekStart)
    setSelectedDate(next.defaultSelectedDate)
  }, [])

  const loadMonth = useCallback(
    async (month?: string) => {
      if (month && cacheRef.current.has(month)) {
        const cached = cacheRef.current.get(month)!
        applyView(cached)
        setLoading(false)
        setError(null)
        return cached
      }
      setLoading(true)
      setError(null)
      try {
        const query = month ? `?month=${encodeURIComponent(month)}` : ''
        const data = (await apiFetch(`/api/workouts/calendar${query}`)) as TrainingCalendarMonthView
        applyView(data)
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar o calendário de treino.')
        return null
      } finally {
        setLoading(false)
      }
    },
    [applyView],
  )

  useEffect(() => {
    if (!initialView) {
      void loadMonth()
    }
  }, [initialView, loadMonth])

  const selectDay = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedWeekStart(getMondayOfDate(date))
  }, [])

  const selectWeek = useCallback(
    (weekStart: string) => {
      setSelectedWeekStart(weekStart)
      if (!view) return
      const row = view.weeks.find(w => w.weekStart === weekStart)
      if (!row) return
      // Se o dia selecionado já pertence a esta semana, mantém; senão escolhe o último dia ativo da semana ou a segunda-feira
      if (row.days.some(d => d.date === selectedDate)) return
      const activeDays = row.days.filter(d => d.hasGymWorkout || d.hasComplementaryRoutine || d.weightKg != null)
      const pick = activeDays.length > 0 ? activeDays[activeDays.length - 1]!.date : row.days[0]!.date
      setSelectedDate(pick)
    },
    [view, selectedDate],
  )

  const goPrevMonth = useCallback(() => {
    if (!view) return
    const prev = shiftMonth(view.month, -1)
    void loadMonth(prev)
  }, [view, loadMonth])

  const goNextMonth = useCallback(() => {
    if (!view || !view.canGoNext) return
    const next = shiftMonth(view.month, 1)
    void loadMonth(next)
  }, [view, loadMonth])

  return {
    view,
    loading,
    error,
    selectedWeekStart,
    selectedDate,
    selectDay,
    selectWeek,
    goPrevMonth,
    goNextMonth,
    loadMonth,
  }
}
