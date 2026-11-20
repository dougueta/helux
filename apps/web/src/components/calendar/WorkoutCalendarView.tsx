'use client'

import type { TrainingCalendarMonthView } from '@helux/types'
import { getMondayOfDate } from '@helux/workouts'
import { useWorkoutCalendar } from '@/hooks/useWorkoutCalendar'
import { Skeleton } from '@/components/ui/Skeleton'
import { CalendarMonthGrid } from './CalendarMonthGrid'
import { CalendarDayDetail } from './CalendarDayDetail'
import { WeeklyBalanceCard } from './WeeklyBalanceCard'
import { PeriodCuriositiesSection } from './PeriodCuriositiesSection'

export interface WorkoutCalendarViewProps {
  initialView?: TrainingCalendarMonthView | null
}

export function WorkoutCalendarView({ initialView }: WorkoutCalendarViewProps) {
  const {
    view,
    loading,
    error,
    selectedWeekStart,
    selectedDate,
    selectDay,
    selectWeek,
    goPrevMonth,
    goNextMonth,
  } = useWorkoutCalendar(initialView)

  if (loading && !view) {
    return (
      <div aria-busy="true" aria-label="Carregando calendário de treino" style={{ marginTop: 16 }}>
        <Skeleton h={280} r={16} />
        <Skeleton h={84} r={16} style={{ marginTop: 12 }} />
        <Skeleton h={210} r={24} style={{ marginTop: 16 }} />
      </div>
    )
  }

  if (error && !view) {
    return (
      <p role="alert" className="t-secondary" style={{ color: 'var(--danger)', marginTop: 16 }}>
        {error}
      </p>
    )
  }

  if (!view) return null

  const allDays = view.weeks.flatMap(w => w.days)
  const activeDay =
    allDays.find(d => d.date === selectedDate) ??
    allDays.find(d => d.date === view.defaultSelectedDate) ??
    allDays[0]!

  const activeWeekStart =
    view.weeklyBalances[selectedWeekStart] != null
      ? selectedWeekStart
      : view.defaultSelectedWeekStart

  const activeBalance = view.weeklyBalances[activeWeekStart]
  const activeWeekCuriosities = view.weeklyCuriosities[activeWeekStart] ?? []
  const currentWeekMonday = getMondayOfDate(view.today)

  return (
    <div style={{ marginTop: 16 }}>
      <CalendarMonthGrid
        monthLabel={view.monthLabel}
        activeDaysCount={view.monthTotals.activeDays}
        monthTonnageKg={view.monthTotals.tonnageKg}
        canGoNext={view.canGoNext}
        weeks={view.weeks}
        selectedWeekStart={activeWeekStart}
        selectedDate={activeDay.date}
        onSelectDay={selectDay}
        onSelectWeek={selectWeek}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
      />

      {activeDay && <CalendarDayDetail day={activeDay} />}

      {activeBalance && (
        <WeeklyBalanceCard
          balance={activeBalance}
          isCurrentWeek={activeWeekStart === currentWeekMonday}
        />
      )}

      <PeriodCuriositiesSection
        weekCuriosities={activeWeekCuriosities}
        monthCuriosities={view.monthCuriosities}
        weekLabel={activeBalance?.label ?? activeWeekStart}
        monthLabel={view.monthLabel}
      />
    </div>
  )
}
