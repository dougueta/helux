import { describe, it, expect } from 'vitest'
import { SOURCE_KEYS } from '@helux/types'
import { fakeSupabase } from './helpers/fake-supabase'
import { buildIntegratedProfile } from '../services/integrated-profile.service'
import { acceptGuidance } from '../services/guidance.service'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const GENERA_FAKE = JSON.parse(readFileSync(path.resolve(__dirname, '../../e2e/fixtures/genera.fake.json'), 'utf-8'))

const NOW = new Date('2026-10-20T15:00:00Z')
const SESSION = (letter: string, completedAt: string | null) => ({
  letter,
  focus: `Foco ${letter}`,
  completedAt,
  exercises: [{ name: 'Supino Reto (Barra)', sets: 4, reps: '8', weight: '80 kg' }],
})

function db(over: Record<string, Record<string, unknown>[]> = {}) {
  return fakeSupabase({
    user_training_profile: [
      { user_id: 'u1', goal: 'hipertrofia', level: 'intermediario', training_time: '3 anos', time_off: null, current_injury: 'ombro direito', height_cm: 180, birth_date: '1991-01-10', sex: 'masculino', updated_at: '2026-09-01T10:00:00Z' },
    ],
    training_preferences: [
      {
        user_id: 'u1',
        available_days: [1, 3, 5],
        max_session_minutes: 45,
        location: 'casa',
        available_equipment: ['halteres'],
        favorite_exercises: [],
        exercises_to_avoid: ['agachamento-livre-barra'],
        priority_muscle_groups: ['gluteos'],
        training_style: 'hipertrofia-classica',
        free_instructions: 'foco em posterior',
        updated_at: '2026-10-01T10:00:00Z',
      },
    ],
    workout_sessions: [
      { user_id: 'u1', id: 's1', date: '2026-10-18', duration_s: 3600, created_at: '2026-10-18T20:00:00Z', exercises: [{ name: 'Supino Reto (Barra)', sets: [{ reps: 8, weight: 80, effort: 8 }] }] },
    ],
    mesocycle_plans: [
      { user_id: 'u1', id: 'm1', generated_at: '2026-10-10T10:00:00Z', created_at: '2026-10-10T10:00:00Z', days_per_week: 3, split_type: 'ABC', rationale: '', sessions: [SESSION('A', '2026-10-12T10:00:00Z'), SESSION('B', null), SESSION('C', null)] },
    ],
    health_samples: [],
    // Spec 024: laudo genético no banco (antes vinha do arquivo do repositório).
    genetic_reports: [{ user_id: 'u1', raw: GENERA_FAKE }],
    daily_tiredness_signals: [{ user_id: 'u1', date: '2026-10-20', level: 'cansado', override_automatic: false }],
    body_checkins: [{ user_id: 'u1', id: 'c1', month: '2026-10', weight_kg: 81, waist_cm: 86, neck_cm: 39, created_at: '2026-10-05T10:00:00Z' }],
    diet_phases: [],
    conversation_facts: [
      { user_id: 'u1', id: 'f1', category: 'sintoma', text: 'dor no ombro direito ao supinar', origin_agent: 'medicina', created_at: '2026-10-19T10:00:00Z', updated_at: '2026-10-19T10:00:00Z', deleted_at: null },
      { user_id: 'u1', id: 'f2', category: 'preferencia', text: 'fato apagado', origin_agent: 'treino', created_at: '2026-10-19T10:00:00Z', updated_at: '2026-10-19T10:00:00Z', deleted_at: '2026-10-19T12:00:00Z' },
    ],
    shared_guidance: [
      {
        user_id: 'u1',
        id: 'g1',
        kind: 'restricao-seguranca',
        text: 'Evitar empurrar acima da cabeça',
        reason: 'dor no ombro',
        origin_agent: 'medicina',
        status: 'ativa',
        starts_at: '2026-10-19T10:00:00Z',
        expires_at: '2026-11-02T10:00:00Z',
        duration_days: 14,
        blocked_patterns: ['empurrar-vertical'],
        blocked_exercises: [],
        created_at: '2026-10-19T10:00:00Z',
      },
      {
        user_id: 'u1',
        id: 'g2',
        kind: 'restricao-seguranca',
        text: 'Sem carga axial',
        reason: 'lombar',
        origin_agent: 'medicina',
        status: 'ativa',
        starts_at: '2026-10-01T10:00:00Z',
        expires_at: '2026-10-15T10:00:00Z',
        duration_days: 14,
        blocked_patterns: ['agachar'],
        blocked_exercises: [],
        created_at: '2026-10-01T10:00:00Z',
      },
    ],
    session_edits: [
      { user_id: 'u1', id: 'e1', session_index: 1, exercise_index: 0, kind: 'troca-exercicio', before: { exercise: 'Supino Reto (Barra)' }, after: { exercise: 'Supino Reto (Halteres)' }, safety_override: false, created_at: '2026-10-11T10:00:00Z' },
      { user_id: 'u1', id: 'e2', session_index: 2, exercise_index: 0, kind: 'troca-exercicio', before: { exercise: 'Supino Reto (Barra)' }, after: { exercise: 'Supino Reto (Halteres)' }, safety_override: false, created_at: '2026-10-12T10:00:00Z' },
    ],
    agent_source_settings: [],
    ...over,
  })
}

