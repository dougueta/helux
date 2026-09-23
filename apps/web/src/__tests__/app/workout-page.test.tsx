import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

    expect(await screen.findByText('Treino concluído')).toBeInTheDocument()
    expect(sessionPosts()).toHaveLength(1)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(replaceMock).not.toHaveBeenCalled()
    expect(screen.getByText('4')).toBeInTheDocument() // séries concluídas
  })

  it('envia o mesmo payload de antes (exercícios, pulados, data, duração)', async () => {
    seed({ skipFirst: true })
    vi.mocked(apiFetch).mockResolvedValue({})
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Finalizar mesmo assim' }))
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
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(sessionPosts()).toHaveLength(0)
    expect(screen.queryByText('Treino concluído')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Finalizar mesmo assim' }))
    expect(await screen.findByText('Treino concluído')).toBeInTheDocument()
    expect(sessionPosts()).toHaveLength(1)
  })

  // US3 -----------------------------------------------------------------

  it('"Voltar ao início" após salvar só navega, sem nova gravação', async () => {
    seed()
    vi.mocked(apiFetch).mockResolvedValue({})
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))
    await user.click(await screen.findByRole('button', { name: 'Voltar ao início' }))

    expect(replaceMock).toHaveBeenCalledWith('/')
    await waitFor(() => expect(sessionPosts()).toHaveLength(1))
  })

  // US2 -----------------------------------------------------------------

  it('enquanto grava, mostra "Salvando treino…" e não afirma o registro', async () => {
    seed()
    const d = deferred()
    vi.mocked(apiFetch).mockReturnValue(d.promise)
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))

    expect(await screen.findByText('Salvando treino…')).toBeInTheDocument()
    expect(screen.queryByText(/registrou suas cargas/)).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    d.resolve({})
    expect(await screen.findByText('Treino concluído')).toBeInTheDocument()
  })

  it('em falha, mostra erro e preserva o treino; "Tentar novamente" grava', async () => {
    seed()
    vi.mocked(apiFetch)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({})
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await user.click(await screen.findByRole('button', { name: /Finalizar treino/ }))

    expect(await screen.findByText('Não foi possível salvar')).toBeInTheDocument()
    expect(screen.queryByText(/registrou suas cargas/)).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(replaceMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
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
    await user.click(await screen.findByRole('button', { name: 'Voltar ao treino' }))

    expect(await screen.findByRole('button', { name: /Finalizar treino/ })).toBeInTheDocument()
    expect(screen.queryByText('Não foi possível salvar')).not.toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ActiveWorkoutState
    expect(stored.exerciseStates.flat().every(s => s.done)).toBe(true)
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
