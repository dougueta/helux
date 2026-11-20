'use client'

import type { CalendarDaySummary, CalendarWeekRow } from '@helux/types'
import { IconButton } from '@/components/ui/Button'
import { formatTonnageValuePt } from '@helux/workouts'

const WEEKDAY_HEADERS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'] as const
const MONTH_SHORT_PT = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'] as const

function dayAriaLabel(day: CalendarDaySummary): string {
  const [, mStr, dStr] = day.date.split('-')
  const monthShort = MONTH_SHORT_PT[Number(mStr) - 1] ?? ''
  const parts = [`${Number(dStr)} de ${monthShort}`]
  if (day.isToday) parts.push('hoje')
  if (day.hasGymWorkout) parts.push(`${day.gymSessions.length} treino de academia`)
  if (day.hasComplementaryRoutine) parts.push(`${day.routines.length} rotina complementar`)
  if (day.weightKg != null) parts.push(`${String(day.weightKg).replace('.', ',')} kg`)
  return parts.join(', ')
}

export interface CalendarMonthGridProps {
  monthLabel: string
  activeDaysCount: number
  monthTonnageKg: number
  canGoNext: boolean
  weeks: CalendarWeekRow[]
  selectedWeekStart: string
  selectedDate: string
  onSelectDay: (date: string) => void
  onSelectWeek: (weekStart: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function CalendarMonthGrid({
  monthLabel,
  activeDaysCount,
  monthTonnageKg,
  canGoNext,
  weeks,
  selectedWeekStart,
  selectedDate,
  onSelectDay,
  onSelectWeek,
  onPrevMonth,
  onNextMonth,
}: CalendarMonthGridProps) {
  return (
    <section
      className="hx-card"
      style={{ padding: '16px 12px 14px' }}
      aria-label={`Calendário de ${monthLabel}`}
    >
      {/* Cabeçalho do mês com navegação e resumo rápido */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '0 4px 12px',
        }}
      >
        <IconButton icon="back" label="mês anterior" onClick={onPrevMonth} />
        <div style={{ textAlign: 'center', minWidth: 0 }}>
          <h2 className="t-heading" style={{ fontSize: 18, lineHeight: '22px' }}>
            {monthLabel}
          </h2>
          <p className="t-caption" style={{ marginTop: 2 }}>
            <span className="n-sm" style={{ color: 'var(--text)' }}>
              {activeDaysCount} {activeDaysCount === 1 ? 'dia ativo' : 'dias ativos'}
            </span>
            {monthTonnageKg > 0 ? (
              <>
                {' · '}
                <span className="n-sm" style={{ color: 'var(--accent)' }}>
                  {formatTonnageValuePt(monthTonnageKg)}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <IconButton
          icon="chev"
          label="próximo mês"
          disabled={!canGoNext}
          onClick={onNextMonth}
        />
      </div>

      {/* Cabeçalho de dias da semana */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 4,
          padding: '0 4px 6px',
        }}
      >
        {WEEKDAY_HEADERS.map(lbl => (
          <span
            key={lbl}
            className="t-caption"
            style={{
              textAlign: 'center',
              fontSize: 11,
              letterSpacing: '.04em',
              color: 'var(--text-faint)',
            }}
          >
            {lbl}
          </span>
        ))}
      </div>

      {/* Linhas semanais (segunda a domingo) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {weeks.map(week => {
          const isWeekSelected = week.weekStart === selectedWeekStart
          return (
            <div
              key={week.weekStart}
              role="group"
              aria-label={`Semana ${week.label}`}
              onClick={() => onSelectWeek(week.weekStart)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 4,
                padding: 4,
                borderRadius: 'var(--r-md)',
                background: isWeekSelected ? 'var(--surface-2)' : 'transparent',
                boxShadow: isWeekSelected ? 'inset 0 0 0 1px var(--hairline-2)' : 'none',
                transition: 'background var(--dur-2) var(--ease-out), box-shadow var(--dur-2)',
              }}
            >
              {week.days.map(day => {
                const isDaySelected = day.date === selectedDate
                const hasBoth = day.hasGymWorkout && day.hasComplementaryRoutine

                let bg = 'transparent'
                let border = 'transparent'
                let textColor = day.inCurrentMonth ? 'var(--text)' : 'var(--text-disabled)'

                if (isDaySelected) {
                  bg = day.hasGymWorkout ? 'var(--accent)' : 'var(--surface-3)'
                  border = day.hasGymWorkout ? 'var(--accent)' : 'var(--text)'
                  textColor = day.hasGymWorkout ? 'var(--accent-ink)' : 'var(--text)'
                } else if (day.hasGymWorkout) {
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
                  <button
                    key={day.date}
                    type="button"
                    aria-label={dayAriaLabel(day)}
                    aria-pressed={isDaySelected}
                    onClick={e => {
                      e.stopPropagation()
                      onSelectDay(day.date)
                    }}
                    style={{
                      appearance: 'none',
                      border: `1px solid ${border}`,
                      background: bg,
                      color: textColor,
                      borderRadius: 'var(--r-sm)',
                      minHeight: 46,
                      padding: '5px 2px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      opacity: day.inCurrentMonth || isDaySelected ? 1 : 0.42,
                      transition:
                        'transform var(--dur-1) var(--ease-out), background var(--dur-2), border-color var(--dur-2)',
                      position: 'relative',
                    }}
                  >
                    <span
                      className="n-sm"
                      style={{
                        fontWeight: day.isToday || day.hasGymWorkout || isDaySelected ? 700 : 500,
                        fontSize: 13,
                      }}
                    >
                      {day.dayOfMonth}
                    </span>

                    {/* Indicadores visuais inferiores (academia / rotina / hoje) */}
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        height: 8,
                      }}
                    >
                      {hasBoth ? (
                        <>
                          <i
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: isDaySelected ? 'var(--accent-ink)' : 'var(--accent)',
                            }}
                          />
                          <i
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: 'var(--success)',
                            }}
                          />
                        </>
                      ) : day.hasGymWorkout ? (
                        <i
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: isDaySelected ? 'var(--accent-ink)' : 'var(--accent)',
                          }}
                        />
                      ) : day.hasComplementaryRoutine ? (
                        <i
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--success)',
                          }}
                        />
                      ) : day.isToday ? (
                        <i
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: 'var(--text-dim)',
                          }}
                        />
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legenda compacta e clara */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 12,
          padding: '10px 6px 0',
          borderTop: '1px solid var(--hairline)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span className="t-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
              }}
            />
            Academia
          </span>
          <span className="t-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'inline-block',
              }}
            />
            Rotinas
          </span>
          <span className="t-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                boxShadow: 'inset 0 0 0 1.5px var(--hairline-3)',
                display: 'inline-block',
              }}
            />
            Hoje
          </span>
        </div>
        <span className="t-caption" style={{ color: 'var(--text-faint)' }}>
          Toque no dia ou semana
        </span>
      </div>
    </section>
  )
}
