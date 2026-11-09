import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlanExerciseList } from '@/components/workout/PlanExerciseList'
import type { PlannedExercise } from '@helux/types'

const EXERCISES: PlannedExercise[] = [
  {
    name: 'Mobilidade de ombro',
    sets: 1,
    reps: '10',
    weight: '0kg',
    phase: 'aquecimento',
  },
  {
    name: 'Supino Reto',
    sets: 4,
    reps: '8-10',
    weight: '60kg',
    phase: 'principal',
  },
  {
    name: 'Alongamento de peitoral',
    sets: 1,
    reps: '30s',
    weight: '0kg',
    phase: 'volta-calma',
  },
  {
    name: 'Bike ergométrica leve',
    sets: 1,
    reps: '15 min',
    weight: '0kg',
    phase: 'volta-calma',
    cardio: { modality: 'bike', minutes: 15, zone: 'leve' },
  },
]

describe('PlanExerciseList — sinergia com Rotinas Complementares (030 — FR-014, SC-004)', () => {
  it('exibe selo "Já cumprido hoje nas Rotinas" nos itens de volta à calma/cardio quando concluídos hoje', () => {
    render(
      <PlanExerciseList
        exercises={EXERCISES}
        completedToday={['alongamento-mobilidade', 'cardio']}
      />,
    )

    expect(screen.getByText('Já cumprido hoje nas Rotinas (Alongamento)')).toBeInTheDocument()
    expect(screen.getByText('Já cumprido hoje nas Rotinas (Cardio)')).toBeInTheDocument()
  })

  it('não exibe selo quando nenhuma rotina complementar foi concluída hoje', () => {
    render(<PlanExerciseList exercises={EXERCISES} completedToday={[]} />)

    expect(screen.queryByText(/Já cumprido hoje nas Rotinas/)).not.toBeInTheDocument()
  })
})