describe('buildIntegratedProfile (022 T008)', () => {
  it('monta as 12 fontes na ordem fixa; exames sempre vazia (019 ausente)', async () => {
    const { profile, sourcesUsed } = await buildIntegratedProfile('u1', db().client as never, NOW)
    expect(Object.keys(profile.sources)).toEqual([...SOURCE_KEYS])
    expect(profile.sources.exames.status).toBe('vazia')
    expect(profile.sources.nutricao.status).toBe('vazia')
    for (const k of ['perfil', 'preferencias', 'historico', 'mesociclo', 'cansaco', 'checkins', 'genetica', 'relatos', 'restricoes', 'edicoes'] as const) {
      expect(profile.sources[k].status, k).toBe('ativa')
    }
    expect(sourcesUsed.vazia).toEqual(['exames', 'nutricao'])
    expect(profile.sources.perfil.summary).toMatch(/ombro direito/)
    expect(profile.sources.cansaco.summary).toMatch(/cansado/)
    expect(profile.sources.mesociclo.summary).toMatch(/Sessão pendente: B/)
    expect(profile.sources.relatos.summary).toMatch(/dor no ombro direito/)
    expect(profile.sources.relatos.summary).not.toMatch(/fato apagado/)
    expect(profile.sources.edicoes.summary).toMatch(/Supino Reto \(Barra\)/)
  })

  it('restrições rígidas: preferências + restrições de segurança ativas; expirada sai e vira aviso', async () => {
    const fake = db()
    const { constraints, notices, profile } = await buildIntegratedProfile('u1', fake.client as never, NOW)
    expect(constraints).toEqual({
      availableEquipment: ['halteres'],
      exercisesToAvoid: ['agachamento-livre-barra'],
      maxSessionMinutes: 45,
      blockedPatterns: ['empurrar-vertical'],
      blockedExercises: [],
      maxJointStress: {},
      maxCardioImpact: null,
      minRir: null,
    })
    expect(fake.db.shared_guidance.find(g => g.id === 'g2')!.status).toBe('expirada')
    expect(notices.join(' ')).toMatch(/Sem carga axial.*expirou/)
    expect(profile.sources.restricoes.summary).not.toMatch(/Sem carga axial/)
  })

  it('fonte desativada: sem dados e sem efeito nas restrições (FR-003)', async () => {
    const fake = db({
      agent_source_settings: [
        { user_id: 'u1', source: 'preferencias', enabled: false },
        { user_id: 'u1', source: 'genetica', enabled: false },
      ],
    })
    const { profile, constraints, sourcesUsed } = await buildIntegratedProfile('u1', fake.client as never, NOW)
    expect(profile.sources.preferencias).toMatchObject({ status: 'desativada', summary: '', data: null })
    expect(profile.sources.genetica.status).toBe('desativada')
    expect(constraints.availableEquipment).toEqual([])
    expect(constraints.maxSessionMinutes).toBeNull()
    expect(constraints.blockedPatterns).toEqual(['empurrar-vertical'])
    expect(sourcesUsed.desativada).toEqual(['preferencias', 'genetica'])
  })

  it('nutrição ativa com fase de dieta: resumo com metas e flags genéticas (018)', async () => {
    const fake = db({
      diet_phases: [
        { user_id: 'u1', id: 'p1', goal: 'recomposicao', started_on: '2026-10-01', duration_weeks: 12, status: 'ativa', base_targets: { kcal: 2400, proteinG: 176, carbsG: 260, fatG: 70 }, created_at: '2026-10-01T10:00:00Z' },
      ],
      diet_phase_calibrations: [],
    })
    const { profile } = await buildIntegratedProfile('u1', fake.client as never, NOW)
    expect(profile.sources.nutricao.status).toBe('ativa')
    expect(profile.sources.nutricao.summary).toMatch(/recomposi/)
    expect(profile.sources.nutricao.summary).toMatch(/lactose/i)
    expect(profile.sources.nutricao.summary).toMatch(/Refeições de hoje:/)
    expect(profile.sources.nutricao.summary).toMatch(/Almoço:/)
  })

  it('usuário novo: perfil quase vazio sem quebrar', async () => {
    const fake = fakeSupabase({})
    const { profile, constraints } = await buildIntegratedProfile('u1', fake.client as never, NOW)
    expect(profile.sources.perfil.status).toBe('vazia')
    expect(profile.sources.historico.status).toBe('vazia')
    expect(constraints).toEqual({ availableEquipment: [], exercisesToAvoid: [], maxSessionMinutes: null, blockedPatterns: [], blockedExercises: [], maxJointStress: {}, maxCardioImpact: null, minRir: null })
  })

  it('SC-007: restrição proposta pela Medicina e aceita passa a valer para o treino', async () => {
    const fake = db({
      shared_guidance: [
        {
          user_id: 'u1',
          id: 'g9',
          kind: 'restricao-seguranca',
          text: 'Evitar supino por 10 dias',
          reason: 'dor no ombro',
          origin_agent: 'medicina',
          status: 'pendente',
          starts_at: null,
          expires_at: null,
          duration_days: 10,
          blocked_patterns: ['empurrar-horizontal'],
          blocked_exercises: ['supino-reto-barra'],
          created_at: '2026-10-20T10:00:00Z',
        },
      ],
    })
    const before = await buildIntegratedProfile('u1', fake.client as never, NOW)
    expect(before.constraints.blockedPatterns).toEqual([])

    await acceptGuidance('u1', fake.client as never, 'g9', NOW)
    const after = await buildIntegratedProfile('u1', fake.client as never, NOW)
    expect(after.constraints.blockedPatterns).toEqual(['empurrar-horizontal'])
    expect(after.constraints.blockedExercises).toEqual(['supino-reto-barra'])
    expect(after.profile.sources.restricoes.summary).toMatch(/Evitar supino por 10 dias/)
  })

  it('recomendação em conflito com restrição ativa aparece marcada; a restrição prevalece (FR-021)', async () => {
    const fake = db()
    fake.db.shared_guidance.push({
      user_id: 'u1',
      id: 'c1',
      kind: 'recomendacao',
      text: 'Treinar perna pesado nos dias de carboidrato',
      reason: 'aproveitar o glicogênio',
      origin_agent: 'nutricao',
      status: 'ativa',
      starts_at: '2026-10-19T12:00:00Z',
      expires_at: null,
      duration_days: null,
      blocked_patterns: [],
      blocked_exercises: [],
      conflicts_with: 'g1',
      created_at: '2026-10-19T12:00:00Z',
    })
    const { profile } = await buildIntegratedProfile('u1', fake.client as never, NOW)
    expect(profile.sources.restricoes.summary).toMatch(/Treinar perna pesado.*EM CONFLITO com "Evitar empurrar acima da cabeça".*restrição prevalece/)
  })
})
