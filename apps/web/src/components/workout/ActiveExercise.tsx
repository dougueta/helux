'use client'

import { useState } from 'react'
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
  const [cuesExpanded, setCuesExpanded] = useState(false)

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

      {exercise.cues && exercise.cues.length > 0 && (
        <div className="border border-helux-muted/30 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setCuesExpanded((prev) => !prev)}
            className="w-full text-left px-3 py-2 text-sm font-medium text-white bg-helux-muted/10"
          >
            Como executar {cuesExpanded ? '▲' : '▼'}
          </button>
          {cuesExpanded && (
            <ul className="px-3 py-2 space-y-1 text-sm text-helux-muted list-disc list-inside">
              {exercise.cues.map((cue, i) => (
                <li key={i}>{cue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

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
