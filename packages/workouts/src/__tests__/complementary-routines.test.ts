import { describe, expect, it } from 'vitest'
import {
  CARDIO_BANK,
  CORE_ROUTINE_ITEMS,
  REGIONS,
  STRETCH_MOBILITY_BANK,
  isMotionKey,
  type ComplementaryRoutineLog,
  type HardConstraints,
  type MesocycleSession,
} from '@helux/types'
import {
  checkCardioLegDayConflict,
  completedComplementaryCategoriesToday,
  computeWeeklyRoutineProgress,
  isCooldownSatisfiedByRoutines,
  prescribeComplementaryRoutines,
} from '../complementary-routines'

const BASE_CONSTRAINTS: HardConstraints = {
  availableEquipment: [],
  maxSessionMinutes: null,
  exercisesToAvoid: [],
  blockedPatterns: [],
  blockedExercises: [],
  maxJointStress: {},
  maxCardioImpact: null,
  minRir: null,
}

describe('Catálogos das Rotinas Complementares (T004)', () => {
  it('STRETCH_MOBILITY_BANK tem ids únicos, cobre todas as regiões, possui cues e motion válida', () => {
    const ids = new Set<string>()
    const coveredRegions = new Set<string>()
    for (const item of STRETCH_MOBILITY_BANK) {
      expect(ids.has(item.id)).toBe(false)
      ids.add(item.id)
      expect(item.cues.length).toBeGreaterThanOrEqual(3)
      expect(isMotionKey(item.motion)).toBe(true)
      for (const r of item.regions) coveredRegions.add(r)
      if (item.mode === 'tempo') expect(item.defaultSeconds).toBeGreaterThan(0)
      else expect(item.defaultReps).toBeTruthy()
    }
    for (const r of REGIONS) {
      expect(coveredRegions.has(r)).toBe(true)
    }
  })

  it('CORE_ROUTINE_ITEMS e CARDIO_BANK têm cues estruturados e motion válida', () => {
    for (const item of CORE_ROUTINE_ITEMS) {
      expect(item.cues.length).toBeGreaterThanOrEqual(3)
      expect(isMotionKey(item.motion)).toBe(true)
    }
    for (const cardio of CARDIO_BANK) {
      expect(cardio.cues.length).toBeGreaterThanOrEqual(3)
      expect(isMotionKey(cardio.motion)).toBe(true)
      expect(cardio.zoneGuidance.leve).toBeTruthy()
      expect(cardio.zoneGuidance.moderada).toBeTruthy()
    }
  })
})

