import type { CSSProperties } from 'react'

/**
 * Barra de progresso do treino (`.hx-prog`): um grupo por exercício, um traço
 * por série. Cada grupo é um botão que leva ao exercício. O valor total vai num
 * `progressbar` só para leitor de tela, porque os filhos de um progressbar são
 * apresentacionais e não podem ser botões.
 */
export function WorkoutProgress({
  groups,
  done,
  current,
  onPick,
}: {
  groups: number[]
  done: number[]
  current: number
  onPick: (index: number) => void
}) {
  const total = groups.reduce((a, b) => a + b, 0)
  const doneTotal = done.reduce((a, b) => a + b, 0)
  return (
    <div className="hx-prog">
      <span
        className="sr"
        role="progressbar"
        aria-label="séries concluídas"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={doneTotal}
        aria-valuetext={`${doneTotal} de ${total} séries`}
      />
      {groups.map((n, gi) => (
        <button
          key={gi}
          type="button"
          className={gi === current ? 'hx-prog-g is-cur' : 'hx-prog-g'}
          style={{ '--n': n } as CSSProperties}
          aria-label={`Exercício ${gi + 1}, ${done[gi] ?? 0} de ${n} séries`}
          aria-current={gi === current ? 'step' : undefined}
          onClick={() => onPick(gi)}
        >
          {Array.from({ length: n }, (_, i) => (
            <i key={i} className={i < (done[gi] ?? 0) ? 'on' : undefined} />
          ))}
        </button>
      ))}
    </div>
  )
}
