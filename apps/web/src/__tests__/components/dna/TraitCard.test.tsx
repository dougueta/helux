import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TraitCard } from '@/components/dna/TraitCard'

describe('TraitCard', () => {
  it('renders trait name and summary', () => {
    render(
      <TraitCard
        name="Fibras Musculares"
        summary="Predominância de fibras de contração rápida"
        detail="Indica maior potencial para força e hipertrofia. Responde melhor a cargas altas e repetições baixas."
        level="high"
      />
    )
    expect(screen.getByText('Fibras Musculares')).toBeInTheDocument()
    expect(screen.getByText(/predominância/i)).toBeInTheDocument()
  })

  it('toggles detail on click', async () => {
    const user = userEvent.setup()
    render(
      <TraitCard
        name="Recuperação"
        summary="Recuperação acima da média"
        detail="Você tolera bem volumes altos de treino."
        level="medium"
      />
    )
    expect(screen.queryByText(/volumes altos/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button'))
    expect(screen.getByText(/volumes altos/i)).toBeInTheDocument()
  })
})
