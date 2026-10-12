import type { ExerciseAdjustmentChange } from '@helux/types'

/** Mudanças do treino (spec 011) em lista plana v2: nome à esquerda, antes → depois em mono à direita. */
export function AdjustmentChangesList({ changes }: { changes: ExerciseAdjustmentChange[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {changes.map((c, i) => (
        <li
          key={`${c.name}-${i}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 0',
            borderTop: i ? '1px solid var(--hairline)' : 0,
          }}
        >
          <span className="t-body-m">{c.name}</span>
          <span className="n-sm dim" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {c.setsBefore !== c.setsAfter && <span>{`${c.setsBefore} → ${c.setsAfter} séries`}</span>}
            {c.weightBefore !== c.weightAfter && <span>{`${c.weightBefore} → ${c.weightAfter}`}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
