import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { AdjustedSession, AdjustedWorkoutPlanView, PlannedExercise, TirednessAssessment } from '@helux/types'
import { assessTiredness, buildAdjustedSession } from '@helux/workouts'

vi.mock('@/services/tiredness.service', () => ({
  setTirednessToday: vi.fn(),
  getTirednessToday: vi.fn(),
}))

import { setTirednessToday } from '@/services/tiredness.service'
import { useTirednessFlow } from '@/hooks/useTirednessFlow'

const DATE = new Date().toISOString().slice(0, 10)

const PLANNED: PlannedExercise[] = [
  { name: 'Supino Reto', sets: 4, reps: '8-10', weight: '80kg' },
  { name: 'Crucifixo', sets: 3, reps: '10-12', weight: '15kg' },
]

function sessionFor(input: { manualLevel?: TirednessAssessment['manualLevel']; overrideAutomatic?: boolean; hrv?: number | null }): AdjustedSession {
  const assessment = assessTiredness({
    date: DATE,
    manualLevel: input.manualLevel ?? null,
    overrideAutomatic: input.overrideAutomatic ?? false,
    hrv: input.hrv ?? null,
  })
  return buildAdjustedSession({ letter: 'A', focus: 'Peito', exercises: PLANNED }, assessment)
}

function planWith(today: AdjustedSession): AdjustedWorkoutPlanView {
  return { mesocycleId: 'm1', generatedAt: null, today, upcoming: [], progress: null }
}

function setup(today: AdjustedSession | null, refetched?: AdjustedSession) {
  const refetch = vi.fn().mockResolvedValue(refetched ? planWith(refetched) : null)
  const onStart = vi.fn()
  const hook = renderHook(() => useTirednessFlow({ today, refetch, onStart }))
  return { ...hook, refetch, onStart }
}

