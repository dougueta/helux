import Link from 'next/link'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'

interface SessionHistoryRowProps {
  session: WorkoutSessionRow
}

function formatDateBadge(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .toUpperCase()
    .replace('.', '')
}

// h.name in the design mock has no real equivalent: WorkoutSessionRow has no
// workout-name field, only a list of exercises. This mirrors the truncation
// logic already used by the pre-consolidation apps/web/src/app/history/page.tsx
// (first 3 exercise names + "+N").
export function SessionHistoryRow({ session }: SessionHistoryRowProps) {
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const totalVolume = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((setSum, set) => setSum + set.reps * set.weight, 0),
    0
  )
  const durationMin = session.duration_s != null ? Math.round(session.duration_s / 60) : null
  const exerciseNames = session.exercises.slice(0, 3).map(e => e.name).join(', ')
  const extra = session.exercises.length > 3 ? ` +${session.exercises.length - 3}` : ''

  return (
    <Link href={`/history/${session.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          background: 'var(--surface-1)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--r-card)',
          padding: '13px 15px',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-faint)',
            width: 38,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {formatDateBadge(session.date)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {exerciseNames}
            {extra}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{totalSets}</span> séries
            {durationMin != null && (
              <>
                {' '}
                · <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{durationMin}</span> min
              </>
            )}
          </div>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-dim)', fontFamily: 'var(--font-jetbrains-mono)' }}>
          {totalVolume}kg
        </div>
      </div>
    </Link>
  )
}
