'use client'

import Link from 'next/link'
import type { TrainingCalendarMonthView } from '@helux/types'
import { formatTonnageValuePt, getMondayOfDate } from '@helux/workouts'
import { useWorkoutCalendar } from '@/hooks/useWorkoutCalendar'
import { Icon } from '@/components/ui/icons'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'

const SHORT_WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const

export interface WeeklyCalendarStripProps {
  initialView?: TrainingCalendarMonthView | null
}

export function WeeklyCalendarStrip({ initialView }: WeeklyCalendarStripProps) {
  const { view, loading } = useWorkoutCalendar(initialView)

  if (loading && !view) {
    return (
      <section style={{ marginTop: 24 }} aria-label="Resumo semanal do calendário" aria-busy="true">
        <SectionHeader title="Sua semana" />
        <Skeleton h={108} r={16} />
      </section>
    )
  }

  if (!view) return null

  const currentMonday = getMondayOfDate(view.today)
  const currentWeek =
    view.weeks.find(w => w.weekStart === currentMonday) ??
    view.weeks.find(w => w.weekStart === view.defaultSelectedWeekStart) ??
    view.weeks[view.weeks.length - 1]

  if (!currentWeek) return null

  const balance = view.weeklyBalances[currentWeek.weekStart]
  const gymDays = balance?.gymDays ?? 0
  const targetGymDays = balance?.targetGymDays ?? 4
  const activeDays = balance?.activeDays ?? 0
  const tonnageKg = balance?.tonnageKg ?? 0

  return (
    <section style={{ marginTop: 24 }} aria-label="Resumo semanal do calendário">
      <SectionHeader
        title="Sua semana"
        action={
          <span className="t-caption">
            <span className="n-sm" style={{ color: 'var(--text)' }}>
              {gymDays}/{targetGymDays} treinos
            </span>
            {' · '}
            <span className="n-sm">{activeDays} dias ativos</span>
            {tonnageKg > 0 ? ` · ${formatTonnageValuePt(tonnageKg)}` : ''}
          </span>
        }
      />

      <Link
        href="/history"
        aria-label="Abrir calendário de treino"
        className="hx-card"
        style={{
          display: 'block',
          padding: '14px 14px 12px',
          textDecoration: 'none',
          color: 'var(--text)',
          transition: 'background var(--dur-2)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 6,
          }}
        >
          {currentWeek.days.map((day, idx) => {
            const hasBoth = day.hasGymWorkout && day.hasComplementaryRoutine
            let bg = 'var(--surface-2)'
            let border = 'var(--hairline)'
            let textColor = day.isFuture ? 'var(--text-disabled)' : 'var(--text)'

            if (day.hasGymWorkout) {
              bg = 'var(--accent-soft)'
              border = 'var(--accent-line)'
              textColor = 'var(--accent)'
            } else if (day.hasComplementaryRoutine) {
              bg = 'var(--surface-2)'
              border = 'var(--hairline-3)'
              textColor = 'var(--success)'
            } else if (day.isToday) {
              border = 'var(--hairline-3)'
            }

            return (
              <div
                key={day.date}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span className="t-caption" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  {SHORT_WEEKDAYS[idx]}
                </span>
                <span
                  style={{
                    width: '100%',
                    minHeight: 40,
                    borderRadius: 'var(--r-sm)',
                    background: bg,
                    border: `1px solid ${border}`,
                    color: textColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                  }}
                >
                  <span className="n-sm" style={{ fontWeight: day.isToday || day.hasGymWorkout ? 700 : 500 }}>
                    {day.dayOfMonth}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      height: 6,
                    }}
                  >
                    {hasBoth ? (
                      <>
                        <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
                        <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)' }} />
                      </>
                    ) : day.hasGymWorkout ? (
                      <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
                    ) : day.hasComplementaryRoutine ? (
                      <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)' }} />
                    ) : day.isToday ? (
                      <i style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-dim)' }} />
                    ) : null}
                  </span>
                </span>
              </div>
            )
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--hairline)',
          }}
        >
          <span className="t-secondary" style={{ color: 'var(--text)' }}>
            Ver calendário, saldo da semana e curiosidades
          </span>
          <span className="dim" style={{ display: 'grid' }}>
            <Icon name="chev" size={18} />
          </span>
        </div>
      </Link>
    </section>
  )
}
