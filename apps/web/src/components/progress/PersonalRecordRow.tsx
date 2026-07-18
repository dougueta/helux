import type { PersonalRecord } from '@helux/types'
import { Icon } from '@/components/ui/icons'
import { formatRelativeWhen } from '@/lib/format-relative-date'

interface PersonalRecordRowProps {
  record: PersonalRecord
}

// Note: the design handoff's mock PR row shows an optional delta badge
// (e.g. "+5kg") and dims the trophy icon when `r.up` is false. Our real
// `PersonalRecord` type has no prior value to diff against — a stored PR is,
// by definition, the current best — so there is no "not up" state to
// represent and no delta to compute without fabricating data. The trophy is
// always rendered in the accent color and no delta badge is shown.
export function PersonalRecordRow({ record }: PersonalRecordRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)',
        padding: '13px 15px',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
        }}
      >
        <Icon name="trophy" size={18} stroke="var(--accent)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)' }}>{record.exerciseName}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>
          {formatRelativeWhen(record.achievedAt)}
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
        {record.maxWeight}kg × {record.reps}
      </div>
    </div>
  )
}
