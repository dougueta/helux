import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActiveWorkoutState } from '@/hooks/useActiveWorkout'

const replaceMock = vi.fn()
const router = { replace: replaceMock, push: vi.fn() }
vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

vi.mock('@/services/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api-client')>()
  return { ...actual, apiFetch: vi.fn() }
})

import WorkoutPage from '@/app/workout/page'
import { apiFetch } from '@/services/api-client'

const STORAGE_KEY = 'helux:active-workout'

function seed({ skipFirst = false }: { skipFirst?: boolean } = {}) {
  const state: ActiveWorkoutState = {
    planExercises: [
      { name: 'Agachamento', sets: 2, reps: '8', weight: '80kg', notes: '' },
      { name: 'Supino', sets: 2, reps: '8', weight: '60kg', notes: '' },
    ] as ActiveWorkoutState['planExercises'],
    exerciseStates: [
      [
        { weight: 80, reps: 8, done: !skipFirst },
        { weight: 80, reps: 8, done: !skipFirst },
      ],
      [
        { weight: 60, reps: 8, done: true },
        { weight: 60, reps: 8, done: true },
      ],
    ],
    currentExerciseIndex: 1,
    startedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    variantByExerciseIndex: {},
    executedVariantByExerciseIndex: skipFirst ? { 1: null } : { 0: null, 1: null },
    effortByExerciseIndex: {},
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function deferred() {
  let resolve!: (v: unknown) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<unknown>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function sessionPosts() {
  return vi.mocked(apiFetch).mock.calls.filter(
    ([path, opts]) => path === '/api/workouts/sessions' && opts?.method === 'POST'
  )
}

describe('WorkoutPage — salvar ao concluir (spec 016)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // US1 -----------------------------------------------------------------

  it('grava ao tocar "Finalizar treino" e mantém a tela de conclusão sem redirecionar', async () => {
    seed()
    vi.mocked(apiFetch).mockResolvedValue({})
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Pular e concluir' }))

    expect(await screen.findByText('Treino concluído')).toBeInTheDocument()
    expect(sessionPosts()).toHaveLength(1)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(replaceMock).not.toHaveBeenCalled()
    expect(screen.getByText('4/4')).toBeInTheDocument() // séries concluídas
  })

  it('envia o mesmo payload de antes (exercícios, pulados, data, duração)', async () => {
    seed({ skipFirst: true })
    vi.mocked(apiFetch).mockResolvedValue({})
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Finalizar mesmo assim' }))
    await user.click(await screen.findByRole('button', { name: 'Pular e concluir' }))
    await screen.findByText('Treino concluído')

    const body = JSON.parse(sessionPosts()[0][1]!.body as string)
    expect(body.exercises).toEqual([
      { name: 'Agachamento', sets: [], skipped: true },
      {
        name: 'Supino',
        sets: [
          { reps: 8, weight: 60, effort: 8 },
          { reps: 8, weight: 60, effort: 8 },
        ],
      },
    ])
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(body.duration_s).toBeGreaterThanOrEqual(30 * 60 - 5)
  })

  it('com pulados: cancelar o aviso não grava; confirmar grava', async () => {
    seed({ skipFirst: true })
    vi.mocked(apiFetch).mockResolvedValue({})
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Continuar treinando' }))
    expect(sessionPosts()).toHaveLength(0)
    expect(screen.queryByText('Treino concluído')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Finalizar mesmo assim' }))
    await user.click(await screen.findByRole('button', { name: 'Pular e concluir' }))
    expect(await screen.findByText('Treino concluído')).toBeInTheDocument()
    expect(sessionPosts()).toHaveLength(1)
  })

  // US3 -----------------------------------------------------------------

  it('"Voltar para Hoje" após salvar só navega, sem nova gravação', async () => {
    seed()
    vi.mocked(apiFetch).mockResolvedValue({})
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Pular e concluir' }))
    await user.click(await screen.findByRole('button', { name: 'Voltar para Hoje' }))

    expect(replaceMock).toHaveBeenCalledWith('/')
    await waitFor(() => expect(sessionPosts()).toHaveLength(1))
  })

  it('024: "Como foi o treino?" grava o check-in de depois e liga à sessão salva', async () => {
    seed()
    vi.mocked(apiFetch).mockImplementation(async (path: string) => (path === '/api/session-checkins' ? { checkin: { id: 'c-depois' } } : {}))
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Esforço 8' }))
    await user.click(screen.getByRole('button', { name: 'Salvar e concluir' }))
    await screen.findByText('Treino concluído')

    const checkin = vi.mocked(apiFetch).mock.calls.find(([p]) => p === '/api/session-checkins')!
    expect(JSON.parse(checkin[1]!.body as string)).toMatchObject({ phase: 'depois', rpe: 8, pains: [] })
    expect(JSON.parse(sessionPosts()[0][1]!.body as string).checkinIds).toEqual(['c-depois'])
  })

  it('PR #19: energia baixa no check-in de antes recarrega o treino do dia, já reduzido', async () => {
    const state: ActiveWorkoutState = {
      planExercises: [{ name: 'Agachamento', sets: 4, reps: '8', weight: '80kg', notes: '' }] as ActiveWorkoutState['planExercises'],
      exerciseStates: [[0, 1, 2, 3].map(() => ({ weight: 80, reps: 8, done: false }))],
      currentExerciseIndex: 0,
      startedAt: new Date().toISOString(),
      variantByExerciseIndex: {},
      executedVariantByExerciseIndex: {},
      effortByExerciseIndex: {},
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    vi.mocked(apiFetch).mockImplementation(async (path: string) => {
      if (path === '/api/session-checkins') return { checkin: { id: 'c-antes' }, tirednessChanged: true }
      if (path === '/workout/latest-plan') {
        return {
          today: {
            exercises: [{ name: 'Agachamento', sets: 2, reps: '8', weight: '80kg', notes: '' }],
            adjusted: true,
            adjustmentReason: 'Você está cansado: treino de hoje com menos séries.',
            changes: [{ name: 'Agachamento', setsBefore: 4, setsAfter: 2, weightBefore: '80kg', weightAfter: '80kg' }],
          },
        }
      }
      return {}
    })
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await screen.findByText('Antes de começar')
    await user.click(screen.getByRole('button', { name: 'Energia 1' }))
    await user.click(screen.getByRole('button', { name: 'Começar treino' }))
    expect(await screen.findByText('Treino de hoje ajustado')).toBeInTheDocument()
    expect(screen.getByText(/menos séries/)).toBeInTheDocument()
    expect(vi.mocked(apiFetch).mock.calls.some(([p]) => p === '/workout/latest-plan')).toBe(true)
  })

  it('024: treino novo abre o check-in de antes; pular segue para o treino', async () => {
    const state: ActiveWorkoutState = {
      planExercises: [{ name: 'Agachamento', sets: 2, reps: '8', weight: '80kg', notes: '' }] as ActiveWorkoutState['planExercises'],
      exerciseStates: [[{ weight: 80, reps: 8, done: false }, { weight: 80, reps: 8, done: false }]],
      currentExerciseIndex: 0,
      startedAt: new Date().toISOString(),
      variantByExerciseIndex: {},
      executedVariantByExerciseIndex: {},
      effortByExerciseIndex: {},
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    const user = userEvent.setup()
    render(<WorkoutPage />)

    expect(await screen.findByText('Antes de começar')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pular' }))
    expect(screen.queryByText('Antes de começar')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).preCheckinDone).toBe(true)
  })

  // US2 -----------------------------------------------------------------

  it('enquanto grava, mostra "Salvando treino…" e não afirma o registro', async () => {
    seed()
    const d = deferred()
    vi.mocked(apiFetch).mockReturnValue(d.promise)
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Pular e concluir' }))

    expect(await screen.findByText('Salvando treino…')).toBeInTheDocument()
    expect(screen.queryByText(/registrou suas cargas/)).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    d.resolve({})
    expect(await screen.findByText('Treino concluído')).toBeInTheDocument()
  })

  it('em falha, mostra erro e preserva o treino; "Tentar de novo" grava', async () => {
    seed()
    vi.mocked(apiFetch)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({})
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Pular e concluir' }))

    expect(await screen.findByText('Não foi possível salvar')).toBeInTheDocument()
    expect(screen.queryByText(/registrou suas cargas/)).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(replaceMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('Treino concluído')).toBeInTheDocument()
    expect(sessionPosts()).toHaveLength(2)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('em falha, "Voltar ao treino" retorna à tela ativa com as séries intactas', async () => {
    seed()
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('offline'))
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Pular e concluir' }))
    await user.click(await screen.findByRole('button', { name: 'Voltar ao treino' }))

    expect(await screen.findByRole('button', { name: /Finalizar treino/ })).toBeInTheDocument()
    expect(screen.queryByText('Não foi possível salvar')).not.toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ActiveWorkoutState
    expect(stored.exerciseStates.flat().every(s => s.done)).toBe(true)
    expect(replaceMock).not.toHaveBeenCalled()
  })
})

describe('WorkoutPage — treino ativo v2 (spec 012 T049)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('mostra a primeira série pendente em foco e as demais compactas', async () => {
    seed({ skipFirst: true })
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: 'Exercício 1, 0 de 2 séries' }))

    expect(screen.getByText('Série 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar série 2: 80 kg × 8' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'séries concluídas' })).toHaveAttribute('aria-valuenow', '2')
  })

  it('ao concluir a série, começa o descanso e o botão principal vira secundário', async () => {
    seed({ skipFirst: true })
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: 'Exercício 1, 0 de 2 séries' }))
    expect(screen.getByRole('button', { name: /Próximo exercício/ })).toHaveClass('hx-btn--primary')

    await user.click(screen.getByRole('button', { name: 'concluir série 1' }))

    expect(screen.getByRole('timer', { name: 'descanso' })).toHaveTextContent('1:30')
    expect(screen.getByRole('button', { name: /Próximo exercício/ })).toHaveClass('hx-btn--secondary')
    expect(screen.getByText('Série 2')).toBeInTheDocument()
    expect(screen.getByText('3/4 séries')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pular' }))
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('tocar numa série compacta a torna a atual', async () => {
    seed()
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: 'Editar série 2: 60 kg × 8' }))
    expect(screen.getByText('Série 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'aumentar kg' })).toBeInTheDocument()
  })
})