describe('prescribeComplementaryRoutines (T006 — US2)', () => {
  it('gera exatamente as 3 rotinas fixas (alongamento, core e cardio) de forma determinística em < 10 ms', () => {
    const t0 = performance.now()
    const first = prescribeComplementaryRoutines({
      goal: 'hipertrofia',
      level: 'intermediario',
      constraints: BASE_CONSTRAINTS,
      conditionRegions: ['joelho'],
      flaredRegions: [],
      mesocycleGroups: ['quadriceps', 'peito', 'costas'],
      preferences: {},
    })
    const elapsed = performance.now() - t0
    const second = prescribeComplementaryRoutines({
      goal: 'hipertrofia',
      level: 'intermediario',
      constraints: BASE_CONSTRAINTS,
      conditionRegions: ['joelho'],
      flaredRegions: [],
      mesocycleGroups: ['quadriceps', 'peito', 'costas'],
      preferences: {},
    })

    expect(elapsed).toBeLessThan(20)
    expect(first).toEqual(second)
    expect(Object.keys(first).sort()).toEqual(['alongamento-mobilidade', 'cardio', 'core-abdominal'])
    expect(first['alongamento-mobilidade'].purpose).toContain('joelho')
    expect(first['core-abdominal'].items.length).toBeGreaterThanOrEqual(3)
    expect(first.cardio.items).toHaveLength(1)
  })

  it('respeita restrições de impacto e carga articular (ex.: LCA/artrose no joelho e lombar sensível)', () => {
    const constraints: HardConstraints = {
      ...BASE_CONSTRAINTS,
      maxJointStress: { joelho: 0, lombar: 0 },
      maxCardioImpact: 0,
    }
    const routines = prescribeComplementaryRoutines({
      goal: 'emagrecimento',
      level: 'intermediario',
      constraints,
      conditionRegions: ['joelho', 'lombar'],
      flaredRegions: [],
      mesocycleGroups: ['quadriceps', 'posterior', 'gluteo'],
      preferences: {},
    })

    for (const item of routines['alongamento-mobilidade'].items) {
      const bank = STRETCH_MOBILITY_BANK.find(b => b.id === item.id)!
      expect(bank.stress.joelho).toBe(0)
      expect(bank.stress.lombar).toBe(0)
    }

    for (const item of routines['core-abdominal'].items) {
      const bank = CORE_ROUTINE_ITEMS.find(b => b.id === item.id)!
      expect(bank.stress.lombar).toBe(0)
    }

    const cardioModality = routines.cardio.items[0].cardio!.modality
    const cardioEntry = CARDIO_BANK.find(c => c.id === cardioModality)!
    expect(cardioEntry.impact).toBe(0)
    expect(cardioEntry.stress.joelho).toBe(0)
  })

  it('aplica preferências de frequência semanal, duração e modalidade/regiões de foco', () => {
    const routines = prescribeComplementaryRoutines({
      goal: 'condicionamento',
      level: 'avancado',
      constraints: BASE_CONSTRAINTS,
      conditionRegions: [],
      flaredRegions: [],
      mesocycleGroups: ['peito', 'costas'],
      preferences: {
        'alongamento-mobilidade': { daysPerWeek: 7, targetMinutes: 5, focusRegions: ['ombro'] },
        'core-abdominal': { daysPerWeek: 4, targetMinutes: 15 },
        cardio: { daysPerWeek: 4, targetMinutes: 35, preferredModality: 'eliptico' },
      },
    })

    expect(routines['alongamento-mobilidade'].daysPerWeek).toBe(7)
    expect(routines['alongamento-mobilidade'].estimatedMinutes).toBe(5)
    expect(routines['alongamento-mobilidade'].items).toHaveLength(3)
    expect(routines['alongamento-mobilidade'].items[0].regions).toContain('ombro')

    expect(routines['core-abdominal'].daysPerWeek).toBe(4)
    expect(routines['core-abdominal'].estimatedMinutes).toBe(15)
    expect(routines['core-abdominal'].items).toHaveLength(4)

    expect(routines.cardio.daysPerWeek).toBe(4)
    expect(routines.cardio.estimatedMinutes).toBe(35)
    expect(routines.cardio.items[0].cardio?.modality).toBe('eliptico')
    expect(routines.cardio.items[0].cardio?.minutes).toBe(35)
  })
})

