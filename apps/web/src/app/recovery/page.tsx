'use client'

import { RecoveryCard } from '@/components/recovery/RecoveryCard'
import { useRecovery } from '@/hooks/useRecovery'
import { useWorkoutAnalytics } from '@/hooks/useWorkoutAnalytics'
import type { WeeklyVolume, PersonalRecord } from '@helux/types'

// ---------------------------------------------------------------------------
// Week number helper
// ---------------------------------------------------------------------------

function getWeekNum(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00Z')
  const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7)
}

// ---------------------------------------------------------------------------
// Volume bar chart
// ---------------------------------------------------------------------------

function VolumeChart({ weeks }: { weeks: WeeklyVolume[] }) {
  const maxTonnage = Math.max(...weeks.map(w => w.tonnage), 1)
  const barW = 34
  const gap = 6
  const bottom = 68
  const W = weeks.length * (barW + gap) - gap
  const H = 80

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {weeks.map((w, i) => {
        const x = i * (barW + gap)
        const h = Math.max(4, (w.tonnage / maxTonnage) * 56)
        const y = bottom - h
        const isCurrent = i === weeks.length - 1
        const isEmpty = w.tonnage === 0
        const fill = isCurrent
          ? 'var(--accent)'
          : isEmpty
          ? 'var(--surface-3)'
          : 'var(--surface-2)'
        const weekNum = getWeekNum(w.weekStart)

        return (
          <g key={w.weekStart}>
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={fill} />
            <text
              x={x + barW / 2}
              y={H - 2}
              textAnchor="middle"
              fill={isCurrent ? 'var(--accent)' : 'var(--text-faint)'}
              fontSize={9}
              fontFamily="monospace"
            >
              S{weekNum}
            </text>
            {isCurrent && w.tonnage > 0 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fill="var(--accent)"
                fontSize={8}
                fontFamily="monospace"
              >
                {w.tonnage >= 1000 ? `${(w.tonnage / 1000).toFixed(1)}t` : `${w.tonnage}kg`}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton({ h = 96 }: { h?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', height: h }}
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RecoveryPage() {
  const { data: recovery, loading: recoveryLoading, hasData, isStale } = useRecovery()
  const { data: analytics, loading: analyticsLoading } = useWorkoutAnalytics()

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-24">
      {/* Header */}
      <header style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>
          Saúde + Treinos
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
          Progresso
        </h1>
      </header>

      {/* Recovery section */}
      {recoveryLoading ? (
        <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <RecoveryCard data={recovery} isStale={isStale} />
        </div>
      )}

      {/* Analytics section */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', margin: '0 0 12px' }}>
        Evolução de Treinos
      </h2>

      {analyticsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} h={72} />)}
          </div>
          <Skeleton h={100} />
          <Skeleton h={220} />
        </div>
      ) : !analytics || analytics.totalSessions === 0 ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
            Nenhum treino registrado ainda.<br />Conclua seu primeiro treino para ver a evolução.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { value: analytics.thisWeekSessions, label: 'esta semana' },
              { value: analytics.totalSessions, label: 'no total' },
              { value: analytics.currentStreakWeeks, label: 'sem. ativas' },
            ].map(({ value, label }) => (
              <div
                key={label}
                style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '12px 8px', textAlign: 'center' }}
              >
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent)' }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Weekly volume chart */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '16px 16px 10px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0 0 12px' }}>
              Volume (kg·reps)
            </p>
            <VolumeChart weeks={analytics.weeklyVolume} />
          </div>

          {/* Personal records */}
          {analytics.personalRecords.length > 0 && (
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: 0, padding: '14px 16px 10px', borderBottom: '1px solid var(--hairline)' }}>
                Recordes Pessoais
              </p>
              {analytics.personalRecords.map((pr: PersonalRecord, i: number) => (
                <div
                  key={pr.exerciseName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: i < analytics.personalRecords.length - 1 ? '1px solid var(--hairline)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{pr.exerciseName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent)' }}>
                      {pr.maxWeight}kg
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>× {pr.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
