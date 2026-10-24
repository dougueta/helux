import { describe, it, expect } from 'vitest'
import type { MesocycleSession, PlannedExercise } from '@helux/types'
import { expandWeeks, prescribeMethod, type MethodInput } from '../method'

// Spec 024 T067/T071 — prescrição de método determinística (R5) e expansão das semanas (R7).

const base: MethodInput = {
  goal: 'hipertrofia',
  level: 'intermediario',
  timeOffMonths: 0,
  daysAvailable: 4,
  maxCardioImpact: null,
  minRir: null,
  cardioLikes: [],
  cardioAvoid: [],
}

describe('prescribeMethod', () => {
  it('semanas: 4 para iniciante ou retorno de pausa ≥ 3 meses; 5 intermediário; 6 avançado; deload na última', () => {
    expect(prescribeMethod({ ...base, level: 'iniciante' })).toMatchObject({ weeks: 4, deloadWeek: 4 })
    expect(prescribeMethod({ ...base, timeOffMonths: 8 })).toMatchObject({ weeks: 4, deloadWeek: 4 })
    expect(prescribeMethod(base)).toMatchObject({ weeks: 5, deloadWeek: 5 })
    expect(prescribeMethod({ ...base, level: 'avancado' })).toMatchObject({ weeks: 6, deloadWeek: 6 })
    const m = prescribeMethod(base)
    expect(m.weekly).toHaveLength(5)
    expect(m.weekly.at(-1)).toMatchObject({ deload: true, rirTarget: 4 })
    expect(m.weekly.slice(0, -1).every(w => !w.deload)).toBe(true)
  })

  it('hipertrofia com 4 dias: superior/inferior ×2, frequência ≥ 2 e 1 bloco de cardio', () => {
    const m = prescribeMethod(base)
    expect(m.strengthDays).toBe(4)
    expect(m.allowedSplits).toEqual(['superior-inferior'])
    expect(m.minFrequencyPerGroup).toBe(2)
    expect(m.cardioSessions).toBe(1)
    expect(m.mobilitySessions).toBe(1)
    expect(m.repRanges).toEqual({ basicos: [6, 10], acessorios: [10, 15] })
  })

  it('divisões permitidas por dias de força', () => {
    expect(prescribeMethod({ ...base, daysAvailable: 2 }).allowedSplits).toEqual(['full-body'])
    expect(prescribeMethod({ ...base, daysAvailable: 3 }).allowedSplits).toEqual(['full-body', 'superior-inferior-full'])
    expect(prescribeMethod({ ...base, daysAvailable: 5 }).allowedSplits).toEqual(['superior-inferior-ppl'])
    expect(prescribeMethod({ ...base, daysAvailable: 6 }).allowedSplits).toEqual(['ppl'])
  })

  it('emagrecimento/condicionamento trocam dias de força por cardio', () => {
    expect(prescribeMethod({ ...base, goal: 'emagrecimento', daysAvailable: 3 })).toMatchObject({ strengthDays: 2, cardioSessions: 2 })
    expect(prescribeMethod({ ...base, goal: 'condicionamento', daysAvailable: 4 })).toMatchObject({ strengthDays: 3, cardioSessions: 2 })
    expect(prescribeMethod({ ...base, goal: 'emagrecimento', daysAvailable: 5 })).toMatchObject({ strengthDays: 3, cardioSessions: 2 })
  })

  it('corrida: força em 2+ dias e o resto em cardio, até 3', () => {
    expect(prescribeMethod({ ...base, goal: 'corrida', daysAvailable: 4 })).toMatchObject({ strengthDays: 2, cardioSessions: 2 })
    expect(prescribeMethod({ ...base, goal: 'corrida', daysAvailable: 6 })).toMatchObject({ strengthDays: 3, cardioSessions: 3 })
  })

  it('séries semanais por grupo pelo nível e objetivo', () => {
    expect(prescribeMethod({ ...base, level: 'iniciante' }).weeklySetsPerGroup).toEqual({ min: 6, max: 10 })
    expect(prescribeMethod(base).weeklySetsPerGroup).toEqual({ min: 10, max: 16 })
    expect(prescribeMethod({ ...base, level: 'avancado' }).weeklySetsPerGroup).toEqual({ min: 12, max: 20 })
    expect(prescribeMethod({ ...base, goal: 'condicionamento' }).weeklySetsPerGroup).toEqual({ min: 7, max: 11 })
  })

  it('retorno de pausa começa mais leve e sobe até a semana anterior ao deload', () => {
    const m = prescribeMethod({ ...base, timeOffMonths: 8 })
    expect(m.weekly.map(w => w.setsFactor)).toEqual([0.6, 0.8, 1, 0.55])
    expect(m.modifiers).toEqual(expect.arrayContaining([expect.objectContaining({ source: 'pausa' })]))
    const normal = prescribeMethod(base)
    expect(normal.weekly[0].setsFactor).toBe(0.8)
    expect(normal.weekly.at(-2)!.setsFactor).toBe(1)
  })

  it('RIR: hipertrofia 3 → 1; condicionamento 3 → 2; iniciante nunca abaixo de 2; mínimo das condições respeitado', () => {
    expect(prescribeMethod(base).weekly.map(w => w.rirTarget)).toEqual([3, 2, 2, 1, 4])
    expect(prescribeMethod({ ...base, goal: 'condicionamento' }).weekly.slice(0, -1).every(w => w.rirTarget >= 2)).toBe(true)
    expect(prescribeMethod({ ...base, level: 'iniciante' }).weekly.slice(0, -1).every(w => w.rirTarget >= 2)).toBe(true)
    expect(prescribeMethod({ ...base, minRir: 3 }).weekly.every(w => w.rirTarget >= 3)).toBe(true)
  })

  it('cardio filtrado pelo impacto das condições e pelo que o usuário evita, preferidos primeiro', () => {
    const m = prescribeMethod({ ...base, goal: 'corrida', maxCardioImpact: 0, cardioLikes: ['eliptico'], cardioAvoid: ['natacao'] })
    expect(m.cardio.maxImpact).toBe(0)
    expect(m.cardio.allowed[0]).toBe('eliptico')
    expect(m.cardio.allowed).not.toContain('natacao')
    expect(m.cardio.allowed).not.toContain('corrida')
    expect(m.modifiers).toEqual(expect.arrayContaining([expect.objectContaining({ source: 'condicao', description: expect.stringMatching(/corrida/i) })]))
  })

  it('modificadores externos (check-in, ciclo) entram na lista', () => {
    const m = prescribeMethod({ ...base, modifiers: [{ source: 'checkin', description: '+1 cardio', cardioSessionsDelta: 1 }] })
    expect(m.cardioSessions).toBe(2)
    expect(m.modifiers).toEqual(expect.arrayContaining([{ source: 'checkin', description: '+1 cardio' }]))
  })
})

