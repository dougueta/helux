'use client'

import { RecoveryCard } from '@/components/recovery/RecoveryCard'
import { StatGrid, type StatGridItem } from '@/components/progress/StatGrid'
import { BarChart, type BarChartPoint } from '@/components/progress/BarChart'
import { PersonalRecordRow } from '@/components/progress/PersonalRecordRow'
import { SessionHistoryRow } from '@/components/progress/SessionHistoryRow'
import { Icon } from '@/components/ui/icons'
import { Label } from '@/components/ui/Label'
import { useRecovery } from '@/hooks/useRecovery'
import { useWorkoutAnalytics } from '@/hooks/useWorkoutAnalytics'
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { getWeekLabel, computeWeekDelta } from '@/lib/weekly-volume'

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

function SectionHead({ title }: { title: string }) {
  return (
    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', margin: '20px 0 12px' }}>
      {title}
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RecoveryPage() {
  const { data: recovery, loading: recoveryLoading, isStale } = useRecovery()
  const { data: analytics, loading: analyticsLoading } = useWorkoutAnalytics()
  const { sessions, loading: historyLoading, error: historyError } = useWorkoutHistory()

  const stats: StatGridItem[] = analytics
    ? [
        { value: analytics.thisWeekSessions, label: 'esta semana', sub: 'treinos' },
        { value: analytics.totalSessions, label: 'no total', sub: 'treinos' },
        { value: analytics.currentStreakWeeks, label: 'sequência', sub: 'semanas ativas' },
        { value: recovery?.hrv ?? '—', label: 'HRV', sub: isStale ? 'dados antigos' : 'recuperação' },
      ]
    : []

  const volumePoints: BarChartPoint[] = analytics
    ? analytics.weeklyVolume.map(w => ({ label: getWeekLabel(w.weekStart), value: w.tonnage }))
    : []

  const lastWeekTonnage =
    analytics && analytics.weeklyVolume.length > 0
      ? analytics.weeklyVolume[analytics.weeklyVolume.length - 1].tonnage
      : 0

  const weekDelta = analytics ? computeWeekDelta(analytics.weeklyVolume) : null

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-24">
      <header style={{ marginBottom: 20 }}>
        <Label>Sua evolução</Label>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
          Progresso
        </h1>
      </header>

      {/*
        Recovery / daily health metrics — kept from the pre-consolidation page.
        The design handoff's ScreenProgress mock omits this section entirely
        (its mock data is workout-only), but HRV/resting-HR/calories/sleep/
        cardio-recovery are real, live functionality that must not be dropped.
        Preserved here as its own section above the design's 4-part structure.
      */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <Label>Saúde diária</Label>
        </div>
        {recoveryLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : (
          <RecoveryCard data={recovery} isStale={isStale} />
        )}
      </div>

      {analyticsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} h={72} />
            ))}
          </div>
          <Skeleton h={160} />
          <Skeleton h={220} />
        </div>
      ) : !analytics || analytics.totalSessions === 0 ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
            Nenhum treino registrado ainda.
            <br />
            Conclua seu primeiro treino para ver a evolução.
          </p>
        </div>
      ) : (
        <>
          <StatGrid stats={stats} />

          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 16, marginBottom: 12 }}>
            <Label>Volume semanal</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 16px' }}>
              <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
                {lastWeekTonnage}kg
              </span>
              {weekDelta !== null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 13,
                    fontWeight: 600,
                    color: weekDelta >= 0 ? 'var(--accent)' : 'var(--danger)',
                  }}
                >
                  <Icon
                    name="arrowUp"
                    size={13}
                    stroke={weekDelta >= 0 ? 'var(--accent)' : 'var(--danger)'}
                    style={weekDelta < 0 ? { transform: 'rotate(180deg)' } : undefined}
                  />
                  {weekDelta >= 0 ? '+' : ''}
                  {weekDelta}%
                </span>
              )}
            </div>
            <BarChart data={volumePoints} height={120} />
          </div>

          <SectionHead title="Recordes pessoais" />
          {analytics.personalRecords.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Nenhum recorde ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {analytics.personalRecords.map(pr => (
                <PersonalRecordRow key={pr.exerciseName} record={pr} />
              ))}
            </div>
          )}

          <SectionHead title="Histórico" />
          {historyError && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{historyError}</p>}
          {historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} h={64} />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Nenhum treino no histórico ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map(session => (
                <SessionHistoryRow key={session.id} session={session} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
