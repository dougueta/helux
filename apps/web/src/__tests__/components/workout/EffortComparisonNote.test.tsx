import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EffortComparisonNote } from '@/components/workout/EffortComparisonNote'

describe('EffortComparisonNote (spec 027, US2)', () => {
  it('sem alvo ou sem esforço registrado não renderiza nada', () => {
    const { container, rerender } = render(<EffortComparisonNote rir={undefined} level="facil" hasPendingSets />)
    expect(container).toBeEmptyDOMElement()
    rerender(<EffortComparisonNote rir={2} level={null} hasPendingSets />)
    expect(container).toBeEmptyDOMElement()
  })

  it('no alvo, sem sugestão', () => {
    render(<EffortComparisonNote rir={2} level="moderado" hasPendingSets />)
    expect(screen.getByRole('status')).toHaveTextContent(/^No alvo$/)
  })

  it('abaixo do alvo sugere aumentar a carga na próxima série ou no próximo treino', () => {
    const { rerender } = render(<EffortComparisonNote rir={2} level="facil" hasPendingSets />)
    expect(screen.getByRole('status')).toHaveTextContent('Abaixo do alvo · Aumente a carga na próxima série.')
    rerender(<EffortComparisonNote rir={2} level="facil" hasPendingSets={false} />)
    expect(screen.getByRole('status')).toHaveTextContent('Abaixo do alvo · Aumente a carga no próximo treino.')
  })

  it('acima do alvo sugere reduzir a carga ou parar antes da falha', () => {
    render(<EffortComparisonNote rir={2} level="limite" hasPendingSets />)
    expect(screen.getByRole('status')).toHaveTextContent('Acima do alvo · Reduza a carga ou pare antes da falha na próxima série.')
  })
})
