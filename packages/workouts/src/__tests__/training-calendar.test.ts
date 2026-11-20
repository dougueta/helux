import { describe, it, expect } from 'vitest'
import {
  buildCalendarGridBounds,
  classifyEffort,
  formatTonnageEquivalent,
  computeWeeklyBalance,
  computePeriodCuriosities,
  buildTrainingCalendarMonth,
  type CalendarRawGymSession,
  type CalendarRawRoutineLog,
} from '../training-calendar'
import type { BodyWeight } from '@helux/types'

describe('training-calendar (spec 031)', () => {
  describe('buildCalendarGridBounds & geometria mensal (T002)', () => {
    it('calcula a primeira segunda-feira e o último domingo cobrindo novembro de 2026', () => {
      // 2026-11-01 é domingo -> semana começa em 2026-10-26 (segunda)
      // 2026-11-30 é segunda -> semana termina em 2026-12-06 (domingo)
      const bounds = buildCalendarGridBounds('2026-11')
      expect(bounds.firstMonday).toBe('2026-10-26')
      expect(bounds.previousWeekMonday).toBe('2026-10-19')
      expect(bounds.lastSunday).toBe('2026-12-06')
      expect(bounds.weekStarts).toEqual([
        '2026-10-26',
        '2026-11-02',
        '2026-11-09',
        '2026-11-16',
        '2026-11-23',
        '2026-11-30',
      ])
    })

    it('marca inCurrentMonth, isToday, isFuture e seleciona a semana/dia atual no mês corrente', () => {
      const view = buildTrainingCalendarMonth({
        month: '2026-11',
        today: '2026-11-20',
        sessions: [],
        routineLogs: [],
        weights: [],
        targetGymDays: 4,
      })

      expect(view.canGoNext).toBe(false)
      expect(view.defaultSelectedDate).toBe('2026-11-20')
      expect(view.defaultSelectedWeekStart).toBe('2026-11-16')
      expect(view.weeks).toHaveLength(6)

      // 2026-10-26 está na 1ª semana mas fora de novembro
      const firstDay = view.weeks[0]!.days[0]!
      expect(firstDay.date).toBe('2026-10-26')
      expect(firstDay.inCurrentMonth).toBe(false)

      // 2026-11-20 é hoje (sexta-feira, índice 4)
      const todayCell = view.weeks[3]!.days[4]!
      expect(todayCell.date).toBe('2026-11-20')
      expect(todayCell.isToday).toBe(true)
      expect(todayCell.isFuture).toBe(false)
      expect(todayCell.weekdayIndex).toBe(4)

      // 2026-11-21 é futuro
      const tomorrowCell = view.weeks[3]!.days[5]!
      expect(tomorrowCell.date).toBe('2026-11-21')
      expect(tomorrowCell.isFuture).toBe(true)
    })

    it('em mês passado, permite avançar (canGoNext=true) e seleciona a última semana com atividade', () => {
      const sessions: CalendarRawGymSession[] = [
        {
          id: 's1',
          date: '2026-10-08',
          duration_s: 3000,
          exercises: [{ name: 'Agachamento', sets: [{ reps: 10, weight: 80, effort: 8 }] }],
        },
      ]
      const view = buildTrainingCalendarMonth({
        month: '2026-10',
        today: '2026-11-20',
        sessions,
        routineLogs: [],
        weights: [],
        targetGymDays: 4,
      })

      expect(view.canGoNext).toBe(true)
      expect(view.defaultSelectedWeekStart).toBe('2026-10-05')
      expect(view.defaultSelectedDate).toBe('2026-10-08')
    })
  })

  describe('classifyEffort & computeWeeklyBalance (T004 - US2)', () => {
    it('classifica o esforço médio nas 4 faixas qualitativas (leve, moderado, forte, muito-forte)', () => {
      expect(classifyEffort(null)).toBeNull()
      expect(classifyEffort(6.0)).toBe('leve')
      expect(classifyEffort(6.4)).toBe('leve')
      expect(classifyEffort(6.5)).toBe('moderado')
      expect(classifyEffort(7.9)).toBe('moderado')
      expect(classifyEffort(8.0)).toBe('forte')
      expect(classifyEffort(8.9)).toBe('forte')
      expect(classifyEffort(9.0)).toBe('muito-forte')
      expect(classifyEffort(10)).toBe('muito-forte')
    })

    it('calcula saldo da semana com assiduidade, esforço (rpe + sets + rotinas), peso médio, volume e deltas vs semana anterior', () => {
      const prevSessions: CalendarRawGymSession[] = [
        {
          id: 'p1',
          date: '2026-11-09',
          duration_s: 2400, // 40 min
          exercises: [
            { name: 'Supino reto', sets: [{ reps: 10, weight: 60, effort: 7 }, { reps: 10, weight: 60, effort: 7 }] },
          ],
        },
        {
          id: 'p2',
          date: '2026-11-11',
          duration_s: 3000, // 50 min
          rpe: 7,
          exercises: [
            { name: 'Agachamento', sets: [{ reps: 10, weight: 80, effort: 8 }] },
          ],
        },
      ]
      const prevWeights: BodyWeight[] = [
        { id: 'w1', date: '2026-11-10', weight_kg: 82.2 },
        { id: 'w2', date: '2026-11-13', weight_kg: 81.8 },
      ] // avg = 82.0

      const prevBalance = computeWeeklyBalance({
        weekStart: '2026-11-09',
        sessions: prevSessions,
        routineLogs: [],
        weights: prevWeights,
        targetGymDays: 4,
      })

      expect(prevBalance.gymDays).toBe(2)
      expect(prevBalance.tonnageKg).toBe(2000) // 1200 + 800
      expect(prevBalance.avgEffort).toBe(7)
      expect(prevBalance.avgWeightKg).toBe(82)

      // Semana atual (2026-11-16 a 2026-11-22)
      const currSessions: CalendarRawGymSession[] = [
        {
          id: 'c1',
          date: '2026-11-16',
          duration_s: 3000, // 50 min
          rpe: 8,
          exercises: [
            { name: 'Supino reto', sets: [{ reps: 10, weight: 70, effort: 8 }, { reps: 10, weight: 70, effort: 8 }] },
          ],
        },
        {
          id: 'c2',
          date: '2026-11-18',
          duration_s: 3600, // 60 min
          exercises: [
            { name: 'Agachamento', sets: [{ reps: 10, weight: 100, effort: 9 }, { reps: 10, weight: 100, effort: 9 }] },
          ],
        },
        {
          id: 'c3',
          date: '2026-11-20',
          duration_s: 2700, // 45 min
          rpe: 8,
          exercises: [
            { name: 'Remada curvada', sets: [{ reps: 10, weight: 60, effort: 8 }] },
          ],
        },
      ]
      const currRoutines: CalendarRawRoutineLog[] = [
        {
          id: 'r1',
          category: 'cardio',
          performed_on: '2026-11-16', // mesmo dia de c1
          duration_minutes: 25,
          modality: 'bike',
          effort: 7,
        },
        {
          id: 'r2',
          category: 'alongamento-mobilidade',
          performed_on: '2026-11-17', // dia só com rotina
          duration_minutes: 15,
          effort: null,
        },
      ]
      const currWeights: BodyWeight[] = [
        { id: 'w3', date: '2026-11-16', weight_kg: 81.7 },
        { id: 'w4', date: '2026-11-19', weight_kg: 81.5 },
      ] // avg = 81.6

      const currBalance = computeWeeklyBalance({
        weekStart: '2026-11-16',
        sessions: currSessions,
        routineLogs: currRoutines,
        weights: currWeights,
        targetGymDays: 4,
        previousWeekBalance: prevBalance,
      })

      expect(currBalance.activeDays).toBe(4) // 16, 17, 18, 20
      expect(currBalance.gymDays).toBe(3) // 16, 18, 20
      expect(currBalance.targetGymDays).toBe(4)
      expect(currBalance.gymSessionsCount).toBe(3)
      expect(currBalance.complementaryCount).toBe(2)
      expect(currBalance.tonnageKg).toBe(4000) // 1400 + 2000 + 600
      expect(currBalance.totalSets).toBe(5)
      expect(currBalance.activeMinutes).toBe(195) // (50 + 60 + 45) + (25 + 15)
      // Esforços: c1=8, c2=9, c3=8, r1=7 -> média = 32 / 4 = 8.0
      expect(currBalance.avgEffort).toBe(8)
      expect(currBalance.effortClassification).toBe('forte')
      expect(currBalance.avgWeightKg).toBe(81.6)
      expect(currBalance.latestWeightKg).toBe(81.5)
      expect(currBalance.deltas).toEqual({
        activeDaysDelta: 2, // 4 - 2
        gymDaysDelta: 1, // 3 - 2
        tonnageKgDelta: 2000, // 4000 - 2000
        avgEffortDelta: 1, // 8.0 - 7.0
        avgWeightKgDelta: -0.4, // 81.6 - 82.0
      })
    })

    it('retorna avgEffort=null e avgWeightKg=null quando não há registros de esforço ou pesagem na semana (Edge Case)', () => {
      const sessions: CalendarRawGymSession[] = [
        {
          id: 'old-1',
          date: '2026-11-16',
          duration_s: 1800,
          exercises: [
            { name: 'Supino', sets: [{ reps: 10, weight: 50, effort: 0 }] },
          ],
        },
      ]
      const balance = computeWeeklyBalance({
        weekStart: '2026-11-16',
        sessions,
        routineLogs: [],
        weights: [],
        targetGymDays: 4,
      })
      expect(balance.avgEffort).toBeNull()
      expect(balance.effortClassification).toBeNull()
      expect(balance.avgWeightKg).toBeNull()
      expect(balance.deltas.avgEffortDelta).toBeNull()
      expect(balance.deltas.avgWeightKgDelta).toBeNull()
    })

    it('inclui os 7 dias completos quando a semana cruza a virada do mês (ex.: 26 out a 01 nov)', () => {
      const sessions: CalendarRawGymSession[] = [
        {
          id: 'oct',
          date: '2026-10-27',
          duration_s: 2400,
          exercises: [{ name: 'Supino', sets: [{ reps: 10, weight: 60, effort: 8 }] }],
        },
        {
          id: 'nov',
          date: '2026-11-01',
          duration_s: 2400,
          exercises: [{ name: 'Agachamento', sets: [{ reps: 10, weight: 80, effort: 8 }] }],
        },
      ]
      const balance = computeWeeklyBalance({
        weekStart: '2026-10-26',
        sessions,
        routineLogs: [],
        weights: [],
        targetGymDays: 4,
      })
      expect(balance.gymDays).toBe(2)
      expect(balance.tonnageKg).toBe(1400)
    })
  })

  describe('formatTonnageEquivalent & computePeriodCuriosities (T005 - US3)', () => {
    it('formata equivalência de tonelagem em carros populares, pianos ou malas de viagem conforme a escala', () => {
      expect(formatTonnageEquivalent(0)).toBeNull()
      expect(formatTonnageEquivalent(460)?.comparison).toContain('malas de viagem')
      expect(formatTonnageEquivalent(1600)?.comparison).toContain('pianos de cauda')
      expect(formatTonnageEquivalent(14400)?.comparison).toContain('carros populares')
    })

    it('gera curiosidades determinísticas para o mês e para a semana com dados reais (incluindo dia mais fiel e PR)', () => {
      const sessions: CalendarRawGymSession[] = [
        {
          id: 's1',
          date: '2026-11-03', // terça
          duration_s: 3600,
          exercises: [
            { name: 'Supino reto', sets: [{ reps: 8, weight: 90, effort: 8 }, { reps: 8, weight: 90, effort: 8 }] },
            { name: 'Remada', sets: [{ reps: 10, weight: 60, effort: 7 }] },
          ],
        },
        {
          id: 's2',
          date: '2026-11-10', // terça
          duration_s: 3600,
          exercises: [
            { name: 'Supino reto', sets: [{ reps: 8, weight: 95, effort: 9 }, { reps: 8, weight: 95, effort: 9 }] },
          ],
        },
        {
          id: 's3',
          date: '2026-11-17', // terça
          duration_s: 3600,
          exercises: [
            { name: 'Supino reto', sets: [{ reps: 6, weight: 100, effort: 9 }, { reps: 6, weight: 100, effort: 9 }] },
          ],
        },
      ]
      const routineLogs: CalendarRawRoutineLog[] = [
        {
          id: 'r1',
          category: 'cardio',
          performed_on: '2026-11-18',
          duration_minutes: 30,
          modality: 'bike',
          effort: 7,
        },
      ]

      const monthCuriosities = computePeriodCuriosities({
        scope: 'mes',
        sessions,
        routineLogs,
        targetGymDays: 3,
        priorBestWeightByExercise: { 'Supino reto': 95 },
      })

      expect(monthCuriosities.length).toBeGreaterThanOrEqual(3)
      // Equivalência de tonelagem
      expect(monthCuriosities.some(c => c.category === 'tonelagem')).toBe(true)
      // PR batido no Supino reto (100 kg > 95 kg)
      const forceCard = monthCuriosities.find(c => c.category === 'forca')
      expect(forceCard).toBeDefined()
      expect(forceCard!.highlight).toContain('100 kg')
      // Dia mais fiel: Terça-feira (3 treinos)
      const habitCard = monthCuriosities.find(c => c.id === 'habito-dia-fiel')
      expect(habitCard).toBeDefined()
      expect(habitCard!.highlight).toContain('Terça')
      // Tempo investido
      expect(monthCuriosities.some(c => c.category === 'tempo')).toBe(true)
    })

    it('não gera curiosidades com valores zerados quando o período não possui atividades (SC-004)', () => {
      const empty = computePeriodCuriosities({
        scope: 'semana',
        sessions: [],
        routineLogs: [],
        targetGymDays: 4,
      })
      expect(empty).toEqual([])
    })
  })
})
