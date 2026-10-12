'use client'

import Link from 'next/link'
import { RecoveryCard } from '@/components/recovery/RecoveryCard'
import { Bars } from '@/components/ui/Bars'
import { HistoryRow } from '@/components/ui/HistoryRow'
import { PRRow } from '@/components/ui/PRRow'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { useRecovery } from '@/hooks/useRecovery'
import { useWorkoutAnalytics } from '@/hooks/useWorkoutAnalytics'
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { formatNumber } from '@/lib/format'
import { formatRelativeWhen } from '@/lib/format-relative-date'
import { sessionDateLabel, summarizeSession } from '@/lib/sessionSummary'
import { computeWeekDelta } from '@/lib/weekly-volume'

/** "2026-09-16" → "16/9" (rótulo da semana nas barras). */
function weekLabel(weekStart: string) {
  const [, m, d] = weekStart.slice(0, 10).split('-').map(Number)
  return `${d}/${m}`
}

const HISTORY_PREVIEW = 3

/** Progresso ("Sua evolução", FR-021, handoff 5.5), com o Histórico junto (research V9). */
export default function RecoveryPage() {
  const { data: recovery, loading: recoveryLoading, isStale } = useRecovery()
  const { data: analytics, loading: analyticsLoading } = useWorkoutAnalytics()
  const { sessions, total: historyTotal, loading: historyLoading, error: historyError } = useWorkoutHistory(HISTORY_PREVIEW)

  const weeks = analytics?.weeklyVolume ?? []
  const lastWeekT = weeks.length > 0 ? weeks[weeks.length - 1].tonnage / 1000 : 0
  const weekDelta = analytics ? computeWeekDelta(weeks) : null
  const hasWorkouts = !!analytics && analytics.totalSessions > 0

  return (
    <div className="hx-page" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 120 }}>
      <h1 className="t-display" style={{ marginTop: 20 }}>
        Sua evolução
      </h1>

      <section style={{ marginTop: 24 }}>
        <SectionHeader title="Recovery de hoje" aside="Apple Watch" />
        {recoveryLoading ? (
          <div aria-busy="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} h={82} r="var(--r-md)" />
            ))}
          </div>
        ) : (
          <RecoveryCard data={recovery} isStale={isStale} />
        )}
      </section>

      {analyticsLoading ? (
        <div aria-busy="true" style={{ marginTop: 28 }}>
          <Skeleton w={140} h={18} />
          <Skeleton w={120} h={44} style={{ marginTop: 16 }} />
          <Skeleton h={120} style={{ marginTop: 16 }} />
        </div>
      ) : !hasWorkouts ? (
        <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
          <h2 className="t-section">Nenhum treino registrado ainda</h2>
          <p className="t-secondary" style={{ marginTop: 6 }}>
            Conclua seu primeiro treino para ver volume, recordes e histórico aqui.
          </p>
          <div style={{ marginTop: 16 }}>
            <Link href="/" className="hx-btn hx-btn--secondary">
              Ir para o treino de hoje
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
            <SectionHeader title="Volume semanal" aside="toneladas" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className="n-xl">
                {formatNumber(lastWeekT, { decimals: 1 })}
                <span className="u" style={{ fontSize: 16 }}>
                  t
                </span>
              </span>
              {weekDelta !== null && (
                <>
                  <span className="n-sm" style={{ color: 'var(--text)' }}>
                    {weekDelta > 0 ? '+' : weekDelta < 0 ? '−' : ''}
                    {Math.abs(weekDelta)}%
                  </span>
                  <span className="t-caption" style={{ whiteSpace: 'nowrap' }}>
                    vs. semana anterior
                  </span>
                </>
              )}
            </div>
            <Bars data={weeks.map(w => ({ label: weekLabel(w.weekStart), value: w.tonnage / 1000 }))} />
          </section>

          <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
            <SectionHeader title="Recordes pessoais" />
            {analytics.personalRecords.length === 0 ? (
              <p className="t-secondary">Seus recordes aparecem aqui conforme você registra treinos.</p>
            ) : (
              analytics.personalRecords.map(pr => (
                <PRRow
                  key={pr.exerciseName}
                  lift={pr.exerciseName}
                  kg={pr.maxWeight}
                  reps={pr.reps}
                  when={formatRelativeWhen(pr.achievedAt).replace(/^./, c => c.toUpperCase())}
                />
              ))
            )}
          </section>

          <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
            <SectionHeader
              title="Histórico"
              action={
                historyTotal > 0 ? (
                  <Link href="/history" className="t-secondary" style={{ color: 'var(--text)' }}>
                    Ver todos
                  </Link>
                ) : undefined
              }
            />
            {historyError && (
              <p role="alert" className="t-secondary" style={{ color: 'var(--danger)' }}>
                {historyError}
              </p>
            )}
            {historyLoading ? (
              <div aria-busy="true">
                {[0, 1, 2].map(i => (
                  <Skeleton key={i} h={52} style={{ marginTop: 12 }} />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="t-secondary">Nenhum treino no histórico ainda.</p>
            ) : (
              sessions.slice(0, HISTORY_PREVIEW).map(session => {
                const s = summarizeSession(session)
                return (
                  <HistoryRow
                    key={session.id}
                    href={`/history/${session.id}`}
                    name={s.name}
                    date={sessionDateLabel(session.date)}
                    sets={s.sets}
                    durationMin={s.durationMin}
                    volumeT={s.volumeT}
                  />
                )
              })
            )}
          </section>
        </>
      )}
    </div>
  )
}
