import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MuscleMap } from '@/components/workout/MuscleMap'

describe('MuscleMap', () => {
  it('fills primary muscle regions with the accent color', () => {
    const { container } = render(<MuscleMap primary={['peito']} secondary={['ombro', 'triceps']} />)
    const peitoShapes = container.querySelectorAll('[data-muscle="peito"]')
    expect(peitoShapes.length).toBeGreaterThan(0)
    peitoShapes.forEach((el) => expect(el).toHaveAttribute('fill', 'var(--accent)'))
  })

  it('fills secondary muscle regions with the soft accent color', () => {
    const { container } = render(<MuscleMap primary={['peito']} secondary={['ombro', 'triceps']} />)
    for (const key of ['ombro', 'triceps']) {
      const shapes = container.querySelectorAll(`[data-muscle="${key}"]`)
      expect(shapes.length).toBeGreaterThan(0)
      shapes.forEach((el) => expect(el).toHaveAttribute('fill', 'var(--accent-soft)'))
    }
  })

  it('leaves unlisted regions at the neutral surface color', () => {
    const { container } = render(<MuscleMap primary={['peito']} secondary={['ombro']} />)
    for (const key of ['biceps', 'dorsal', 'core', 'quadriceps']) {
      const shapes = container.querySelectorAll(`[data-muscle="${key}"]`)
      expect(shapes.length).toBeGreaterThan(0)
      shapes.forEach((el) => expect(el).toHaveAttribute('fill', 'var(--surface-3)'))
    }
  })

  it('renders a legend entry per primary and secondary muscle with the right label and role', () => {
    render(<MuscleMap primary={['peito']} secondary={['ombro', 'triceps']} />)
    expect(screen.getByText('Peitoral')).toBeInTheDocument()
    expect(screen.getByText('Deltoide')).toBeInTheDocument()
    expect(screen.getByText('Tríceps')).toBeInTheDocument()
    expect(screen.getAllByText('primário')).toHaveLength(1)
    expect(screen.getAllByText('secundário')).toHaveLength(2)
    expect(screen.queryByText('Quadríceps')).not.toBeInTheDocument()
  })

  it('renders with no primary/secondary given (all regions neutral, empty legend)', () => {
    const { container } = render(<MuscleMap />)
    expect(container.querySelectorAll('[data-muscle]').length).toBeGreaterThan(0)
    expect(screen.queryByText('primário')).not.toBeInTheDocument()
  })
})
