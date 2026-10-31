import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EffortTargetLine } from '@/components/workout/EffortTargetLine'

describe('EffortTargetLine (spec 027, US1)', () => {
  it('sem alvo não renderiza nada', () => {
    const { container } = render(<EffortTargetLine rir={undefined} explainable />)
    expect(container).toBeEmptyDOMElement()
  })

  it('mostra o alvo em linguagem simples', () => {
    const { unmount } = render(<EffortTargetLine rir={2} />)
    expect(screen.getByText('Esforço-alvo: Moderado a difícil · sobrar 2 repetições')).toBeInTheDocument()
    unmount()
    render(<EffortTargetLine rir={0} />)
    expect(screen.getByText('Esforço-alvo: No limite · até a falha')).toBeInTheDocument()
  })

  it('na descarga, indica a semana de descarga', () => {
    render(<EffortTargetLine rir={4} deload />)
    expect(screen.getByText('Semana de descarga · Esforço-alvo: Fácil · sobrar 4 repetições')).toBeInTheDocument()
  })

  it('sem explainable, não há botão', () => {
    render(<EffortTargetLine rir={2} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('com explainable, um toque abre e fecha a explicação', async () => {
    const user = userEvent.setup()
    render(<EffortTargetLine rir={2} explainable />)
    const button = screen.getByRole('button', { name: /Esforço-alvo: Moderado a difícil/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/conseguiria fazer mais 2 com boa técnica/)).not.toBeInTheDocument()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const explanation = screen.getByText(/conseguiria fazer mais 2 com boa técnica/)
    expect(button.getAttribute('aria-controls')).toBe(explanation.id)

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/conseguiria fazer mais 2 com boa técnica/)).not.toBeInTheDocument()
  })
})
