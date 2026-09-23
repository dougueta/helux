import type { ExerciseAdjustmentChange } from '@helux/types'

export function AdjustmentChangesList({ changes }: { changes: ExerciseAdjustmentChange[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {changes.map((c, i) => (
        <li
          key={`${c.name}-${i}`}
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, color: 'var(--text)' }}
        >
          <span style={{ fontWeight: 600 }}>{c.name}</span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', color: 'var(--text-dim)' }}>
            {c.setsBefore !== c.setsAfter && <span>{`${c.setsBefore} → ${c.setsAfter} séries`}</span>}
            {c.weightBefore !== c.weightAfter && <span>{`${c.weightBefore} → ${c.weightAfter}`}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