describe('useTirednessFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(setTirednessToday).mockResolvedValue({} as TirednessAssessment)
  })

  describe('US1 — Home', () => {
    it('nível que muda o treino abre o resumo sem salvar', async () => {
      const { result } = setup(sessionFor({}))
      await act(() => result.current.chooseFromHome('exausto'))
      expect(result.current.open).toBe(true)
      expect(result.current.step).toBe('changes')
      expect(result.current.changes).toHaveLength(2)
      expect(result.current.changesBase).toBe('current')
      expect(setTirednessToday).not.toHaveBeenCalled()
    })

    it('confirmar o resumo salva, chama refetch e fecha', async () => {
      const { result, refetch, onStart } = setup(sessionFor({}), sessionFor({ manualLevel: 'exausto' }))
      await act(() => result.current.chooseFromHome('exausto'))
      await act(() => result.current.confirmChanges())
      expect(setTirednessToday).toHaveBeenCalledWith('exausto', false)
      expect(refetch).toHaveBeenCalledTimes(1)
      expect(onStart).not.toHaveBeenCalled()
      expect(result.current.open).toBe(false)
    })

    it('cancelar o resumo não salva', async () => {
      const { result } = setup(sessionFor({}))
      await act(() => result.current.chooseFromHome('cansado'))
      act(() => result.current.cancelChanges())
      expect(result.current.open).toBe(false)
      expect(setTirednessToday).not.toHaveBeenCalled()
    })

    it('nível sem efeito no treino salva direto, sem resumo', async () => {
      const { result, refetch } = setup(sessionFor({ manualLevel: 'otimo' }))
      await act(() => result.current.chooseFromHome('normal'))
      expect(result.current.open).toBe(false)
      expect(setTirednessToday).toHaveBeenCalledWith('normal', false)
      expect(refetch).toHaveBeenCalled()
    })

    it('escolher o mesmo nível já salvo não faz nada', async () => {
      const { result } = setup(sessionFor({ manualLevel: 'normal' }))
      await act(() => result.current.chooseFromHome('normal'))
      expect(setTirednessToday).not.toHaveBeenCalled()
      expect(result.current.open).toBe(false)
    })

    it('erro ao salvar fica exposto e o diálogo continua aberto', async () => {
      vi.mocked(setTirednessToday).mockRejectedValueOnce(new Error('falhou'))
      const { result, refetch } = setup(sessionFor({}))
      await act(() => result.current.chooseFromHome('exausto'))
      await act(() => result.current.confirmChanges())
      expect(result.current.error).toBe('falhou')
      expect(result.current.open).toBe(true)
      expect(refetch).not.toHaveBeenCalled()
    })

    it('usa os exercícios exibidos como planejados quando o plano não traz plannedExercises', async () => {
      const legacy: AdjustedSession = { letter: '', focus: '', exercises: PLANNED, adjusted: false }
      const { result } = setup(legacy)
      await act(() => result.current.chooseFromHome('cansado'))
      expect(result.current.step).toBe('changes')
    })
  })

  describe('US2 — Iniciar treino', () => {
    it('openStart abre a pergunta com o nível vigente ou normal', () => {
      const { result } = setup(sessionFor({}))
      act(() => result.current.openStart())
      expect(result.current.open).toBe(true)
      expect(result.current.mode).toBe('start')
      expect(result.current.step).toBe('question')
      expect(result.current.candidate).toBe('normal')

      const other = setup(sessionFor({ manualLevel: 'cansado' }))
      act(() => other.result.current.openStart())
      expect(other.result.current.candidate).toBe('cansado')
    })

    it('manter o nível sem ajuste inicia direto com os exercícios exibidos', async () => {
      const today = sessionFor({ manualLevel: 'normal' })
      const { result, onStart } = setup(today)
      act(() => result.current.openStart())
      await act(() => result.current.continueQuestion())
      expect(setTirednessToday).not.toHaveBeenCalled()
      expect(onStart).toHaveBeenCalledWith(today.exercises)
      expect(result.current.open).toBe(false)
    })

    it('sem nível salvo, confirmar "normal" salva o nível e inicia', async () => {
      const refetched = sessionFor({ manualLevel: 'normal' })
      const { result, onStart } = setup(sessionFor({}), refetched)
      act(() => result.current.openStart())
      await act(() => result.current.continueQuestion())
      expect(setTirednessToday).toHaveBeenCalledWith('normal', false)
      expect(onStart).toHaveBeenCalledWith(refetched.exercises)
    })

    it('nível que muda → resumo → confirmar salva, refetch e inicia com o treino novo', async () => {
      const refetched = sessionFor({ manualLevel: 'exausto' })
      const { result, onStart, refetch } = setup(sessionFor({}), refetched)
      act(() => result.current.openStart())
      act(() => result.current.selectCandidate('exausto'))
      await act(() => result.current.continueQuestion())
      expect(result.current.step).toBe('changes')
      expect(onStart).not.toHaveBeenCalled()
      await act(() => result.current.confirmChanges())
      expect(setTirednessToday).toHaveBeenCalledWith('exausto', false)
      expect(refetch).toHaveBeenCalled()
      expect(onStart).toHaveBeenCalledWith(refetched.exercises)
      expect(result.current.open).toBe(false)
    })

    it('cancelar o resumo volta à pergunta', async () => {
      const { result, onStart } = setup(sessionFor({}))
      act(() => result.current.openStart())
      act(() => result.current.selectCandidate('cansado'))
      await act(() => result.current.continueQuestion())
      act(() => result.current.cancelChanges())
      expect(result.current.open).toBe(true)
      expect(result.current.step).toBe('question')
      expect(onStart).not.toHaveBeenCalled()
    })

    it('fechar a pergunta não inicia nem salva', () => {
      const { result, onStart } = setup(sessionFor({}))
      act(() => result.current.openStart())
      act(() => result.current.close())
      expect(result.current.open).toBe(false)
      expect(onStart).not.toHaveBeenCalled()
      expect(setTirednessToday).not.toHaveBeenCalled()
    })
  })

  describe('US3 — discordância com o relógio', () => {
    it('nível discordante na Home abre a confirmação; recusar fecha sem salvar', async () => {
      const { result } = setup(sessionFor({ hrv: 45 }))
      await act(() => result.current.chooseFromHome('otimo'))
      expect(result.current.step).toBe('conflict')
      expect(result.current.assessment.automaticLevel).toBe('cansado')
      act(() => result.current.declineConflict())
      expect(result.current.open).toBe(false)
      expect(setTirednessToday).not.toHaveBeenCalled()
    })

    it('aceitar segue para o resumo e salva com override', async () => {
      const { result } = setup(sessionFor({ hrv: 45 }), sessionFor({ hrv: 45, manualLevel: 'otimo', overrideAutomatic: true }))
      await act(() => result.current.chooseFromHome('otimo'))
      await act(() => result.current.confirmConflict())
      expect(result.current.step).toBe('changes')
      expect(result.current.changes.map((c) => [c.setsBefore, c.setsAfter])).toEqual([[3, 4], [2, 3]])
      await act(() => result.current.confirmChanges())
      expect(setTirednessToday).toHaveBeenCalledWith('otimo', true)
    })

    it('nível concordante não pede confirmação', async () => {
      const { result } = setup(sessionFor({ hrv: 45 }))
      await act(() => result.current.chooseFromHome('cansado'))
      expect(result.current.step).not.toBe('conflict')
      expect(setTirednessToday).toHaveBeenCalledWith('cansado', false)
    })

    it('FR-019: toque duplo em "Sim, ajustar" no início grava e inicia uma única vez', async () => {
      // Discordância sem mudanças a mostrar: relógio "normal" (HRV 70) × candidato
      // "cansado", com exercícios já no mínimo de séries e carga não numérica —
      // "Sim, ajustar" grava e inicia direto, sem passar pelo resumo.
      const minimal: PlannedExercise[] = [{ name: 'Flexão', sets: 2, reps: '15', weight: 'peso corporal' }]
      const assessment = assessTiredness({ date: DATE, manualLevel: null, overrideAutomatic: false, hrv: 70 })
      const today = buildAdjustedSession({ letter: 'A', focus: 'Peito', exercises: minimal }, assessment)

      const pending: Array<(v: TirednessAssessment) => void> = []
      vi.mocked(setTirednessToday).mockImplementation(
        () => new Promise<TirednessAssessment>((r) => { pending.push(r) }),
      )
      const refetch = vi.fn().mockResolvedValue(planWith(today))
      const onStart = vi.fn()
      const { result } = renderHook(() => useTirednessFlow({ today, refetch, onStart }))

      act(() => result.current.openStart())
      act(() => result.current.selectCandidate('cansado'))
      await act(() => result.current.continueQuestion())
      expect(result.current.step).toBe('conflict')

      await act(async () => {
        const first = result.current.confirmConflict()
        const second = result.current.confirmConflict()
        pending.forEach((resolve) => resolve({} as TirednessAssessment))
        await Promise.all([first, second])
      })

      expect(setTirednessToday).toHaveBeenCalledTimes(1)
      expect(refetch).toHaveBeenCalledTimes(1)
      expect(onStart).toHaveBeenCalledTimes(1)
    })

    it('no início, recusar a discordância volta à pergunta', async () => {
      const { result } = setup(sessionFor({ hrv: 45 }))
      act(() => result.current.openStart())
      act(() => result.current.selectCandidate('otimo'))
      await act(() => result.current.continueQuestion())
      expect(result.current.step).toBe('conflict')
      act(() => result.current.declineConflict())
      expect(result.current.step).toBe('question')
      expect(result.current.open).toBe(true)
    })
  })

  describe('US4 — ajuste automático avisado antes do treino', () => {
    it('treino ajustado pelo relógio mostra o resumo vs. planejado antes de iniciar', async () => {
      const today = sessionFor({ hrv: 45 })
      const { result, onStart } = setup(today, sessionFor({ hrv: 45, manualLevel: 'cansado' }))
      act(() => result.current.openStart())
      expect(result.current.candidate).toBe('cansado')
      await act(() => result.current.continueQuestion())
      expect(result.current.step).toBe('changes')
      expect(result.current.changesBase).toBe('planned')
      expect(result.current.changes).toHaveLength(2)
      expect(onStart).not.toHaveBeenCalled()
      await act(() => result.current.confirmChanges())
      expect(onStart).toHaveBeenCalled()
    })
  })
})
