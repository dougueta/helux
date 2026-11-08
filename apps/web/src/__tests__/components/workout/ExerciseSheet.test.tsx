import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseSheet } from '@/components/workout/ExerciseSheet'
import type { PlannedExercise } from '@helux/types'

vi.mock('@helux/exercises', async (importOriginal) => (await import('../../helpers/exercises-pending')).withTestPending(importOriginal))

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

const EXERCISE: PlannedExercise = {
  name: 'Supino Reto (Barra)',
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
    { id: 'supino-reto-barra', rec: true, name: 'Supino Reto (Barra)', equip: 'Barra', level: 'Avançado', match: 96, motion: 'press-flat', implement: 'barbell', why: 'Cargas altas casam com seu perfil de força.' },
    { id: 'supino-reto-halteres', name: 'Supino Reto (Halteres)', equip: 'Halteres', level: 'Intermediário', match: 90, betterFit: true, motion: 'press-flat', implement: 'dumbbell', why: 'Maior amplitude e estabilização; corrige assimetrias.' },
    { id: 'supino-maquina', name: 'Supino Máquina', equip: 'Máquina', level: 'Iniciante', match: 84, motion: 'press-flat', implement: 'machine', why: 'Mais seguro para falhar sozinho, menos estabilização.' },
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
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino Reto (Barra)')
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

    expect(screen.getByText('Supino Reto (Halteres)')).toBeInTheDocument()
    expect(screen.getByText('Supino Máquina')).toBeInTheDocument()
    expect(screen.getByText('Atual')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Trocar/ })).toHaveLength(2)
  })

  it('"Trocar" is secondary when the variant fits better than the current one, ghost otherwise', async () => {
    const user = userEvent.setup()
    renderSheet({ currentVariantId: 'supino-maquina' })
    await user.click(screen.getByRole('tab', { name: 'Variantes (3)' }))

    expect(screen.getByRole('button', { name: 'Trocar para Supino Reto (Barra)' })).toHaveClass('hx-btn--secondary')
    expect(screen.getByRole('button', { name: 'Trocar para Supino Reto (Halteres)' })).toHaveClass('hx-btn--secondary')
  })

  it('"Trocar" applies the variant and closes the sheet', async () => {
    const user = userEvent.setup()
    const { onApply, onClose } = renderSheet()
    await user.click(screen.getByRole('tab', { name: 'Variantes (3)' }))
    const trocar = screen.getByRole('button', { name: 'Trocar para Supino Máquina' })
    expect(trocar).toHaveClass('hx-btn--ghost')
    await user.click(trocar)

    expect(onApply).toHaveBeenCalledWith('supino-maquina')
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
    renderSheet({ currentVariantId: 'supino-reto-halteres' })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino Reto (Halteres)')
    expect(screen.getByRole('img', { name: 'fit genético 90 de 100, alto' })).toBeInTheDocument()
  })

  it('Execução tab with an alternative variant active shows its genetic reason instead of the planned cues and notes', () => {
    renderSheet({ currentVariantId: 'supino-reto-halteres' })
    expect(screen.queryByText('Escápulas retraídas e pés firmes no chão')).not.toBeInTheDocument()
    expect(screen.queryByText('Cargas altas — seu forte')).not.toBeInTheDocument()
    expect(screen.getByText('Maior amplitude e estabilização')).toBeInTheDocument()
    expect(screen.getByText('corrige assimetrias')).toBeInTheDocument()
    expect(screen.getByText('Músculos trabalhados')).toBeInTheDocument()
  })

  it('Execução tab with the recommended variant active keeps the planned cues and notes', () => {
    renderSheet({ currentVariantId: 'supino-reto-barra' })
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

describe('ExerciseSheet — só leitura (spec 026, FR-011)', () => {
  it('sem onApply, lista as variantes com "Atual" e sem "Trocar"', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ExerciseSheet open exercise={EXERCISE} onClose={onClose} />)
    expect(screen.getByRole('tab', { name: 'Execução', selected: true })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Variantes (3)' }))
    expect(screen.getByText('Supino Reto (Halteres)')).toBeInTheDocument()
    expect(screen.getByText('Atual')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Trocar/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('ExerciseSheet — catálogo (028, T049)', () => {
  const base = { sets: 3, reps: '10', weight: '' }

  it('item aprovado mostra a demonstração nova do catálogo', async () => {
    render(<ExerciseSheet open exercise={{ ...base, name: 'Pullover (Halteres)' }} onClose={vi.fn()} />)
    expect(await screen.findByLabelText('demonstração de Pullover (Halteres)')).toBeInTheDocument()
  })

  it('item sem correspondência mostra o aviso com nome e notas, sem animação', () => {
    render(<ExerciseSheet open exercise={{ ...base, name: 'Exercício inventado', notes: 'Faça devagar' }} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Demonstração indisponível para este item')
    expect(dialog.querySelector('[data-motion]')).toBeNull()
  })

  it('item sem músculos conhecidos não mostra o mapa vazio', () => {
    render(<ExerciseSheet open exercise={{ ...base, name: 'Exercício inventado' }} onClose={vi.fn()} />)
    expect(screen.queryByRole('heading', { name: 'Músculos trabalhados' })).toBeNull()
  })

  it('sem variantes, não há aba "Variantes"', () => {
    render(<ExerciseSheet open exercise={{ ...base, name: 'Pullover (Halteres)' }} onClose={vi.fn()} />)
    expect(screen.queryByRole('tab', { name: /Variantes/ })).toBeNull()
  })

  it('sem variantes, mostra o equipamento do catálogo', () => {
    render(<ExerciseSheet open exercise={{ ...base, name: 'Pullover (Halteres)' }} onClose={vi.fn()} />)
    expect(screen.getByText('Halteres')).toBeInTheDocument()
  })

  it('cardio mostra a zona prescrita e dispensa o mapa muscular', () => {
    render(
      <ExerciseSheet
        open
        exercise={{ ...base, name: 'Bike ergométrica', reps: '20 min', cardio: { modality: 'bike', minutes: 20, zone: 'Z2' } }}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/Zona Z2/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Músculos trabalhados' })).toBeNull()
  })
})

describe('ExerciseSheet — orientação do catálogo (028, T051)', () => {
  const pullover: PlannedExercise = {
    name: 'Pullover (Halteres)',
    sets: 3,
    reps: '10',
    weight: '12kg',
    notes: 'Respire fundo na descida',
    cues: ['Dica antiga do plano'],
  }

  it('mostra posição inicial e passos numerados, com o erro comum em âmbar', () => {
    render(<ExerciseSheet open exercise={pullover} onClose={vi.fn()} />)
    const items = [...document.querySelectorAll('ol.hx-steps li')].map(li => li.textContent)
    expect(items[0]).toContain('Deite de costas no banco')
    expect(items[1]).toContain('Leve o halter para trás da cabeça')
    expect(document.querySelector('ol.hx-steps li.is-warn')).toHaveTextContent('Dobrar demais os cotovelos')
    expect(screen.queryByText('Dica antiga do plano')).toBeNull()
  })

  it('mostra o contexto separado dos passos', () => {
    render(<ExerciseSheet open exercise={pullover} onClose={vi.fn()} />)
    const context = screen.getByText('Trabalha dorsal e peito no mesmo movimento; complementa as puxadas')
    expect(context.closest('ol')).toBeNull()
  })

  it('mantém as notas do plano como complemento', () => {
    render(<ExerciseSheet open exercise={pullover} onClose={vi.fn()} />)
    expect(screen.getByText('Respire fundo na descida')).toBeInTheDocument()
  })
})

describe('ExerciseSheet — ver a variante antes de trocar (028, T053, FR-010)', () => {
  async function openPreview(props: Partial<Parameters<typeof ExerciseSheet>[0]> = {}, name = 'Supino Reto (Halteres)') {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(<ExerciseSheet open exercise={EXERCISE} onApply={onApply} onClose={onClose} {...props} />)
    await user.click(screen.getByRole('tab', { name: /Variantes/ }))
    await user.click(screen.getByRole('button', { name: `Ver execução de ${name}` }))
    return { user, onApply: (props.onApply as ReturnType<typeof vi.fn>) ?? onApply, onClose }
  }

  it('toda variante tem o botão "Ver" com aria-label', async () => {
    const user = userEvent.setup()
    render(<ExerciseSheet open exercise={EXERCISE} onApply={vi.fn()} onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /Variantes/ }))
    for (const v of EXERCISE.variants!) {
      expect(screen.getByRole('button', { name: `Ver execução de ${v.name}` })).toHaveTextContent('Ver')
    }
  })

  it('abre a execução da variante na mesma folha', async () => {
    await openPreview()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino Reto (Halteres)')
    expect(screen.getByRole('button', { name: 'Voltar às variantes' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Variantes/ })).toBeNull()
  })

  it('"Voltar às variantes" volta à lista sem alterar o treino', async () => {
    const { user, onApply } = await openPreview()
    await user.click(screen.getByRole('button', { name: 'Voltar às variantes' }))
    expect(screen.getByRole('tab', { name: /Variantes/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino Reto (Barra)')
    expect(onApply).not.toHaveBeenCalled()
  })

  it('fechar a folha na pré-visualização não altera o treino', async () => {
    const { user, onApply, onClose } = await openPreview()
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalled()
    expect(onApply).not.toHaveBeenCalled()
  })

  it('"Trocar" na pré-visualização aplica a variante e fecha', async () => {
    const { user, onApply, onClose } = await openPreview()
    await user.click(screen.getByRole('button', { name: 'Trocar' }))
    expect(onApply).toHaveBeenCalledWith('supino-reto-halteres')
    expect(onClose).toHaveBeenCalled()
  })

  it('a variante atual não oferece "Trocar" na pré-visualização', async () => {
    await openPreview({}, 'Supino Reto (Barra)')
    expect(screen.queryByRole('button', { name: 'Trocar' })).toBeNull()
  })

  it('só leitura: sem "Trocar"', async () => {
    const user = userEvent.setup()
    render(<ExerciseSheet open exercise={EXERCISE} onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /Variantes/ }))
    await user.click(screen.getByRole('button', { name: 'Ver execução de Supino Reto (Halteres)' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino Reto (Halteres)')
    expect(screen.queryByRole('button', { name: 'Trocar' })).toBeNull()
  })

  it('"Equivalente" mantém a etiqueta na pré-visualização', async () => {
    const user = userEvent.setup()
    const exercise: PlannedExercise = {
      ...EXERCISE,
      variants: [EXERCISE.variants![0], { ...EXERCISE.variants![1], crossPattern: true }],
    }
    render(<ExerciseSheet open exercise={exercise} onApply={vi.fn()} onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /Variantes/ }))
    await user.click(screen.getByRole('button', { name: 'Ver execução de Supino Reto (Halteres)' }))
    expect(screen.getByText('Equivalente')).toBeInTheDocument()
  })
})

describe('ExerciseSheet — variante ativa com o próprio conteúdo (028, T055, FR-011, FR-035)', () => {
  it('variante ativa mostra título, passos, músculos, cadência e etiquetas dela', async () => {
    const { findStrengthExercise } = await import('@helux/exercises')
    const own = findStrengthExercise('supino-reto-halteres')!
    render(<ExerciseSheet open exercise={EXERCISE} currentVariantId="supino-reto-halteres" onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino Reto (Halteres)')
    const steps = document.querySelector('ol.hx-steps')!
    expect(steps).toHaveTextContent(own.cues[0])
    expect(screen.getByText(own.tempo.replace(/\s*·\s*/g, '·'))).toBeInTheDocument()
    expect(screen.getByText('Halteres')).toBeInTheDocument()
    expect(screen.getByText('Intermediário')).toBeInTheDocument()
  })

  it('variante ativa fora da lista aparece nas variantes com "Atual"', async () => {
    const user = userEvent.setup()
    render(<ExerciseSheet open exercise={EXERCISE} currentVariantId="pullover-halteres" onApply={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Pullover (Halteres)')
    await user.click(screen.getByRole('tab', { name: /Variantes/ }))
    const panel = screen.getByRole('tabpanel', { name: 'Variantes' })
    expect(panel).toHaveTextContent('Pullover (Halteres)')
    expect(screen.getByText('Atual')).toBeInTheDocument()
  })
})
