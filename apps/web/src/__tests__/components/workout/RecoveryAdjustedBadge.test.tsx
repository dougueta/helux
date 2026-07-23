import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecoveryAdjustedBadge } from '@/components/workout/RecoveryAdjustedBadge'

describe('RecoveryAdjustedBadge', () => {
  it('não renderiza nada quando reason é undefined', () => {
    const { container } = render(<RecoveryAdjustedBadge />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza o badge com ícone e texto quando reason está presente', () => {
    render(<RecoveryAdjustedBadge reason="HRV moderado (52ms)" />)

    expect(screen.getByText(/ajustado/i)).toBeInTheDocument()
    expect(screen.getByTitle('HRV moderado (52ms)')).toBeInTheDocument()
  })
})