function seedState(partial: Partial<ActiveWorkoutState> & Pick<ActiveWorkoutState, 'planExercises' | 'exerciseStates'>) {
  const state: ActiveWorkoutState = {
    currentExerciseIndex: 0,
    startedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    variantByExerciseIndex: {},
    executedVariantByExerciseIndex: {},
    effortByExerciseIndex: {},
    ...partial,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

describe('WorkoutPage — fases (spec 014, US1)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  const phased = [
    { name: 'Esteira leve', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
    { name: 'Supino', sets: 2, reps: '8', weight: '60kg', phase: 'principal' },
    { name: 'Alongamento de peitoral', sets: 1, reps: '30s cada lado', weight: '—', phase: 'volta-calma' },
  ] as ActiveWorkoutState['planExercises']

  function seedPhased(currentExerciseIndex: number) {
    seedState({
      planExercises: phased,
      exerciseStates: [
        [{ weight: 0, reps: 5, done: false }],
        [{ weight: 60, reps: 8, done: false }, { weight: 60, reps: 8, done: false }],
        [{ weight: 0, reps: 30, done: false }],
      ],
      currentExerciseIndex,
    })
  }

  it('item de aquecimento mostra a fase e a prescrição, sem kg/reps editáveis', async () => {
    seedPhased(0)
    render(<WorkoutPage />)

    expect(await screen.findByText('Aquecimento')).toBeInTheDocument()
    expect(screen.getAllByText('5 min').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'aumentar kg' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Adicionar série/ })).not.toBeInTheDocument()
  })

  it('concluir item de aquecimento não inicia descanso', async () => {
    seedPhased(0)
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: 'concluir série 1' }))

    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'série 1 concluída, desfazer' })).toBeInTheDocument()
  })

  it('exercício do principal mostra a tag Musculação; volta à calma mostra a sua fase', async () => {
    seedPhased(1)
    const user = userEvent.setup()
    render(<WorkoutPage />)

    expect(await screen.findByText('Musculação')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Exercício 3, 0 de 1 séries' }))
    expect(screen.getByText('Volta à calma')).toBeInTheDocument()
  })

  it('finalizar sem marcar aquecimento/volta à calma não pede confirmação de pulados', async () => {
    seedState({
      planExercises: phased,
      exerciseStates: [
        [{ weight: 0, reps: 5, done: false }],
        [{ weight: 60, reps: 8, done: true }, { weight: 60, reps: 8, done: true }],
        [{ weight: 0, reps: 30, done: false }],
      ],
      currentExerciseIndex: 2,
    })
    vi.mocked(apiFetch).mockResolvedValue({})
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Pular e concluir' }))

    expect(await screen.findByText('Treino concluído')).toBeInTheDocument()
    const body = JSON.parse(sessionPosts()[0][1]!.body as string)
    expect(body.exercises.map((e: { name: string }) => e.name)).toEqual(['Supino'])
  })
})

