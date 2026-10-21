import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { RecoveryAdjustment } from '@helux/types'
import { RecoveryCard } from '@/components/nutrition/RecoveryCard'

const TIRED: RecoveryAdjustment = {
  level: 'cansado',
  extraWaterMl: 500,
  notes: ['Reforce a hidratação ao longo do dia.', 'Priorize magnésio e vitamina B6.'],
  note: null,
}

describe('RecoveryCard (spec 018, US3)', () => {
  it('cansado: título, água extra e as orientações, sem nota', () => {
    render(<RecoveryCard recovery={TIRED} />)
    expect(screen.getByRole('heading', { name: /ajuste nutricional de recuperação/i })).toBeInTheDocument()
    expect(screen.getByText(/\+0,5 L de água/i)).toBeInTheDocument()
    expect(screen.getByText(/magnésio e vitamina B6/i)).toBeInTheDocument()
    expect(screen.queryByText(/sistema nervoso/i)).not.toBeInTheDocument()
  })

  it('exausto: mostra o nível e a nota de recuperação', () => {
    render(
      <RecoveryCard
        recovery={{ ...TIRED, level: 'exausto', extraWaterMl: 750, note: 'Recupere o sistema nervoso: durma 8 h.' }}
      />,
    )
    expect(screen.getByText(/exausto/i)).toBeInTheDocument()
    expect(screen.getByText(/\+0,8 L de água/i)).toBeInTheDocument()
    expect(screen.getByText(/sistema nervoso/i)).toBeInTheDocument()
  })
})
