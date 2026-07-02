import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveExercise } from '@/components/workout/ActiveExercise'
import type { PlannedExercise } from '@helux/types'

const BASE_EXERCISE: PlannedExercise = {
  name: 'Agachamento Livre (Barra)',
  sets: 4,
  reps: '8-10',
  weight: '100kg',
}

describe('ActiveExercise — bloco de cues', () => {
  it('não renderiza o bloco "Como executar" quando cues está ausente', () => {
    render(<ActiveExercise exercise={BASE_EXERCISE} setNumber={1} onLog={vi.fn()} />)
    expect(screen.queryByText(/como executar/i)).not.toBeInTheDocument()
  })

  it('renderiza o bloco colapsado por padrão quando cues está presente', () => {
    const exercise: PlannedExercise = { ...BASE_EXERCISE, cues: ['Dica 1', 'Dica 2', 'Dica 3'] }
    render(<ActiveExercise exercise={exercise} setNumber={1} onLog={vi.fn()} />)

    expect(screen.getByText(/como executar/i)).toBeInTheDocument()
    expect(screen.queryByText('Dica 1')).not.toBeInTheDocument()
  })

  it('expande e mostra as cues ao clicar no bloco', async () => {
    const user = userEvent.setup()
    const exercise: PlannedExercise = { ...BASE_EXERCISE, cues: ['Dica 1', 'Dica 2', 'Dica 3'] }
    render(<ActiveExercise exercise={exercise} setNumber={1} onLog={vi.fn()} />)

    await user.click(screen.getByText(/como executar/i))

    expect(screen.getByText('Dica 1')).toBeInTheDocument()
    expect(screen.getByText('Dica 2')).toBeInTheDocument()
    expect(screen.getByText('Dica 3')).toBeInTheDocument()
  })
})
