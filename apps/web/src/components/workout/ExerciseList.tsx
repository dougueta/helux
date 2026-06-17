import type { PlannedExercise } from '@helux/types'

interface ExerciseListProps {
  exercises: PlannedExercise[]
  currentIndex: number
}

export function ExerciseList({ exercises, currentIndex }: ExerciseListProps) {
  return (
    <ol className="space-y-2">
      {exercises.map((ex, i) => (
        <li
          key={i}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
            i === currentIndex
              ? 'border-helux-accent bg-helux-accent/10'
              : i < currentIndex
              ? 'border-helux-border opacity-40'
              : 'border-helux-border'
          }`}
        >
          <span className={`font-mono text-sm w-5 text-center ${i === currentIndex ? 'text-helux-accent font-bold' : 'text-helux-muted'}`}>
            {i < currentIndex ? '✓' : i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm text-white truncate">{ex.name}</p>
          </div>
          <p className="font-mono text-xs text-helux-muted shrink-0">{ex.sets}×{ex.reps}</p>
        </li>
      ))}
    </ol>
  )
}
