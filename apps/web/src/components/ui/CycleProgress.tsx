export type CycleState = 'done' | 'todo' | 'current'

const CLS: Record<CycleState, string> = {
  done: 'hx-cycle-s on',
  todo: 'hx-cycle-s',
  current: 'hx-cycle-s cur',
}

const STATE_TEXT: Record<CycleState, string> = {
  done: 'concluído',
  todo: 'pendente',
  current: 'próximo',
}

/** Progresso do ciclo (`.hx-cycle`). O estado também vai em texto (cor não é o único portador). */
export function CycleProgress({ sessions }: { sessions: { label: string; state: CycleState }[] }) {
  return (
    <div className="hx-cycle" role="list" aria-label="ciclo atual">
      {sessions.map((s, i) => (
        <div key={i} className={CLS[s.state]} role="listitem">
          <i />
          <span>
            {s.label}
            {s.state === 'current' ? ', hoje' : ''}
            <span className="sr">, {STATE_TEXT[s.state]}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
