import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UpcomingSessionsList } from '@/components/workout/UpcomingSessionsList'

describe('UpcomingSessionsList', () => {
  it('não renderiza nada quando sessions está vazio', () => {
    const { container } = render(<UpcomingSessionsList sessions={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza um item por sessão, na ordem do array, sem nenhuma data', () => {
    render(
      <UpcomingSessionsList
        sessions={[
          { letter: 'C', focus: 'Pernas' },
          { letter: 'D', focus: 'Ombro + Core' },
        ]}
      />,
    )

    const items = screen.getAllByText(/Treino [A-Z] —/)
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Treino C — Pernas')
    expect(items[1]).toHaveTextContent('Treino D — Ombro + Core')
    expect(screen.queryByText(/\d{4}-\d{2}-\d{2}/)).not.toBeInTheDocument()
    expect(screen.queryByText(/segunda|terça|quarta|quinta|sexta|sábado|domingo/i)).not.toBeInTheDocument()
  })
})
