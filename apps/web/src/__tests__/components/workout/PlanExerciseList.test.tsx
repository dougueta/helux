import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import type { PlannedExercise } from '@helux/types'
import { PlanExerciseList } from '@/components/workout/PlanExerciseList'

const phased: PlannedExercise[] = [
  { name: 'Esteira leve', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
  { name: 'Supino Reto', sets: 4, reps: '8-10', weight: '60kg', phase: 'principal' },
  { name: 'Remada Curvada', sets: 4, reps: '8-10', weight: '50kg', phase: 'principal' },
  { name: 'Alongamento de peitoral', sets: 1, reps: '30s cada lado', weight: '—', phase: 'volta-calma' },
]

describe('PlanExerciseList — fases (spec 014, US1)', () => {
  it('agrupa em Aquecimento, Treino principal e Volta à calma, nessa ordem', () => {
    render(<PlanExerciseList exercises={phased} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(headings).toEqual(['Aquecimento', 'Treino principal', 'Volta à calma'])
    const warmup = screen.getByRole('list', { name: 'Aquecimento' })
    expect(within(warmup).getByText('Esteira leve')).toBeInTheDocument()
    expect(within(warmup).getByText('5 min')).toBeInTheDocument()
    const main = screen.getByRole('list', { name: 'Treino principal' })
    expect(within(main).getAllByRole('listitem')).toHaveLength(2)
    expect(within(main).getAllByText('4 × 8–10')).toHaveLength(2)
    expect(within(main).getByText('60kg')).toBeInTheDocument()
  })

  it('não mostra "—" como carga em aquecimento/volta à calma', () => {
    render(<PlanExerciseList exercises={phased} />)
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('plano antigo (só principal, sem fase) aparece sem cabeçalhos de fase', () => {
    render(
      <PlanExerciseList
        exercises={[
          { name: 'Supino Reto', sets: 4, reps: '8-10', weight: '60kg' },
          { name: 'Crucifixo', sets: 3, reps: '12', weight: '14kg' },
        ]}
      />,
    )
    expect(screen.queryAllByRole('heading')).toHaveLength(0)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})

describe('PlanExerciseList — biset (spec 014, US2, FR-012)', () => {
  const withBiset: PlannedExercise[] = [
    { name: 'Supino Reto', sets: 3, reps: '10', weight: '60kg', phase: 'principal', supersetGroup: 'b1' },
    { name: 'Remada Curvada', sets: 3, reps: '10', weight: '50kg', phase: 'principal', supersetGroup: 'b1' },
    { name: 'Rosca Direta', sets: 3, reps: '12', weight: '20kg', phase: 'principal' },
  ]

  it('marca os dois exercícios do biset com o parceiro', () => {
    render(<PlanExerciseList exercises={withBiset} />)
    const [supino, remada, rosca] = screen.getAllByRole('listitem')
    expect(within(supino).getByText('Biset · com Remada Curvada')).toBeInTheDocument()
    expect(within(remada).getByText('Biset · com Supino Reto')).toBeInTheDocument()
    expect(within(rosca).queryByText(/Biset/)).not.toBeInTheDocument()
  })

  it('supersetGroup inválido (sem par consecutivo) não é marcado', () => {
    render(
      <PlanExerciseList
        exercises={[
          { name: 'Supino Reto', sets: 3, reps: '10', weight: '60kg', phase: 'principal', supersetGroup: 'b1' },
          { name: 'Rosca Direta', sets: 3, reps: '12', weight: '20kg', phase: 'principal' },
        ]}
      />,
    )
    expect(screen.queryByText(/Biset/)).not.toBeInTheDocument()
  })
})

describe('PlanExerciseList — progressão de carga (spec 014, US3, FR-019)', () => {
  const plan: PlannedExercise[] = [
    {
      name: 'Supino Reto', sets: 3, reps: '8-10', weight: '42kg', phase: 'principal',
      progression: { action: 'aumentar', previousWeightKg: 40, nextWeightKg: 42, reason: 'Topo da faixa (10 reps) em todas as séries com esforço moderado: +2 kg.' },
    },
    {
      name: 'Remada Curvada', sets: 3, reps: '8-10', weight: '82.5kg', phase: 'principal',
      progression: { action: 'reduzir', previousWeightKg: 92.5, nextWeightKg: 82.5, reason: 'Abaixo da faixa (6 reps) com esforço difícil: −10 kg.' },
    },
    {
      name: 'Rosca Direta', sets: 3, reps: '12', weight: '20kg', phase: 'principal',
      progression: { action: 'manter', previousWeightKg: 20, nextWeightKg: 20, reason: 'Dentro da faixa: mantém 20 kg até chegar ao topo.' },
    },
    { name: 'Crucifixo', sets: 3, reps: '12', weight: '14kg', phase: 'principal' },
  ]

  it('mostra a variação de carga e o motivo', () => {
    render(<PlanExerciseList exercises={plan} />)
    const [supino, remada, rosca, crucifixo] = screen.getAllByRole('listitem')
    expect(within(supino).getByText('+2 kg')).toBeInTheDocument()
    expect(within(supino).getByText(/Topo da faixa/)).toBeInTheDocument()
    expect(within(remada).getByText('−10 kg')).toBeInTheDocument()
    expect(within(rosca).getByText('mantida')).toBeInTheDocument()
    expect(within(rosca).getByText(/Dentro da faixa/)).toBeInTheDocument()
    expect(within(crucifixo).queryByText(/^[+−]\d/)).not.toBeInTheDocument()
    expect(within(crucifixo).queryByText('mantida')).not.toBeInTheDocument()
  })
})

describe('PlanExerciseList — esforço, cardio e mobilidade (spec 024, T082)', () => {
  const items: PlannedExercise[] = [
    { name: 'Supino Reto (Barra)', sets: 3, reps: '8-10', weight: '60kg', phase: 'principal', rirTarget: 2 },
    { name: 'Bike ergométrica', sets: 1, reps: '25 min', weight: '—', phase: 'principal', cardio: { modality: 'bike', minutes: 25, zone: 'moderada' } },
    { name: 'Mobilidade de quadril', sets: 1, reps: '10 min', weight: '—', phase: 'principal', region: 'quadril' },
  ]

  it('mostra o esforço-alvo em linguagem simples', () => {
    render(<PlanExerciseList exercises={items} />)
    expect(screen.getByText(/deixe 2 repetições na reserva/i)).toBeInTheDocument()
  })

  it('cardio com minutos e zona; mobilidade com a região; sem carga', () => {
    render(<PlanExerciseList exercises={items} />)
    expect(screen.getByText('Bike ergométrica')).toBeInTheDocument()
    expect(screen.getByText(/25 min · zona moderada/i)).toBeInTheDocument()
    expect(screen.getByText(/10 min · quadril/i)).toBeInTheDocument()
    expect(screen.queryAllByText('—')).toHaveLength(0)
  })
})

describe('PlanExerciseList — descanso e detalhe (spec 026, US2)', () => {
  const plan: PlannedExercise[] = [
    { name: 'Esteira leve', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
    { name: 'Supino Reto', sets: 3, reps: '10', weight: '60kg', phase: 'principal', supersetGroup: 'b1' },
    { name: 'Remada Curvada', sets: 3, reps: '10', weight: '50kg', phase: 'principal', supersetGroup: 'b1' },
    { name: 'Rosca Direta', sets: 3, reps: '12', weight: '20kg', phase: 'principal' },
  ]

  it('mostra o descanso como na sessão: biset sem descanso antes do par', () => {
    render(<PlanExerciseList exercises={plan} />)
    const main = screen.getByRole('list', { name: 'Treino principal' })
    const [supino, remada, rosca] = within(main).getAllByRole('listitem')
    expect(within(supino).getByText('sem descanso antes do par')).toBeInTheDocument()
    expect(within(remada).getByText('descanso 90s')).toBeInTheDocument()
    expect(within(rosca).getByText('descanso 90s')).toBeInTheDocument()
    const warmup = screen.getByRole('list', { name: 'Aquecimento' })
    expect(within(warmup).queryByText(/descanso/)).not.toBeInTheDocument()
  })

  it('com onSelect, cada exercício abre o detalhe com o índice no plano', () => {
    const onSelect = vi.fn()
    render(<PlanExerciseList exercises={plan} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'ver execução de Rosca Direta' }))
    expect(onSelect).toHaveBeenLastCalledWith(3)
    fireEvent.click(screen.getByRole('button', { name: 'ver execução de Esteira leve' }))
    expect(onSelect).toHaveBeenLastCalledWith(0)
  })

  it('sem onSelect, a lista não é tocável', () => {
    render(<PlanExerciseList exercises={plan} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
