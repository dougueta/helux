'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { IconButton } from '@/components/ui/Button'
import { Fit } from '@/components/ui/Fit'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiFetch } from '@/services/api-client'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'
import { formatNumber } from '@/lib/format'
import { SessionFeelings } from '@/components/progress/SessionFeelings'
import { sessionDateLabel, summarizeSession } from '@/lib/sessionSummary'

/** Detalhe de um treino (FR-021): variante executada da spec 010 com `Fit` e séries em mono. */
export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<WorkoutSessionRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`/api/workouts/history`)
      .then(data => {
        const d = data as { sessions: WorkoutSessionRow[] }
        setSession(d.sessions.find(s => s.id === id) ?? null)
      })
      .finally(() => setLoading(false))
  }, [id])

  const summary = session ? summarizeSession(session) : null
  const back = <IconButton icon="back" label="voltar" bare onClick={() => router.back()} />

  return (
    <div style={{ maxWidth: 'var(--col)', margin: '0 auto', paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 120 }}>
      <ScreenHeader
        left={back}
        title={session ? sessionDateLabel(session.date) : 'Treino'}
        sub={summary?.durationMin ? `${summary.durationMin} min` : undefined}
      />
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div aria-busy="true">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} h={96} r="var(--r-md)" style={{ marginTop: 12 }} />
            ))}
          </div>
        ) : !session || !summary ? (
          <p className="t-secondary" style={{ textAlign: 'center', padding: '48px 0' }}>
            Treino não encontrado.
          </p>
        ) : (
          <>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '14px 16px', margin: '12px 0 0' }}>
              <div>
                <dt className="t-caption">Volume</dt>
                <dd className="n-md" style={{ margin: '2px 0 0' }}>
                  {formatNumber(summary.volumeT, { decimals: 1 })}
                  <span className="u">t</span>
                </dd>
              </div>
              <div>
                <dt className="t-caption">Séries</dt>
                <dd className="n-md" style={{ margin: '2px 0 0' }}>
                  {summary.sets}
                </dd>
              </div>
            </dl>

            <SessionFeelings checkins={session.checkins} />

            {session.exercises.map((ex, i) => (
              <section key={i} className="hx-plain" style={{ marginTop: 24, paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <h2 className="t-section">{ex.executedVariant ? ex.executedVariant.name : ex.name}</h2>
                  {ex.executedVariant && <Fit value={ex.executedVariant.match} />}
                </div>
                {ex.executedVariant && (
                  <p className="t-secondary" style={{ marginTop: 2 }}>
                    variante de {ex.name}
                  </p>
                )}
                {ex.sets.length === 0 ? (
                  <p className="t-secondary" style={{ marginTop: 8 }}>
                    Pulado
                  </p>
                ) : (
                  <ol style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
                    {ex.sets.map((set, j) => (
                      <li
                        key={j}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '28px minmax(0,1fr) auto',
                          alignItems: 'baseline',
                          gap: 12,
                          padding: '8px 0',
                          borderTop: j ? '1px solid var(--hairline)' : 0,
                        }}
                      >
                        <span className="n-sm dim">{j + 1}</span>
                        <span className="n-md">
                          {formatNumber(set.weight)}
                          <span className="u">kg</span> × {set.reps}
                        </span>
                        <span className="t-caption">RPE {set.effort}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
