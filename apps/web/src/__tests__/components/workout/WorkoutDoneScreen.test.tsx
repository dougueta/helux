import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { effortTarget } from '@helux/workouts'
import { WorkoutDoneScreen } from '@/components/workout/WorkoutDoneScreen'

function renderScreen(status: 'saving' | 'saved' | 'error') {
  const handlers = { onGoHome: vi.fn(), onRetry: vi.fn(), onBackToWorkout: vi.fn() }
  const { container } = render(
    <WorkoutDoneScreen
      status={status}
      totalDone={12}
      totalSets={14}
      volumeKg={9840}
      exerciseCount={5}
      elapsed={47}
      {...handlers}
    />,
  )
  return { ...handlers, container }
}

describe('WorkoutDoneScreen (v2, spec 012 T056)', () => {
  it('shows the strand with one rung per set, lit for each done set', () => {
    const { container } = renderScreen('saved')
    const strand = screen.getByRole('img', { name: '12 de 14 séries' })
    expect(strand.querySelectorAll('rect')).toHaveLength(14)
    expect(container.querySelector('svg.hx-helix')).toBeInTheDocument()
  })

  it('shows the title, the exercises/duration line and the 2x2 summary without records', () => {
    renderScreen('saved')
    expect(screen.getByRole('heading', { level: 1, name: 'Treino concluído' })).toHaveClass('t-display')
    expect(screen.getByText('5 exercícios, 47 min')).toBeInTheDocument()
    const value = (term: string) => screen.getByText(term).nextElementSibling!
    expect(value('Volume')).toHaveTextContent('9.840kg')
    expect(value('Séries')).toHaveTextContent('12/14')
    expect(value('Duração')).toHaveTextContent('47min')
    expect(screen.queryByText('Recordes')).not.toBeInTheDocument()
    expect(screen.queryByText('Novo recorde')).not.toBeInTheDocument()
  })

  it('saving: loading button and "Salvando treino…", never claims the workout was recorded', async () => {
    const user = userEvent.setup()
    const { onGoHome } = renderScreen('saving')
    expect(screen.getByRole('status')).toHaveTextContent('Salvando treino…')
    expect(screen.queryByText(/registrou suas cargas/)).not.toBeInTheDocument()
    const btn = screen.getByRole('button', { name: 'Voltar para Hoje' })
    expect(btn).toHaveAttribute('aria-busy', 'true')
    await user.click(btn)
    expect(onGoHome).not.toHaveBeenCalled()
  })

  it('saved: confirms the record and "Voltar para Hoje" goes home', async () => {
    const user = userEvent.setup()
    const { onGoHome } = renderScreen('saved')
    expect(screen.getByText(/O Helux registrou suas cargas/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Voltar para Hoje' }))
    expect(onGoHome).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument()
  })

  it('error: error banner, "Tentar de novo" and "Voltar ao treino", never claims success', async () => {
    const user = userEvent.setup()
    const { onRetry, onBackToWorkout, onGoHome } = renderScreen('error')
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar')
    expect(screen.queryByText(/registrou suas cargas/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Voltar para Hoje' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    const back = screen.getByRole('button', { name: 'Voltar ao treino' })
    expect(back).toHaveClass('hx-btn--ghost')
    await user.click(back)
    expect(onBackToWorkout).toHaveBeenCalledTimes(1)
    expect(onGoHome).not.toHaveBeenCalled()
  })
})

describe('WorkoutDoneScreen — resumo de esforço (spec 027, US3)', () => {
  const base = {
    status: 'saved' as const,
    totalDone: 6,
    totalSets: 6,
    volumeKg: 2000,
    exerciseCount: 2,
    elapsed: 30,
    onGoHome: vi.fn(),
    onRetry: vi.fn(),
    onBackToWorkout: vi.fn(),
  }

  it('sem esforço registrado, não mostra a seção', () => {
    const { rerender } = render(<WorkoutDoneScreen {...base} />)
    expect(screen.queryByRole('region', { name: 'Esforço' })).not.toBeInTheDocument()
    rerender(<WorkoutDoneScreen {...base} effort={null} />)
    expect(screen.queryByRole('region', { name: 'Esforço' })).not.toBeInTheDocument()
  })

  it('todos no alvo: só a contagem', () => {
    render(<WorkoutDoneScreen {...base} effort={{ onTarget: 3, total: 3, offTarget: [] }} />)
    const section = screen.getByRole('region', { name: 'Esforço' })
    expect(section).toHaveTextContent('3 de 3 exercícios no esforço-alvo')
    expect(section.querySelector('ul')).toBeNull()
  })

  it('fora do alvo: lista com o alvo e o nível marcado', () => {
    const target = effortTarget(1)!
    render(
      <WorkoutDoneScreen
        {...base}
        effort={{ onTarget: 1, total: 2, offTarget: [{ exerciseIndex: 1, name: 'Supino', target, level: 'facil', result: 'abaixo' }] }}
      />,
    )
    const section = screen.getByRole('region', { name: 'Esforço' })
    expect(section).toHaveTextContent('1 de 2 exercícios no esforço-alvo')
    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent('Supino')
    expect(item).toHaveTextContent('Abaixo do alvo')
    expect(item).toHaveTextContent('alvo Difícil · você marcou Fácil')
  })
})
