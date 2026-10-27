import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeekBadge } from '@/components/workout/WeekBadge'

// Spec 024 T082 — "semana X de N", deload e tipo do dia.

describe('WeekBadge', () => {
  it('semana atual, total e tipo do dia', () => {
    render(<WeekBadge week={{ current: 2, total: 5, deload: false }} kind="cardio" />)
    expect(screen.getByText(/semana 2 de 5/i)).toBeInTheDocument()
    expect(screen.getByText(/cardio/i)).toBeInTheDocument()
  })

  it('semana de deload avisa que é mais leve', () => {
    render(<WeekBadge week={{ current: 5, total: 5, deload: true }} kind="forca" />)
    expect(screen.getByText(/deload/i)).toBeInTheDocument()
    expect(screen.getByText(/mais leve/i)).toBeInTheDocument()
  })

  it('sem semana (plano antigo): nada', () => {
    const { container } = render(<WeekBadge />)
    expect(container).toBeEmptyDOMElement()
  })
})