const ex = (name: string, over: Partial<PlannedExercise> = {}): PlannedExercise => ({ name, sets: 4, reps: '8-10', weight: '60kg', ...over })
const template: MesocycleSession[] = [
  { letter: 'A', focus: 'Superior', completedAt: null, kind: 'forca', exercises: [ex('Aquecimento', { phase: 'aquecimento', sets: 1 }), ex('Supino Reto (Barra)'), ex('Remada Curvada (Barra)', { supersetGroup: 'b1' })] },
  { letter: 'B', focus: 'Cardio', completedAt: null, kind: 'cardio', exercises: [ex('Bike ergométrica', { sets: 1, reps: '30 min', weight: '—', cardio: { modality: 'bike', minutes: 30, zone: 'moderada' } })] },
  { letter: 'C', focus: 'Mobilidade', completedAt: null, kind: 'mobilidade', exercises: [ex('Mobilidade de quadril', { sets: 1, reps: '10 min', weight: '—', region: 'quadril' })] },
]

describe('expandWeeks', () => {
  const m = prescribeMethod({ ...base, timeOffMonths: 8 })
  const sessions = expandWeeks(template, m)

  it('N semanas em ordem, com semana, tipo, deload e sem conclusão', () => {
    expect(sessions).toHaveLength(12)
    expect(sessions.map(s => s.week)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4])
    expect(sessions.every(s => s.completedAt === null)).toBe(true)
    expect(sessions.filter(s => s.deload).map(s => s.week)).toEqual([4, 4, 4])
    expect(sessions[1].kind).toBe('cardio')
  })

  it('aplica o fator de séries e o RIR da semana só no treino principal', () => {
    const wk = (w: number) => sessions.find(s => s.week === w && s.letter === 'A')!
    expect(wk(1).exercises[1]).toMatchObject({ sets: 2, rirTarget: m.weekly[0].rirTarget })
    expect(wk(3).exercises[1]).toMatchObject({ sets: 4, rirTarget: m.weekly[2].rirTarget })
    expect(wk(4).exercises[1]).toMatchObject({ sets: 2, rirTarget: 4 })
    expect(wk(1).exercises[0]).toMatchObject({ sets: 1, phase: 'aquecimento' })
    expect(wk(1).exercises[0].rirTarget).toBeUndefined()
    expect(wk(1).exercises[2].supersetGroup).toBe('b1')
  })

  it('cardio do deload fica mais curto; mobilidade não muda', () => {
    const cardio = (w: number) => sessions.find(s => s.week === w && s.kind === 'cardio')!.exercises[0]
    expect(cardio(1).cardio!.minutes).toBe(30)
    expect(cardio(4).cardio!.minutes).toBe(21)
    expect(cardio(4).reps).toBe('21 min')
    expect(sessions.find(s => s.week === 4 && s.kind === 'mobilidade')!.exercises[0]).toMatchObject({ sets: 1, reps: '10 min' })
  })
})

describe('parseTimeOffMonths', () => {
  it('lê meses, anos e semanas do texto livre', async () => {
    const { parseTimeOffMonths } = await import('../method')
    expect(parseTimeOffMonths('8 meses')).toBe(8)
    expect(parseTimeOffMonths('1 ano')).toBe(12)
    expect(parseTimeOffMonths('um ano e meio')).toBe(18)
    expect(parseTimeOffMonths('2 anos')).toBe(24)
    expect(parseTimeOffMonths('3 semanas')).toBe(0)
    expect(parseTimeOffMonths('6 semanas')).toBe(1)
    expect(parseTimeOffMonths('nenhum')).toBe(0)
    expect(parseTimeOffMonths(null)).toBe(0)
  })
})
