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

describe('ExerciseSheet (v2, spec 012 T050)', () => {
  function renderSheet(props: Partial<Parameters<typeof ExerciseSheet>[0]> = {}) {
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(<ExerciseSheet open exercise={EXERCISE} onApply={onApply} onClose={onClose} {...props} />)
    return { onApply, onClose }
  }

  it('is a modal sheet with the Execução tab selected by default, cues as numbered steps and the muscle map', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Execução do exercício' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('tab', { name: 'Execução' })).toHaveAttribute('aria-selected', 'true')
    const steps = document.querySelector('ol.hx-steps')!
    expect(steps).toBeInTheDocument()
    expect(steps).toHaveTextContent('Escápulas retraídas e pés firmes no chão')
    expect(screen.getByRole('heading', { name: 'Músculos trabalhados' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino reto com barra')
  })

  it('shows the active variant fit and the muscle/equipment/level tags', () => {
    renderSheet()
    expect(screen.getByRole('img', { name: 'fit genético 96 de 100, alto' })).toBeInTheDocument()
    expect(screen.getByText('Peito')).toBeInTheDocument()
    expect(screen.getByText('Barra')).toBeInTheDocument()
    expect(screen.getByText('Avançado')).toBeInTheDocument()
  })

  it('shows the cadence on the stage, with pause/play and "Repetir"', async () => {
    const user = userEvent.setup()
    renderSheet()
    expect(screen.getByText('2·0·1')).toBeInTheDocument()
    expect(screen.getByText('cadência')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'pausar demonstração' }))
    expect(screen.getByRole('button', { name: 'reproduzir demonstração' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Repetir' })).toBeInTheDocument()
  })

  it('marks a cue starting with "Erro comum:" as the amber warning step', () => {
    renderSheet({ exercise: { ...EXERCISE, cues: ['Pés firmes', 'Erro comum: tirar o quadril do banco'] } })
    const warn = document.querySelector('ol.hx-steps li.is-warn')!
    expect(warn).toHaveTextContent('Erro comum: tirar o quadril do banco')
    expect(document.querySelectorAll('ol.hx-steps li')).toHaveLength(2)
  })

  it('lists the variants flat, with "Atual" on the active one and "Trocar" on the others', async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole('tab', { name: 'Variantes (3)' }))

    expect(screen.getByText('Supino reto com halteres')).toBeInTheDocument()
    expect(screen.getByText('Supino na máquina')).toBeInTheDocument()
    expect(screen.getByText('Atual')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Trocar/ })).toHaveLength(2)
  })

  it('"Trocar" is secondary when the variant fits better than the current one, ghost otherwise', async () => {
    const user = userEvent.setup()
    renderSheet({ currentVariantId: 'e1c' })
    await user.click(screen.getByRole('tab', { name: 'Variantes (3)' }))

    expect(screen.getByRole('button', { name: 'Trocar para Supino reto com barra' })).toHaveClass('hx-btn--secondary')
    expect(screen.getByRole('button', { name: 'Trocar para Supino reto com halteres' })).toHaveClass('hx-btn--secondary')
  })

  it('"Trocar" applies the variant and closes the sheet', async () => {
    const user = userEvent.setup()
    const { onApply, onClose } = renderSheet()
    await user.click(screen.getByRole('tab', { name: 'Variantes (3)' }))
    const trocar = screen.getByRole('button', { name: 'Trocar para Supino na máquina' })
    expect(trocar).toHaveClass('hx-btn--ghost')
    await user.click(trocar)

    expect(onApply).toHaveBeenCalledWith('e1c')
    expect(onClose).toHaveBeenCalled()
  })

  it('"Fechar" in the footer closes the sheet', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet()
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking the scrim closes; clicking inside the sheet does not', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet()

    await user.click(screen.getByRole('heading', { level: 2 }))
    expect(onClose).not.toHaveBeenCalled()

    await user.click(document.querySelector('.hx-scrim')!)
    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing when closed', () => {
    render(<ExerciseSheet open={false} exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('respects an already-active non-recommended currentVariantId', () => {
    renderSheet({ currentVariantId: 'e1b' })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino reto com halteres')
    expect(screen.getByRole('img', { name: 'fit genético 90 de 100, alto' })).toBeInTheDocument()
  })

  it('Execução tab with an alternative variant active shows its genetic reason instead of the planned cues and notes', () => {
    renderSheet({ currentVariantId: 'e1b' })
    expect(screen.queryByText('Escápulas retraídas e pés firmes no chão')).not.toBeInTheDocument()
    expect(screen.queryByText('Cargas altas — seu forte')).not.toBeInTheDocument()
    expect(screen.getByText('Maior amplitude e estabilização')).toBeInTheDocument()
    expect(screen.getByText('corrige assimetrias')).toBeInTheDocument()
    expect(screen.getByText('Músculos trabalhados')).toBeInTheDocument()
  })

  it('Execução tab with the recommended variant active keeps the planned cues and notes', () => {
    renderSheet({ currentVariantId: 'e1' })
    expect(screen.getByText('Escápulas retraídas e pés firmes no chão')).toBeInTheDocument()
    expect(screen.getByText('Cargas altas — seu forte')).toBeInTheDocument()
  })
})

// spec 013 (FR-017): equivalente de outro padrão sugerido por alerta genético
describe('ExerciseSheet — equivalente de outro padrão (spec 013)', () => {
  const SQUAT: PlannedExercise = {
    name: 'Agachamento Livre (Barra)',
    sets: 4,
    reps: '8-10',
    weight: '60kg',
    variants: [
      { id: 'sq', rec: true, name: 'Agachamento Livre (Barra)', equip: 'Barra', level: 'Avançado', match: 74, motion: 'squat', implement: 'barbell', why: 'x' },
      { id: 'rdl', crossPattern: true, name: 'Levantamento Terra Romeno (Halteres)', equip: 'Halteres', level: 'Intermediário', match: 90, motion: 'hinge', implement: 'dumbbell', why: 'Equivalente a agachar com menos carga no joelho, articulação sinalizada no seu perfil genético.' },
      { id: 'lp', name: 'Leg Press 45°', equip: 'Máquina', level: 'Iniciante', match: 96, motion: 'leg-press', implement: 'cable', why: 'y' },
    ],
  }

  it('marca o equivalente com a etiqueta "Equivalente" e permite trocar para ele', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<ExerciseSheet open exercise={SQUAT} onApply={onApply} onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /Variantes/ }))
    expect(screen.getAllByText('Equivalente')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Trocar para Levantamento Terra Romeno (Halteres)' }))
    expect(onApply).toHaveBeenCalledWith('rdl')
  })
})
