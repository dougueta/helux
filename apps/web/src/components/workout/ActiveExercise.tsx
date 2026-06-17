'use client'

import { useRestTimer } from '@/hooks/useRestTimer'
import { SetLogger } from './SetLogger'
import { RestTimer } from './RestTimer'
import type { PlannedExercise } from '@helux/types'

interface ActiveExerciseProps {
  exercise: PlannedExercise
  setNumber: number
  onLog: (set: { reps: number; weight: number; effort: number }) => void
}

const REST_SECONDS = 90

export function ActiveExercise({ exercise, setNumber, onLog }: ActiveExerciseProps) {
  const { secondsLeft, isActive, start, reset } = useRestTimer()

  function handleLog(set: { reps: number; weight: number; effort: number }) {
    onLog(set)
    start(REST_SECONDS)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-sans font-semibold text-xl text-white">{exercise.name}</h2>
        {exercise.notes && (
          <p className="text-helux-muted text-sm mt-1">{exercise.notes}</p>
        )}
      </div>

      {isActive ? (
        <RestTimer secondsLeft={secondsLeft} isActive={isActive} onSkip={reset} />
      ) : (
        <SetLogger
          setNumber={setNumber}
          targetReps={exercise.reps}
          targetWeight={exercise.weight}
          onLog={handleLog}
        />
      )}
    </div>
  )
}