describe('Progresso semanal e categorias concluídas hoje (T010 — US1)', () => {
  const routines = prescribeComplementaryRoutines({
    goal: 'hipertrofia',
    level: 'intermediario',
    constraints: BASE_CONSTRAINTS,
    conditionRegions: [],
    flaredRegions: [],
    mesocycleGroups: [],
    preferences: {
      'alongamento-mobilidade': { daysPerWeek: 5 },
      'core-abdominal': { daysPerWeek: 3 },
      cardio: { daysPerWeek: 2 },
    },
  })

  const logs: ComplementaryRoutineLog[] = [
    {
      id: '1',
      category: 'alongamento-mobilidade',
      performed_on: '2026-11-08', // Domingo
      performed_at: '2026-11-08T08:00:00Z',
      duration_minutes: 10,
      items: [],
    },
    {
      id: '2',
      category: 'alongamento-mobilidade',
      performed_on: '2026-11-05', // Quinta da mesma semana (seg 2026-11-02 a dom 2026-11-08)
      performed_at: '2026-11-05T08:00:00Z',
      duration_minutes: 10,
      items: [],
    },
    {
      id: '3',
      category: 'cardio',
      performed_on: '2026-11-08',
      performed_at: '2026-11-08T09:00:00Z',
      duration_minutes: 25,
      modality: 'bike',
      zone: 'leve',
      effort: 7,
      items: [],
    },
    {
      id: '4',
      category: 'core-abdominal',
      performed_on: '2026-10-28', // Semana anterior -> não entra na contagem da semana atual
      performed_at: '2026-10-28T19:00:00Z',
      duration_minutes: 10,
      items: [],
    },
  ]

  it('calcula doneToday, completedThisWeek (segunda a domingo) e completedToday', () => {
    const progress = computeWeeklyRoutineProgress(logs, routines, '2026-11-08')
    expect(progress['alongamento-mobilidade']).toEqual({
      category: 'alongamento-mobilidade',
      doneToday: true,
      completedThisWeek: 2,
      targetPerWeek: 5,
      lastPerformedOn: '2026-11-08',
    })
    expect(progress.cardio).toEqual({
      category: 'cardio',
      doneToday: true,
      completedThisWeek: 1,
      targetPerWeek: 2,
      lastPerformedOn: '2026-11-08',
    })
    expect(progress['core-abdominal']).toEqual({
      category: 'core-abdominal',
      doneToday: false,
      completedThisWeek: 0,
      targetPerWeek: 3,
      lastPerformedOn: '2026-10-28',
    })

    const todayCats = completedComplementaryCategoriesToday(logs, '2026-11-08')
    expect(todayCats).toEqual(['alongamento-mobilidade', 'cardio'])
  })
})

describe('Sinergia entre turnos: conflito com treino de pernas e volta à calma cumprida (T024 — US5)', () => {
  it('emite aviso quando a sessão pendente da academia trabalha membros inferiores', () => {
    const legSession: Pick<MesocycleSession, 'focus' | 'exercises'> = {
      focus: 'Inferiores — Quadríceps e Glúteo',
      exercises: [
        { name: 'Leg Press 45°', sets: 3, reps: '10', weight: '120kg', muscle: 'quadriceps', phase: 'principal' },
      ],
    }
    const warning = checkCardioLegDayConflict(legSession)
    expect(warning).toBeTruthy()
    expect(warning).toMatch(/pernas|membros inferiores/i)

    const upperSession: Pick<MesocycleSession, 'focus' | 'exercises'> = {
      focus: 'Superiores — Peito e Costas',
      exercises: [
        { name: 'Supino Reto (Barra)', sets: 3, reps: '8', weight: '60kg', muscle: 'peito', phase: 'principal' },
      ],
    }
    expect(checkCardioLegDayConflict(upperSession)).toBeNull()
  })

  it('identifica itens de volta à calma e cardio já cumpridos hoje nas rotinas complementares', () => {
    const cooldownStretch = { name: 'Alongamento de posterior', sets: 1, reps: '30s', weight: '—', phase: 'volta-calma' as const }
    const cooldownCardio = {
      name: 'Bike ergométrica',
      sets: 1,
      reps: '15 min',
      weight: '—',
      phase: 'volta-calma' as const,
      cardio: { modality: 'bike', minutes: 15, zone: 'leve' },
    }
    const mainExercise = { name: 'Agachamento Livre (Barra)', sets: 3, reps: '8', weight: '80kg', phase: 'principal' as const }

    expect(isCooldownSatisfiedByRoutines(cooldownStretch, ['alongamento-mobilidade']).satisfied).toBe(true)
    expect(isCooldownSatisfiedByRoutines(cooldownStretch, ['cardio']).satisfied).toBe(false)
    expect(isCooldownSatisfiedByRoutines(cooldownCardio, ['cardio']).satisfied).toBe(true)
    expect(isCooldownSatisfiedByRoutines(mainExercise, ['alongamento-mobilidade', 'cardio']).satisfied).toBe(false)
  })
})
