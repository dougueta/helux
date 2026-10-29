import { Check } from '@/components/ui/Check'
import { Stepper } from '@/components/ui/Stepper'

/** Série atual em área de foco (`.hx-cur`): steppers digitáveis de kg (0–500, 2 casas) e reps (0–100) e ✓ de 52 px. */
export function CurrentSet({
  no,
  total,
  prev,
  weight,
  reps,
  done = false,
  pop,
  onWeight,
  onReps,
  onDone,
}: {
  no: number
  total: number
  prev: string | null
  weight: number
  reps: number
  done?: boolean
  pop?: boolean
  onWeight: (v: number) => void
  onReps: (v: number) => void
  onDone: () => void
}) {
  return (
    <div className="hx-cur">
      <div className="hx-cur-top">
        <span className="t-body-m">
          Série {no} <span className="dim">de {total}</span>
        </span>
        <span className="t-caption">
          Anterior <span className="n-sm" style={{ color: 'var(--text)' }}>{prev ?? '—'}</span>
        </span>
      </div>
      <div className="hx-cur-row">
        <Stepper value={weight} unit="kg" step={2.5} decimals={2} max={500} onChange={onWeight} label="kg" />
        <Stepper value={reps} unit="reps" step={1} decimals={0} max={100} onChange={onReps} label="reps" />
        <Check
          big
          on={done}
          pop={pop}
          onClick={onDone}
          label={done ? `série ${no} concluída, desfazer` : `concluir série ${no}`}
        />
      </div>
    </div>
  )
}