describe('WorkoutPage — biset (spec 014, US2)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  function seedBiset() {
    seedState({
      planExercises: [
        { name: 'Supino Reto', sets: 2, reps: '10', weight: '60kg', phase: 'principal', supersetGroup: 'b1' },
        { name: 'Remada Curvada', sets: 2, reps: '10', weight: '50kg', phase: 'principal', supersetGroup: 'b1' },
        { name: 'Rosca Direta', sets: 2, reps: '10', weight: '20kg', phase: 'principal' },
      ] as ActiveWorkoutState['planExercises'],
      exerciseStates: [
        [{ weight: 60, reps: 10, done: false }, { weight: 60, reps: 10, done: false }],
        [{ weight: 50, reps: 10, done: false }, { weight: 50, reps: 10, done: false }],
        [{ weight: 20, reps: 10, done: false }, { weight: 20, reps: 10, done: false }],
      ],
    })
  }

  it('mostra que o exercício é um biset e com quem alterna', async () => {
    seedBiset()
    render(<WorkoutPage />)
    expect(await screen.findByText('Biset · alterna com Remada Curvada')).toBeInTheDocument()
  })

  it('série do 1º leva ao 2º sem descanso; série do 2º descansa e volta ao 1º', async () => {
    seedBiset()
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: 'concluir série 1' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Remada Curvada')
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'concluir série 1' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Supino Reto')
    expect(screen.getByRole('timer', { name: 'descanso' })).toHaveTextContent('1:30')
    expect(screen.getByText('Série 2')).toBeInTheDocument()
  })

  it('rótulo de descanso vem do workout-flow: 1º do biset sem descanso, 2º com 90 s', async () => {
    seedBiset()
    const user = userEvent.setup()
    render(<WorkoutPage />)

    expect(await screen.findByText(/sem descanso/)).toBeInTheDocument()
    expect(screen.queryByText('90s')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'concluir série 1' }))
    expect(screen.getByText('90s')).toBeInTheDocument()
    expect(screen.queryByText(/sem descanso/)).not.toBeInTheDocument()
  })

  it('ao navegar pelo biset, a série do outro exercício não reanima', async () => {
    seedBiset()
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: 'concluir série 1' }))
    await user.click(screen.getByRole('button', { name: 'concluir série 1' }))
    // de volta ao Supino: a série 1 dele está concluída, mas não foi a que acabou de ser marcada
    expect(screen.getByRole('button', { name: 'série 1 concluída, desfazer' })).not.toHaveClass('is-pop')
  })

  it('exercício comum fora do biset não mostra o marcador', async () => {
    seedBiset()
    const user = userEvent.setup()
    render(<WorkoutPage />)
    await user.click(await screen.findByRole('button', { name: 'Exercício 3, 0 de 2 séries' }))
    expect(screen.queryByText(/Biset ·/)).not.toBeInTheDocument()
  })
})

