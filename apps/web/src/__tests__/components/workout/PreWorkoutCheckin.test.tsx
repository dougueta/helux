import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreWorkoutCheckin } from '@/components/workout/PreWorkoutCheckin'

// Spec 024 T090 — check-in de antes: 4 toques, dor por região e "pular".

describe('PreWorkoutCheckin', () => {
  it('energia, sono, motivação e começar: 4 toques', async () => {
    const onSubmit = vi.fn()
    render(<PreWorkoutCheckin onSubmit={onSubmit} onSkip={vi.fn()} onContinue={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Energia 4' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sono 3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Motivação 5' }))
    await userEvent.click(screen.getByRole('button', { name: /começar treino/i }))
    expect(onSubmit).toHaveBeenCalledWith({ energy: 4, sleep: 3, motivation: 5, pains: [] })
  })

  it('dor: escolhe a região e a intensidade', async () => {
    const onSubmit = vi.fn()
    render(<PreWorkoutCheckin onSubmit={onSubmit} onSkip={vi.fn()} onContinue={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Joelho' }))
    await userEvent.click(screen.getByRole('button', { name: 'Dor no joelho: forte' }))
    await userEvent.click(screen.getByRole('button', { name: /começar treino/i }))
    expect(onSubmit).toHaveBeenCalledWith({ pains: [{ region: 'joelho', intensity: 3 }] })
  })

  it('pular não envia nada', async () => {
    const onSubmit = vi.fn()
    const onSkip = vi.fn()
    render(<PreWorkoutCheckin onSubmit={onSubmit} onSkip={onSkip} onContinue={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /pular/i }))
    expect(onSkip).toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('depois de enviar: mostra as trocas do dia e o motivo', async () => {
    const onContinue = vi.fn()
    render(
      <PreWorkoutCheckin
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
        onContinue={onContinue}
        adjustment={{ reason: 'Hoje o treino poupa joelho.', changes: [{ name: 'Agachamento Livre (Barra)', setsBefore: 4, setsAfter: 3, weightBefore: '80kg', weightAfter: '20kg', replacedBy: 'Cadeira Extensora' }] }}
      />,
    )
    expect(screen.getByText('Hoje o treino poupa joelho.')).toBeInTheDocument()
    expect(screen.getByText(/agachamento livre/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onContinue).toHaveBeenCalled()
  })
})
