import { Chip } from '@/components/ui/Chip'
import type { UpcomingSessionSummary } from '@helux/types'

export function UpcomingSessionsList({ sessions }: { sessions: UpcomingSessionSummary[] }) {
  if (sessions.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
      {sessions.map((session, i) => (
        <div key={`${session.letter}-${i}`} style={{ flexShrink: 0 }}>
          <Chip>{`Treino ${session.letter} — ${session.focus}`}</Chip>
        </div>
      ))}
    </div>
  )
}