describe('WorkoutPage — esforço percebido (spec 014, US3, FR-014)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  const plan = [
    { name: 'Esteira leve', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
    { name: 'Supino', sets: 2, reps: '8', weight: '60kg', phase: 'principal' },
  ] as ActiveWorkoutState['planExercises']
  const states = [
    [{ weight: 0, reps: 8, done: false }],
    [{ weight: 60, reps: 8, done: false }, { weight: 60, reps: 8, done: false }],
  ]

  it('aparece no principal só depois da 1ª série concluída e registra o nível', async () => {
    seedState({ planExercises: plan, exerciseStates: states, currentExerciseIndex: 1 })
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await screen.findByRole('button', { name: 'concluir série 1' })
    expect(screen.queryByRole('group', { name: 'Esforço percebido' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'concluir série 1' }))
    const picker = screen.getByRole('group', { name: 'Esforço percebido' })
    await user.click(within(picker).getByRole('button', { name: 'Difícil' }))
    expect(within(picker).getByRole('button', { name: 'Difícil' })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).effortByExerciseIndex).toEqual({ 1: 'dificil' })
  })

  it('não aparece no aquecimento', async () => {
    seedState({ planExercises: plan, exerciseStates: [[{ weight: 0, reps: 8, done: true }], states[1]] })
    render(<WorkoutPage />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('group', { name: 'Esforço percebido' })).not.toBeInTheDocument()
  })
})
