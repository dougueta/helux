'use client'

import Link from 'next/link'
import type { CalendarDaySummary, ComplementaryCategory } from '@helux/types'
import { Icon } from '@/components/ui/icons'
import { sessionDateLabel } from '@/lib/sessionSummary'
import {
  classifyEffort,
  effortClassificationLabelPt,
  formatTonnageValuePt,
  formatWeightValuePt,
} from '@helux/workouts'

const ROUTINE_CATEGORY_LABELS: Record<ComplementaryCategory, string> = {
  'alongamento-mobilidade': 'Alongamento & Mobilidade',
  'core-abdominal': 'Core / Abdominal',
  cardio: 'Cardio Complementar',
}

export interface CalendarDayDetailProps {
  day: CalendarDaySummary
}

export function CalendarDayDetail({ day }: CalendarDayDetailProps) {
  const hasAnyActivity =
    day.gymSessions.length > 0 || day.routines.length > 0 || day.weightKg != null

  return (
    <section
      className="hx-card"
      style={{ marginTop: 12, padding: '14px 16px' }}
      aria-label={`Resumo de ${sessionDateLabel(day.date)}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 className="t-section">{sessionDateLabel(day.date)}</h3>
          {day.isToday && <span className="hx-tag">Hoje</span>}
        </div>
        {day.weightKg != null && (
          <span
            className="hx-tag hx-tag--outline n-sm"
            style={{ color: 'var(--text)' }}
            aria-label={`Peso do dia: ${formatWeightValuePt(day.weightKg)} kg`}
          >
            {formatWeightValuePt(day.weightKg)} kg
          </span>
        )}
      </div>

      {!hasAnyActivity ? (
        <p className="t-secondary" style={{ marginTop: 8 }}>
          {day.isFuture
            ? 'Dia futuro — continue mantendo sua constância na semana.'
            : 'Dia de descanso — nenhuma atividade registrada nesta data.'}
        </p>
      ) : (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Sessões de academia do dia */}
          {day.gymSessions.map(session => {
            const effortBand = classifyEffort(session.avgEffort)
            return (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="hx-row-btn"
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-2)',
                  boxShadow: 'inset 0 0 0 1px var(--accent-line)',
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="dumbbell" size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className="t-body-m"
                    style={{
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {session.title}
                  </span>
                  <span className="t-caption" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                    <span className="n-sm" style={{ color: 'var(--text)' }}>
                      {session.sets} séries
                    </span>
                    {session.tonnageKg > 0 && (
                      <span>· {formatTonnageValuePt(session.tonnageKg)}</span>
                    )}
                    {session.durationMin != null && <span>· {session.durationMin} min</span>}
                    {session.avgEffort != null && (
                      <span>
                        · Esforço {effortClassificationLabelPt(effortBand).toLowerCase()} (
                        {String(session.avgEffort).replace('.', ',')})
                      </span>
                    )}
                  </span>
                </span>
                <span className="dim">
                  <Icon name="chev" size={18} />
                </span>
              </Link>
            )
          })}

          {/* Rotinas complementares do dia */}
          {day.routines.map(routine => {
            const effortBand = classifyEffort(routine.effort)
            return (
              <div
                key={routine.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-2)',
                  boxShadow: 'inset 0 0 0 1px var(--hairline-2)',
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--surface-3)',
                    color: 'var(--success)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="check" size={18} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="t-body-m" style={{ display: 'block' }}>
                    {ROUTINE_CATEGORY_LABELS[routine.category]}
                  </span>
                  <span className="t-caption" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                    <span className="n-sm" style={{ color: 'var(--text)' }}>
                      {routine.durationMin} min
                    </span>
                    {routine.modality && <span>· {routine.modality}</span>}
                    {routine.effort != null && (
                      <span>
                        · Esforço {effortClassificationLabelPt(effortBand).toLowerCase()} (
                        {routine.effort}/10)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
