'use client'

import Link from 'next/link'
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { pageContainer } from '@/components/ui/layout'

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}min`
}

export default function HistoryPage() {
  const { sessions, total, loading, error } = useWorkoutHistory()

  return (
    <div style={{ ...pageContainer, paddingTop: 48, paddingBottom: 96 }}>
      <header style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>
          Histórico
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
          Treinos
        </h1>
        {!loading && total > 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{total} treinos registrados</p>
        )}
      </header>

      {loading && (
        <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height={80} style={{ border: '1px solid var(--hairline)' }} />
          ))}
        </div>
      )}

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      {!loading && sessions.length === 0 && (
        <Card padding={24} style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text)', marginBottom: 4 }}>Nenhum treino registrado ainda.</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Complete um treino para ver o histórico.</p>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sessions.map(session => {
          const exerciseNames = session.exercises.slice(0, 3).map(e => e.name).join(', ')
          const extra = session.exercises.length > 3 ? ` +${session.exercises.length - 3}` : ''
          return (
            <Link
              key={session.id}
              href={`/history/${session.id}`}
              style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 16, display: 'block' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: 14 }}>
                  {new Date(session.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-dim)', fontSize: 12 }}>{formatDuration(session.duration_s)}</p>
              </div>
              <p style={{ color: 'var(--text-faint)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exerciseNames}{extra}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
