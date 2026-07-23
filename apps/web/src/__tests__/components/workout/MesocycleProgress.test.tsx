import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MesocycleProgress } from '@/components/workout/MesocycleProgress'

describe('MesocycleProgress', () => {
  it('renderiza total dots, com os primeiros completed preenchidos', () => {
    const { container } = render(<MesocycleProgress completed={1} total={4} />)
    const dots = container.querySelectorAll('[data-testid="progress-dot"]')
    expect(dots).toHaveLength(4)
    expect(dots[0]).toHaveAttribute('data-filled', 'true')
    expect(dots[1]).toHaveAttribute('data-filled', 'false')
    expect(dots[3]).toHaveAttribute('data-filled', 'false')
  })

  it('renderiza o texto acessível "N de M treinos concluídos"', () => {
    render(<MesocycleProgress completed={2} total={4} />)
    expect(screen.getByText('2 de 4 treinos concluídos')).toBeInTheDocument()
  })
})
