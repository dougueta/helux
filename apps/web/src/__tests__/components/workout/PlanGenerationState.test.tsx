import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AdjustedWorkoutPlanView } from '@helux/types'
import { PlanGenerationState } from '@/components/workout/PlanGenerationState'

// Spec 024 T041 — estados da geração do mesociclo na Home e em Treinos.

const base: AdjustedWorkoutPlanView = { mesocycleId: 'm1', generatedAt: null, today: null, upcoming: [], progress: null }

describe('PlanGenerationState', () => {
  it('gerando: avisa que o próximo ciclo está sendo preparado', () => {
    render(<PlanGenerationState plan={{ ...base, status: 'generating' }} onRetry={vi.fn()} onRepeatWeek={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent(/preparando seu próximo ciclo/i)
  })

  it('falhou: mensagem, tentar de novo e repetir a última semana', async () => {
    const onRetry = vi.fn()
    const onRepeatWeek = vi.fn()
    const user = userEvent.setup()
    render(
      <PlanGenerationState
        plan={{ ...base, status: 'generation-failed', generation: { status: 'falhou', attempts: 3, errorCode: 'budget-exceeded', startedAt: null } }}
        onRetry={onRetry}
        onRepeatWeek={onRepeatWeek}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/teto mensal de ia/i)
    await user.click(screen.getByRole('button', { name: /tentar de novo/i }))
    await user.click(screen.getByRole('button', { name: /repetir a última semana/i }))
    expect(onRetry).toHaveBeenCalled()
    expect(onRepeatWeek).toHaveBeenCalled()
  })

  it('onboarding pendente: leva ao onboarding', () => {
    render(<PlanGenerationState plan={{ ...base, status: 'onboarding-required' }} onRetry={vi.fn()} onRepeatWeek={vi.fn()} />)
    expect(screen.getByRole('link', { name: /começar/i })).toHaveAttribute('href', '/onboarding')
  })

  it('sem status: não renderiza nada', () => {
    const { container } = render(<PlanGenerationState plan={base} onRetry={vi.fn()} onRepeatWeek={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
