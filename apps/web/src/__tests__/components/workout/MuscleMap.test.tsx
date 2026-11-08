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
    expect(screen.getAllByText('Primário')).toHaveLength(1)
    expect(screen.getAllByText('Secundário')).toHaveLength(2)
    expect(screen.queryByText('Quadríceps')).not.toBeInTheDocument()
  })

  it('renders with no primary/secondary given (all regions neutral, empty legend)', () => {
    const { container } = render(<MuscleMap />)
    expect(container.querySelectorAll('[data-muscle]').length).toBeGreaterThan(0)
    expect(screen.queryByText('Primário')).not.toBeInTheDocument()
  })
})

describe('MuscleMap — chaves novas e vista de costas (028, T052)', () => {
  it('sem músculo de costas, mostra só a vista de frente', () => {
    render(<MuscleMap primary={['peito']} secondary={['ombro']} />)
    expect(screen.getByLabelText('músculos trabalhados')).toBeInTheDocument()
    expect(screen.queryByLabelText('músculos trabalhados, costas')).toBeNull()
  })

  it.each(['dorsal', 'trapezio', 'lombar', 'gluteo', 'posterior', 'panturrilha', 'triceps'])(
    'com %s, acrescenta a vista de costas com a região destacada',
    (key) => {
      render(<MuscleMap primary={[key]} />)
      const back = screen.getByLabelText('músculos trabalhados, costas')
      const shapes = back.querySelectorAll(`[data-muscle="${key}"]`)
      expect(shapes.length).toBeGreaterThan(0)
      shapes.forEach((el) => expect(el).toHaveAttribute('fill', 'var(--accent)'))
    },
  )

  it.each(['antebraco', 'adutores', 'abdutores'])('desenha %s na vista de frente', (key) => {
    render(<MuscleMap primary={[key]} />)
    const front = screen.getByLabelText('músculos trabalhados')
    expect(front.querySelectorAll(`[data-muscle="${key}"]`).length).toBeGreaterThan(0)
  })

  it.each([
    ['antebraco', 'Antebraço'],
    ['trapezio', 'Trapézio'],
    ['lombar', 'Lombar'],
    ['posterior', 'Posterior de coxa'],
    ['gluteo', 'Glúteo'],
    ['adutores', 'Adutores'],
    ['abdutores', 'Abdutores'],
    ['panturrilha', 'Panturrilha'],
  ])('rótulo de %s', (key, label) => {
    render(<MuscleMap primary={[key]} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('chave desconhecida aparece como texto bruto na legenda', () => {
    render(<MuscleMap primary={['xpto']} />)
    expect(screen.getByText('xpto')).toBeInTheDocument()
  })

  it('mesa flexora destaca o posterior de coxa (FR-015)', async () => {
    const { resolvePlannedItem } = await import('@helux/exercises')
    const r = resolvePlannedItem({ name: 'Mesa Flexora', sets: 3, reps: '10', weight: '' })
    expect(r.muscles?.primary).toContain('posterior')
    render(<MuscleMap primary={r.muscles!.primary} secondary={r.muscles!.secondary} />)
    const back = screen.getByLabelText('músculos trabalhados, costas')
    back.querySelectorAll('[data-muscle="posterior"]').forEach((el) => expect(el).toHaveAttribute('fill', 'var(--accent)'))
    expect(screen.getByText('Posterior de coxa')).toBeInTheDocument()
  })
})
