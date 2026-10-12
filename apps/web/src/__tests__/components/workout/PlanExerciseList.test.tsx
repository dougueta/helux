import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { PlannedExercise } from '@helux/types'
import { PlanExerciseList } from '@/components/workout/PlanExerciseList'

const phased: PlannedExercise[] = [
  { name: 'Esteira leve', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
  { name: 'Supino Reto', sets: 4, reps: '8-10', weight: '60kg', phase: 'principal' },
  { name: 'Remada Curvada', sets: 4, reps: '8-10', weight: '50kg', phase: 'principal' },
  { name: 'Alongamento de peitoral', sets: 1, reps: '30s cada lado', weight: '—', phase: 'volta-calma' },
]

describe('PlanExerciseList — fases (spec 014, US1)', () => {
  it('agrupa em Aquecimento, Treino principal e Volta à calma, nessa ordem', () => {
    render(<PlanExerciseList exercises={phased} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(headings).toEqual(['Aquecimento', 'Treino principal', 'Volta à calma'])
    const warmup = screen.getByRole('list', { name: 'Aquecimento' })
    expect(within(warmup).getByText('Esteira leve')).toBeInTheDocument()
    expect(within(warmup).getByText('5 min')).toBeInTheDocument()
    const main = screen.getByRole('list', { name: 'Treino principal' })
    expect(within(main).getAllByRole('listitem')).toHaveLength(2)
    expect(within(main).getAllByText('4 × 8–10')).toHaveLength(2)
    expect(within(main).getByText('60kg')).toBeInTheDocument()
  })

  it('não mostra "—" como carga em aquecimento/volta à calma', () => {
    render(<PlanExerciseList exercises={phased} />)
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('plano antigo (só principal, sem fase) aparece sem cabeçalhos de fase', () => {
    render(
      <PlanExerciseList
        exercises={[
          { name: 'Supino Reto', sets: 4, reps: '8-10', weight: '60kg' },
          { name: 'Crucifixo', sets: 3, reps: '12', weight: '14kg' },
        ]}
      />,
    )
    expect(screen.queryAllByRole('heading')).toHaveLength(0)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})

describe('PlanExerciseList — biset (spec 014, US2, FR-012)', () => {
  const withBiset: PlannedExercise[] = [
    { name: 'Supino Reto', sets: 3, reps: '10', weight: '60kg', phase: 'principal', supersetGroup: 'b1' },
    { name: 'Remada Curvada', sets: 3, reps: '10', weight: '50kg', phase: 'principal', supersetGroup: 'b1' },
    { name: 'Rosca Direta', sets: 3, reps: '12', weight: '20kg', phase: 'principal' },
  ]

  it('marca os dois exercícios do biset com o parceiro', () => {
    render(<PlanExerciseList exercises={withBiset} />)
    const [supino, remada, rosca] = screen.getAllByRole('listitem')
    expect(within(supino).getByText('Biset · com Remada Curvada')).toBeInTheDocument()
    expect(within(remada).getByText('Biset · com Supino Reto')).toBeInTheDocument()
    expect(within(rosca).queryByText(/Biset/)).not.toBeInTheDocument()
  })

  it('supersetGroup inválido (sem par consecutivo) não é marcado', () => {
    render(
      <PlanExerciseList
        exercises={[
          { name: 'Supino Reto', sets: 3, reps: '10', weight: '60kg', phase: 'principal', supersetGroup: 'b1' },
          { name: 'Rosca Direta', sets: 3, reps: '12', weight: '20kg', phase: 'principal' },
        ]}
      />,
    )
    expect(screen.queryByText(/Biset/)).not.toBeInTheDocument()
  })
})
