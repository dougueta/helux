import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DemoUnavailable } from '@/components/workout/DemoUnavailable'

describe('DemoUnavailable (028, FR-006)', () => {
  it('mostra o aviso, o nome do item e as notas do plano', () => {
    render(<DemoUnavailable name="Exercício inventado" notes="Faça devagar" />)
    expect(screen.getByRole('status')).toHaveTextContent('Demonstração indisponível para este item')
    expect(screen.getByText('Exercício inventado')).toBeInTheDocument()
    expect(screen.getByText('Faça devagar')).toBeInTheDocument()
  })

  it('não desenha nenhuma figura nem animação', () => {
    const { container } = render(<DemoUnavailable name="X" />)
    expect(container.querySelector('[data-joint]')).toBeNull()
    expect(container.querySelector('[data-motion]')).toBeNull()
  })

  it('sem notas, não mostra o parágrafo de notas', () => {
    render(<DemoUnavailable name="X" />)
    expect(screen.queryByTestId('demo-unavailable-notes')).toBeNull()
  })
})
