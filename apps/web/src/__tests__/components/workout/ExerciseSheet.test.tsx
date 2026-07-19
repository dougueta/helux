import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseSheet } from '@/components/workout/ExerciseSheet'
import type { PlannedExercise } from '@helux/types'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

const EXERCISE: PlannedExercise = {
  name: 'Supino reto com barra',
  sets: 4,
  reps: '6-8',
  weight: '80kg',
  notes: 'Cargas altas — seu forte',
  muscle: 'Peito',
  muscles: { primary: ['peito'], secondary: ['ombro', 'triceps'] },
  tempo: '2 · 0 · 1',
  cues: ['Escápulas retraídas e pés firmes no chão', 'Desça a barra na linha do mamilo', 'Empurre explodindo'],
  match: 96,
  variants: [
    { id: 'e1', rec: true, name: 'Supino reto com barra', equip: 'Barra', level: 'Avançado', match: 96, motion: 'press-flat', implement: 'barbell', why: 'Cargas altas casam com seu perfil de força.' },
    { id: 'e1b', name: 'Supino reto com halteres', equip: 'Halteres', level: 'Intermediário', match: 90, betterFit: true, motion: 'press-flat', implement: 'dumbbell', why: 'Maior amplitude e estabilização; corrige assimetrias.' },
    { id: 'e1c', name: 'Supino na máquina', equip: 'Máquina', level: 'Iniciante', match: 84, motion: 'press-flat', implement: 'machine', why: 'Mais seguro para falhar sozinho, menos estabilização.' },
  ],
}

describe('ExerciseSheet', () => {
  it('shows the Execução tab by default with cues and the muscle map', () => {
    render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Escápulas retraídas e pés firmes no chão')).toBeInTheDocument()
    expect(screen.getByText('músculos trabalhados', { exact: false })).toBeTruthy
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino reto com barra')
  })

  it('shows the recommended variant\'s match badge and equipment/level chips in the header', () => {
    render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('96')).toBeInTheDocument()
    expect(screen.getAllByText('Barra').length).toBeGreaterThan(0)
  })

  it('switches to the Variantes tab and lists every variant with its flags', async () => {
    const user = userEvent.setup()
    render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)

    await user.click(screen.getByText('Variantes (3)'))

    expect(screen.getByText('Supino reto com halteres')).toBeInTheDocument()
    expect(screen.getByText('Supino na máquina')).toBeInTheDocument()
    expect(screen.getByText('Recomendado')).toBeInTheDocument()
    expect(screen.getByText('fit maior')).toBeInTheDocument()
  })

  it('selecting a different variant updates the preview header without applying it', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<ExerciseSheet exercise={EXERCISE} onApply={onApply} onClose={vi.fn()} />)

    await user.click(screen.getByText('Variantes (3)'))
    await user.click(screen.getByText('Supino reto com halteres'))

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino reto com halteres')
    expect(onApply).not.toHaveBeenCalled()
  })

  it('shows "Fechar" (not the apply button) when the selection has not changed', () => {
    render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Fechar')).toBeInTheDocument()
    expect(screen.queryByText('Usar esta variante')).not.toBeInTheDocument()
  })

  it('shows "Usar esta variante" after selecting a different variant, and it applies + closes', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(<ExerciseSheet exercise={EXERCISE} onApply={onApply} onClose={onClose} />)

    await user.click(screen.getByText('Variantes (3)'))
    await user.click(screen.getByText('Supino reto com halteres'))
    await user.click(screen.getByText('Usar esta variante'))

    expect(onApply).toHaveBeenCalledWith('e1b')
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking the backdrop calls onClose; clicking inside the sheet does not', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(<ExerciseSheet exercise={EXERCISE} onApply={vi.fn()} onClose={onClose} />)

    await user.click(screen.getByRole('heading', { level: 2 }))
    expect(onClose).not.toHaveBeenCalled()

    const backdrop = container.querySelector('[data-testid="sheet-backdrop"]')!
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('respects an already-active non-recommended currentVariantId', () => {
    render(<ExerciseSheet exercise={EXERCISE} currentVariantId="e1b" onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino reto com halteres')
    expect(screen.getByText('Fechar')).toBeInTheDocument()
  })
})
