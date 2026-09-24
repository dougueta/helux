'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { IconButton } from '@/components/ui/Button'
import { HistoryRow } from '@/components/ui/HistoryRow'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { sessionDateLabel, summarizeSession } from '@/lib/sessionSummary'

/** Lista completa de treinos (FR-021): linhas de histórico planas da v2. */
export default function HistoryPage() {
  const router = useRouter()
  const { sessions, total, loading, error } = useWorkoutHistory()

  return (
    <div style={{ maxWidth: 'var(--col)', margin: '0 auto', paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 120 }}>
      <ScreenHeader
        left={<IconButton icon="back" label="voltar" bare onClick={() => router.back()} />}
        title="Histórico"
        sub={!loading && total > 0 ? `${total} treinos` : undefined}
      />
      <div style={{ padding: '0 16px' }}>
        {loading && (
          <div aria-busy="true">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} h={52} style={{ marginTop: 12 }} />
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="t-secondary" style={{ color: 'var(--danger)', marginTop: 12 }}>
            {error}
          </p>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div style={{ marginTop: 20 }}>
            <h1 className="t-section">Nenhum treino registrado ainda</h1>
            <p className="t-secondary" style={{ marginTop: 6 }}>
              Conclua um treino para vê-lo aqui.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link href="/" className="hx-btn hx-btn--secondary">
                Ir para o treino de hoje
              </Link>
            </div>
          </div>
        )}

        {sessions.map(session => {
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
        })}
      </div>
    </div>
  )
}
