import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdjustmentChangesList } from '@/components/workout/AdjustmentChangesList'

describe('AdjustmentChangesList', () => {
  it('mostra séries e carga antes → depois por exercício', () => {
    render(
      <AdjustmentChangesList
        changes={[
          { name: 'Supino Reto', setsBefore: 4, setsAfter: 3, weightBefore: '80kg', weightAfter: '72kg' },
          { name: 'Crucifixo', setsBefore: 3, setsAfter: 2, weightBefore: '15kg', weightAfter: '15kg' },
        ]}
      />,
    )
    expect(screen.getByText('Supino Reto')).toBeInTheDocument()
    expect(screen.getByText('4 → 3 séries')).toBeInTheDocument()
    expect(screen.getByText('80kg → 72kg')).toBeInTheDocument()
    expect(screen.getByText('3 → 2 séries')).toBeInTheDocument()
    expect(screen.queryByText('15kg → 15kg')).not.toBeInTheDocument()
  })
})
