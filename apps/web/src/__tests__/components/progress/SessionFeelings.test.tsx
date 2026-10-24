import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionFeelings } from '@/components/progress/SessionFeelings'

// Spec 024 T092 — o histórico mostra esforço, sensação e dores do treino.

describe('SessionFeelings', () => {
  it('mostra antes e depois com as dores', () => {
    render(
      <SessionFeelings
        checkins={{
          antes: { energy: 3, sleep: 4, motivation: 5, pains: [] },
          depois: { rpe: 8, feeling: 4, pains: [{ region: 'lombar', intensity: 2 }] },
        }}
      />,
    )
    expect(screen.getByText('Energia')).toBeInTheDocument()
    expect(screen.getByText('3/5')).toBeInTheDocument()
    expect(screen.getByText('Esforço')).toBeInTheDocument()
    expect(screen.getByText('8/10')).toBeInTheDocument()
    expect(screen.getByText(/lombar · moderada/i)).toBeInTheDocument()
  })

  it('sem check-ins: nada', () => {
    const { container } = render(<SessionFeelings />)
    expect(container).toBeEmptyDOMElement()
  })
})
