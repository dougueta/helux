import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkoutDoneScreen } from '@/components/workout/WorkoutDoneScreen'

function renderScreen(status: 'saving' | 'saved' | 'error') {
  const handlers = { onGoHome: vi.fn(), onRetry: vi.fn(), onBackToWorkout: vi.fn() }
  render(<WorkoutDoneScreen status={status} totalDone={12} elapsed={47} {...handlers} />)
  return handlers
}

describe('WorkoutDoneScreen', () => {
  it('saving: shows progress, never claims the workout was recorded, no actions', () => {
    renderScreen('saving')
    expect(screen.getByText('Salvando treino…')).toBeInTheDocument()
    expect(screen.queryByText(/registrou suas cargas/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('saved: shows success message, summary and "Voltar ao início"', async () => {
    const user = userEvent.setup()
    const { onGoHome } = renderScreen('saved')
    expect(screen.getByText('Treino concluído')).toBeInTheDocument()
    expect(screen.getByText(/O Helux registrou suas cargas/)).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('47')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Voltar ao início' }))
    expect(onGoHome).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
  })

  it('error: shows error, retry and back-to-workout, never claims success', async () => {
    const user = userEvent.setup()
    const { onRetry, onBackToWorkout, onGoHome } = renderScreen('error')
    expect(screen.getByText('Não foi possível salvar')).toBeInTheDocument()
    expect(screen.queryByText(/registrou suas cargas/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Voltar ao início' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Voltar ao treino' }))
    expect(onBackToWorkout).toHaveBeenCalledTimes(1)
    expect(onGoHome).not.toHaveBeenCalled()
  })
})
