import { describe, it, expect } from 'vitest'
import { findStrengthExercise } from '@helux/exercises'
import type { GeneticProfile, MesocycleSession, PlannedExercise, Variant } from '@helux/types'
import path from 'node:path'
import { parseRefreshArgs, refreshPlanSessions, summarizeRefresh } from '../services/plan-variants-refresh.service'

// T073 (028 R8, FR-035, SC-008): recalcula variants e match só nas sessões não concluídas.

const stale = (id: string, name: string, rec = false): Variant => ({
  id, name, equip: 'X', level: 'X', match: 70, motion: 'x', implement: 'x', why: 'antigo', ...(rec ? { rec: true } : {}),
})

/** Rosca Direta com a lista antiga, que trazia isolamentos de outras funções musculares. */
const curl = (): PlannedExercise => ({
  name: 'Rosca Direta (Barra)',
  sets: 3,
  reps: '10',
  weight: '20 kg',
  notes: 'cotovelos colados',
  cues: ['dica personalizada'],
  match: 70,
  variants: [
    stale('rosca-direta-barra', 'Rosca Direta (Barra)', true),
    stale('cadeira-extensora', 'Cadeira Extensora'),
    stale('crucifixo-halteres', 'Crucifixo (Halteres)'),
  ],
})

const warmup: PlannedExercise = { name: 'Bike leve', sets: 1, reps: '5 min', weight: '', phase: 'aquecimento' }

const sessions = (): MesocycleSession[] => [
  { letter: 'A', focus: 'Braços', completedAt: '2026-10-18T10:00:00Z', exercises: [curl()] },
  { letter: 'B', focus: 'Braços', completedAt: null, exercises: [warmup, curl()] },
]

const NEUTRAL: GeneticProfile = { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'baixo', predisposicao: 'misto', alertas: [] }

describe('refreshPlanSessions (R8)', () => {
  it('recalcula variants e match das sessões não concluídas pela regra nova', () => {
    const { sessions: next } = refreshPlanSessions(sessions(), NEUTRAL)
    const ex = next[1].exercises[1]
    expect(ex.variants!.some((v) => v.rec && v.name === 'Rosca Direta (Barra)')).toBe(true)
    for (const v of ex.variants!.filter((x) => !x.rec)) expect(findStrengthExercise(v.id)!.muscles.primary).toContain('biceps')
    expect(ex.variants!.map((v) => v.id)).not.toContain('cadeira-extensora')
    expect(ex.match).toBe(ex.variants!.find((v) => v.rec)!.match)
  })

  it('não toca em sessões concluídas', () => {
    const before = sessions()
    const { sessions: next } = refreshPlanSessions(before, NEUTRAL)
    expect(next[0]).toEqual(sessions()[0])
  })

  it('preserva o exercício planejado e os demais campos; só variants e match mudam', () => {
    const { sessions: next } = refreshPlanSessions(sessions(), NEUTRAL)
    const { variants: _v, match: _m, ...rest } = next[1].exercises[1]
    const { variants: _ov, match: _om, ...orig } = curl()
    expect(rest).toEqual(orig)
    expect(next[1].exercises[0]).toEqual(warmup)
    expect(next[1].completedAt).toBeNull()
  })

  it('variante ativa que saiu da lista continua resolvível no catálogo (FR-035)', () => {
    const { changes } = refreshPlanSessions(sessions(), NEUTRAL)
    const removed = changes.flatMap((c) => c.removed)
    expect(removed).toContain('cadeira-extensora')
    for (const id of removed) expect(findStrengthExercise(id), id).toBeDefined()
  })

  it('sem genética usa o perfil neutro e o resultado é determinístico', () => {
    const a = refreshPlanSessions(sessions(), null)
    const b = refreshPlanSessions(sessions(), NEUTRAL)
    expect(a.sessions).toEqual(b.sessions)
  })

  it('não altera o objeto recebido e não muda nada quando a lista já está correta', () => {
    const input = sessions()
    const snapshot = JSON.parse(JSON.stringify(input))
    const once = refreshPlanSessions(input, NEUTRAL)
    expect(input).toEqual(snapshot)
    const twice = refreshPlanSessions(once.sessions, NEUTRAL)
    expect(twice.changes).toEqual([])
    expect(twice.sessions).toEqual(once.sessions)
  })

  it('exercício fora do banco fica como está', () => {
    const odd: PlannedExercise = { name: 'Exercício Antigo Sem Catálogo', sets: 3, reps: '10', weight: '', variants: [stale('x', 'Y', true)], match: 60 }
    const { sessions: next, changes } = refreshPlanSessions([{ letter: 'A', focus: 'x', completedAt: null, exercises: [odd] }], NEUTRAL)
    expect(next[0].exercises[0]).toEqual(odd)
    expect(changes).toEqual([])
  })
})

describe('summarizeRefresh', () => {
  it('traz só contagens e nomes de exercícios, sem dado pessoal', () => {
    const plans = [
      { planId: 'plan-123', userId: 'user-abc', result: refreshPlanSessions(sessions(), NEUTRAL) },
      { planId: 'plan-456', userId: 'user-def', result: refreshPlanSessions([], NEUTRAL) },
    ]
    const summary = summarizeRefresh(plans)
    expect(summary).toMatchObject({ plansRead: 2, plansChanged: 1, exercisesChanged: 1 })
    expect(summary.byExercise['Rosca Direta (Barra)']).toMatchObject({ count: 1 })
    expect(summary.byExercise['Rosca Direta (Barra)'].removed).toContain('Cadeira Extensora')
    const text = JSON.stringify(summary)
    for (const secret of ['plan-123', 'plan-456', 'user-abc', 'user-def']) expect(text).not.toContain(secret)
  })
})

describe('parseRefreshArgs (T075)', () => {
  const root = path.resolve('/repo/helux')
  const parse = (...argv: string[]) => parseRefreshArgs(argv, root, (p) => path.resolve(root, p))

  it('simula por padrão', () => {
    expect(parse()).toEqual({ mode: 'simulate' })
    expect(parse('--backup', '/fora')).toEqual({ mode: 'simulate' })
  })

  it('--apply sem --backup é recusado', () => {
    expect(parse('--apply').mode).toBe('error')
    expect(parse('--apply', '--backup').mode).toBe('error')
  })

  it('recusa backup dentro do repositório', () => {
    expect(parse('--apply', '--backup', '.').mode).toBe('error')
    expect(parse('--apply', '--backup', 'apps/api/backup').mode).toBe('error')
    expect(parse('--apply', '--backup', path.join(root, 'x')).mode).toBe('error')
  })

  it('aceita backup fora do repositório, inclusive pasta irmã com prefixo parecido', () => {
    expect(parse('--apply', '--backup', path.resolve('/backups'))).toEqual({ mode: 'apply', backupDir: path.resolve('/backups') })
    expect(parse('--apply', '--backup', path.resolve('/repo/helux-backup')).mode).toBe('apply')
  })
})
