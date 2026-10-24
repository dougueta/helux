import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostWorkoutCheckin } from '@/components/workout/PostWorkoutCheckin'

// Spec 024 T090 — check-in de depois: esforço (1–10), sensação, dores e "pular".

describe('PostWorkoutCheckin', () => {
  it('esforço, sensação e dor', async () => {
    const onSubmit = vi.fn()
    render(<PostWorkoutCheckin onSubmit={onSubmit} onSkip={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Esforço 8' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sensação 4' }))
    await userEvent.click(screen.getByRole('button', { name: 'Lombar' }))
    await userEvent.click(screen.getByRole('button', { name: /salvar e concluir/i }))
    expect(onSubmit).toHaveBeenCalledWith({ rpe: 8, feeling: 4, pains: [{ region: 'lombar', intensity: 1 }] })
  })

  it('pular conclui sem check-in', async () => {
    const onSkip = vi.fn()
    render(<PostWorkoutCheckin onSubmit={vi.fn()} onSkip={onSkip} />)
    await userEvent.click(screen.getByRole('button', { name: /pular/i }))
    expect(onSkip).toHaveBeenCalled()
  })
})
