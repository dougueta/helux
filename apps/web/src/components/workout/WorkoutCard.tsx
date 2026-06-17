import type { NextWorkoutPlan } from '@helux/types'

interface WorkoutCardProps {
  plan: NextWorkoutPlan
  onStart: () => void
}

export function WorkoutCard({ plan, onStart }: WorkoutCardProps) {
  return (
    <div className="bg-helux-surface rounded-2xl border border-helux-border overflow-hidden">
      <div className="p-4 border-b border-helux-border">
        <p className="text-xs text-helux-muted font-mono uppercase tracking-wider mb-1">Hoje</p>
        <p className="text-sm text-white/70 leading-relaxed">{plan.rationale}</p>
      </div>

      <ul className="divide-y divide-helux-border">
        {plan.exercises.map((ex, i) => (
          <li key={i} className="px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="font-sans font-medium text-white">{ex.name}</p>
              {ex.notes && <p className="text-xs text-helux-muted mt-0.5">{ex.notes}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-helux-accent text-sm">{ex.sets}×{ex.reps}</p>
              <p className="font-mono text-helux-muted text-xs">{ex.weight}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="p-4">
        <button
          onClick={onStart}
          className="w-full bg-helux-accent text-helux-dark font-sans font-semibold py-4 rounded-xl text-base active:scale-95 transition-transform"
        >
          Iniciar Treino
        </button>
      </div>
    </div>
  )
}
