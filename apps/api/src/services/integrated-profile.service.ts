import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseGeneraJson, parseGeneraTraits } from '@helux/genetics'
import { buildDayPlan, dayTargets, type NutritionFlags } from '@helux/nutrition'
import { preferenceSignalsFromEdits, sourcesUsedOf } from '@helux/ai'
import {
  SOURCE_KEYS,
  type BodyCheckin,
  type HardConstraints,
  type IntegratedProfile,
  type IntegratedSource,
  type SourceKey,
  type SourcesUsed,
  type TirednessAssessment,
  type TrainingPreferences,
  type WorkoutSession,
} from '@helux/types'
import { toFact, toGuidance, toPreferences, toSessionEdit, type FactRow, type GuidanceRow, type PreferencesRow, type SessionEditRow } from './agent-rows'
import { getActiveMesocycle, findPendingSessionIndex, type MesocycleRow } from './mesocycle.service'
import { loadNutritionContext } from './nutrition-context.service'
import { resolveDayType } from './nutrition-day.service'
import { getTodayTirednessAssessment, todaySlug } from './tiredness.service'

const GENERA_PATH = path.resolve(process.cwd(), 'data', 'genetics', 'genera.json')
const HISTORY_SESSIONS = 10
const EDIT_WINDOW_DAYS = 60
/** Orientação pendente há mais de 7 dias conta como recusada (data-model). */
const PENDING_MAX_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export interface ProfileBuild {
  profile: IntegratedProfile
  constraints: HardConstraints
  sourcesUsed: SourcesUsed
  /** Preferências cruas (mesmo com a fonte desativada) — para a tela e a geração. */
  preferences: TrainingPreferences
  mesocycle: MesocycleRow | null
  tiredness: TirednessAssessment | null
  /** Avisos do dia para os agentes (restrição expirada etc.). */
  notices: string[]
}

const empty = (): IntegratedSource => ({ status: 'vazia', updatedAt: null, summary: '', data: null })
const active = (summary: string, data: unknown, updatedAt: string | null): IntegratedSource => ({ status: 'ativa', updatedAt, summary, data })
const fmtDate = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/')

const FLAG_TEXT: Record<keyof NutritionFlags, string> = {
  intoleranciaLactose: 'intolerância à lactose (MCM6): nada com lactose',
  vitaminaDBaixa: 'predisposição a vitamina D baixa (GC)',
  b6Baixa: 'predisposição a B6 baixa (ALPL)',
  densidadeOsseaBaixa: 'predisposição a menor densidade óssea (WNT16): cálcio não lácteo',
  lowCarbEficaz: 'dieta com menos carboidrato é mais eficaz (FTO)',
  cafeinaTolerada: 'boa tolerância à cafeína (ADORA2A)',
  perfilPotencia: 'perfil de potência (ACTN3)',
}

function profileSummary(row: Record<string, unknown> | null): IntegratedSource {
  if (!row) return empty()
  const parts = [
    row.goal && `Objetivo: ${row.goal}`,
    row.level && `Nível: ${row.level}`,
    row.training_time && `Treina há: ${row.training_time}`,
    row.time_off && `Tempo parado: ${row.time_off}`,
    `Lesão atual: ${row.current_injury || 'nenhuma declarada'}`,
    row.height_cm && `Altura: ${row.height_cm} cm`,
    row.birth_date && `Nascimento: ${row.birth_date}`,
    row.sex && `Sexo: ${row.sex}`,
  ].filter(Boolean)
  return active(parts.join('\n'), row, (row.updated_at as string) ?? null)
}

function preferencesSummary(p: TrainingPreferences): IntegratedSource {
  if (!p.updatedAt) return empty()
  const DAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  const parts = [
    p.availableDays.length > 0 && `Dias disponíveis: ${p.availableDays.map(d => DAYS[d]).join(', ')}`,
    p.maxSessionMinutes && `Duração máxima por sessão (rígida): ${p.maxSessionMinutes} min`,
    p.location && `Local: ${p.location}`,
    `Equipamentos disponíveis (rígido): ${p.availableEquipment.length > 0 ? p.availableEquipment.join(', ') : 'todos'}`,
    p.exercisesToAvoid.length > 0 && `Exercícios a evitar (rígido): ${p.exercisesToAvoid.join(', ')}`,
    p.favoriteExercises.length > 0 && `Favoritos: ${p.favoriteExercises.join(', ')}`,
    p.priorityMuscleGroups.length > 0 && `Grupos prioritários: ${p.priorityMuscleGroups.join(', ')}`,
    p.trainingStyle && `Estilo: ${p.trainingStyle}`,
    p.freeInstructions && `Instruções do usuário: ${p.freeInstructions}`,
  ].filter(Boolean)
  return active(parts.join('\n'), p, p.updatedAt)
}

function historySummary(sessions: WorkoutSession[]): IntegratedSource {
  if (sessions.length === 0) return empty()
  const lines = sessions.map(s => {
    const top = s.exercises
      .filter(e => !e.skipped && e.sets.length > 0)
      .map(e => {
        const best = e.sets.reduce((a, b) => (b.weight > a.weight ? b : a))
        return `${e.name} ${e.sets.length}x${best.reps} @ ${best.weight} kg (esforço ${best.effort})`
      })
    return `${fmtDate(s.date)}: ${top.join('; ') || 'sem séries registradas'}`
  })
  return active(lines.join('\n'), sessions, sessions[0].date)
}

function mesocycleSummary(m: MesocycleRow | null): IntegratedSource {
  if (!m) return empty()
  const pending = findPendingSessionIndex(m.sessions)
  const done = m.sessions.filter(s => s.completedAt !== null).length
  const lines = [
    `Divisão: ${m.split_type || '—'} · ${m.days_per_week} dias/semana · ${done} de ${m.sessions.length} sessões concluídas`,
    pending === -1 ? 'Mesociclo concluído; o próximo será gerado.' : `Sessão pendente: ${m.sessions[pending].letter} — ${m.sessions[pending].focus}`,
    ...m.sessions.map(
      (s, i) => `${s.letter}${s.completedAt ? ' (concluída)' : ''}${i === pending ? ' (hoje)' : ''}: ${s.exercises.map(e => `${e.name} ${e.sets}x${e.reps} ${e.weight}`).join('; ')}`,
    ),
  ]
  return active(lines.join('\n'), m, m.generated_at)
}

function tirednessSummary(t: TirednessAssessment | null): IntegratedSource {
  if (!t || t.effectiveLevel === null) return empty()
  const hrv = t.automaticHrv !== null ? `; HRV ${t.automaticHrv} ms (automático: ${t.automaticLevel})` : ''
  return active(`Cansaço de hoje: ${t.effectiveLevel} (fonte: ${t.source}${hrv}). Vale só para hoje.`, t, t.date)
}

function checkinsSummary(list: BodyCheckin[]): IntegratedSource {
  if (list.length === 0) return empty()
  const lines = list.map(c =>
    [
      `${c.month}:`,
      c.weight_kg != null && `peso ${c.weight_kg} kg`,
      c.body_fat_pct != null && `gordura ${c.body_fat_pct}%`,
      c.waist_cm != null && `cintura ${c.waist_cm} cm`,
      c.squat_kg != null && `agachamento ${c.squat_kg} kg`,
      c.bench_kg != null && `supino ${c.bench_kg} kg`,
      c.deadlift_kg != null && `terra ${c.deadlift_kg} kg`,
    ]
      .filter(Boolean)
      .join(' '),
  )
  return active(lines.join('\n'), list, list[0].created_at)
}

function geneticsSummary(): IntegratedSource {
  if (!existsSync(GENERA_PATH)) return empty()
  const raw: unknown = JSON.parse(readFileSync(GENERA_PATH, 'utf-8'))
  const base = parseGeneraJson(raw)
  const traits = parseGeneraTraits(raw)
  const lines = [
    `Metabolismo ${base.metabolismo}; recuperação muscular ${base.recuperacaoMuscular}; predisposição ${base.predisposicao}; risco cardiovascular ${base.riscoCardiovascular}.`,
    ...base.alertas.map(a => `Alerta: ${a}`),
    ...traits.map(t => `${t.gene}${t.genotype ? ` ${t.genotype}` : ''} — ${t.label}: ${t.note}${t.warn ? ' (atenção)' : ''}`),
  ]
  return active(lines.join('\n'), { ...base, traits }, null)
}

/** Monta o Perfil Integrado (FR-001, R6) e as restrições rígidas (R7). */
export async function buildIntegratedProfile(userId: string, supabase: SupabaseClient, now: Date = new Date()): Promise<ProfileBuild> {
  const nowIso = now.toISOString()
  const [settingsRes, profileRes, prefsRes, historyRes, checkinsRes, factsRes, guidanceRes, editsRes, mesocycle, tiredness, nutrition] = await Promise.all([
    supabase.from('agent_source_settings').select('source, enabled').eq('user_id', userId),
    supabase.from('user_training_profile').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('training_preferences').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('workout_sessions').select('id, date, duration_s, exercises, created_at').eq('user_id', userId).order('date', { ascending: false }).limit(HISTORY_SESSIONS),
    supabase.from('body_checkins').select('*').eq('user_id', userId).order('month', { ascending: false }).limit(2),
    supabase.from('conversation_facts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('shared_guidance').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('session_edits').select('*').eq('user_id', userId).gte('created_at', new Date(now.getTime() - EDIT_WINDOW_DAYS * DAY_MS).toISOString()),
    getActiveMesocycle(userId, supabase).catch(() => null),
    getTodayTirednessAssessment(userId, supabase, now).catch(() => null),
    loadNutritionContext(userId, supabase, now).catch(() => null),
  ])

  const disabled = new Set(((settingsRes.data ?? []) as { source: SourceKey; enabled: boolean }[]).filter(s => !s.enabled).map(s => s.source))
  const preferences = toPreferences(prefsRes.data as PreferencesRow | null)
  const notices: string[] = []

  // Orientações: expiração e pendências antigas resolvidas na leitura (R9).
  const guidance = ((guidanceRes.data ?? []) as GuidanceRow[]).map(toGuidance)
  for (const g of guidance) {
    if (g.status === 'ativa' && g.expiresAt && g.expiresAt < nowIso) {
      g.status = 'expirada'
      await supabase.from('shared_guidance').update({ status: 'expirada', updated_at: nowIso }).eq('id', g.id)
      notices.push(`A orientação "${g.text}" expirou em ${fmtDate(g.expiresAt)}; avise o usuário.`)
    } else if (g.status === 'pendente' && now.getTime() - Date.parse(g.createdAt) > PENDING_MAX_DAYS * DAY_MS) {
      g.status = 'recusada'
      await supabase.from('shared_guidance').update({ status: 'recusada', updated_at: nowIso }).eq('id', g.id)
    }
  }
  const activeGuidance = guidance.filter(g => g.status === 'ativa')
  const safety = activeGuidance.filter(g => g.kind === 'restricao-seguranca')

  const facts = ((factsRes.data ?? []) as FactRow[]).filter(f => !f.deleted_at).map(toFact)
  const edits = ((editsRes.data ?? []) as SessionEditRow[]).map(toSessionEdit)
  const signals = preferenceSignalsFromEdits(edits, now)

  let nutritionSource = empty()
  if (nutrition?.phase) {
    const weight = nutrition.checkins[0]?.weight_kg
    const dayType = resolveDayType(nutrition, null)
    const targets = weight != null ? dayTargets(nutrition.phase.baseTargets, { dayType, weightKg: Number(weight), flags: nutrition.genetics.flags, tiredness: nutrition.tiredness }).targets : null
    // Refeições do dia pela regra determinística da 018 (sem as trocas do usuário).
    const meals =
      weight != null
        ? buildDayPlan({
            date: todaySlug(now),
            dayType,
            base: nutrition.phase.baseTargets,
            weightKg: Number(weight),
            flags: nutrition.genetics.flags,
            geneticsActive: nutrition.genetics.active,
            tiredness: nutrition.tiredness,
            swaps: [],
          })
            .meals.map(m => `- ${m.title}: ${m.items.map(i => i.name).join(', ')}`)
            .join('\n')
        : null
    const flags = (Object.keys(FLAG_TEXT) as (keyof NutritionFlags)[]).filter(f => nutrition.genetics.flags[f]).map(f => `- ${FLAG_TEXT[f]}`)
    nutritionSource = active(
      [
        `Fase de dieta: ${nutrition.phase.goal} desde ${fmtDate(nutrition.phase.startedOn)} (${nutrition.phase.durationWeeks} semanas)`,
        `Metas-base: ${nutrition.phase.baseTargets.kcal} kcal, P ${nutrition.phase.baseTargets.proteinG} g, C ${nutrition.phase.baseTargets.carbsG} g, G ${nutrition.phase.baseTargets.fatG} g`,
        targets && `Hoje (${dayType}): ${targets.kcal} kcal, P ${targets.proteinG} g, C ${targets.carbsG} g, G ${targets.fatG} g`,
        flags.length > 0 && `Regras genéticas da dieta:\n${flags.join('\n')}`,
        meals && `Refeições de hoje:\n${meals}`,
      ]
        .filter(Boolean)
        .join('\n'),
      { phase: nutrition.phase, dayType, targets, flags: nutrition.genetics.flags },
      nutrition.phase.startedOn,
    )
  }

  const sources: Record<SourceKey, IntegratedSource> = {
    perfil: profileSummary(profileRes.data as Record<string, unknown> | null),
    preferencias: preferencesSummary(preferences),
    historico: historySummary((historyRes.data ?? []) as WorkoutSession[]),
    mesociclo: mesocycleSummary(mesocycle),
    cansaco: tirednessSummary(tiredness),
    checkins: checkinsSummary((checkinsRes.data ?? []) as BodyCheckin[]),
    genetica: geneticsSummary(),
    // Spec 019 (exames) ainda não existe: fonte declarada, sempre vazia (R6).
    exames: empty(),
    nutricao: nutritionSource,
    relatos:
      facts.length > 0
        ? active(facts.map(f => `- [${f.category}, ${f.originAgent}, ${fmtDate(f.createdAt)}] ${f.text}`).join('\n'), facts, facts[facts.length - 1].updatedAt)
        : empty(),
    restricoes:
      activeGuidance.length > 0
        ? active(
            activeGuidance
              .map(
                g =>
                  `- [${g.kind === 'restricao-seguranca' ? 'RESTRIÇÃO DE SEGURANÇA' : 'recomendação'}, de ${g.originAgent}${g.expiresAt ? `, até ${fmtDate(g.expiresAt)}` : ''}] ${g.text} — motivo: ${g.reason}` +
                  (g.blockedPatterns.length + g.blockedExercises.length > 0 ? ` (bloqueia: ${[...g.blockedPatterns, ...g.blockedExercises].join(', ')})` : ''),
              )
              .join('\n'),
            activeGuidance,
            activeGuidance[activeGuidance.length - 1].startsAt,
          )
        : empty(),
    edicoes:
      signals.length > 0
        ? active(
            signals
              .map(s => (s.kind === 'evitar-tendencia' ? `- ${s.exercise}: trocado ${s.count}× pelo usuário — tende a não ser prescrito` : `- ${s.exercise}: escolhido ${s.count}× como substituto — preferência`))
              .join('\n'),
            { edits, signals },
            edits[edits.length - 1]?.createdAt ?? null,
          )
        : empty(),
  }

  for (const key of SOURCE_KEYS) {
    if (disabled.has(key)) sources[key] = { status: 'desativada', updatedAt: sources[key].updatedAt, summary: '', data: null }
  }

  const prefsOn = !disabled.has('preferencias')
  const safetyOn = !disabled.has('restricoes')
  const constraints: HardConstraints = {
    availableEquipment: prefsOn ? preferences.availableEquipment : [],
    exercisesToAvoid: prefsOn ? preferences.exercisesToAvoid : [],
    maxSessionMinutes: prefsOn ? preferences.maxSessionMinutes : null,
    blockedPatterns: safetyOn ? [...new Set(safety.flatMap(g => g.blockedPatterns))] : [],
    blockedExercises: safetyOn ? [...new Set(safety.flatMap(g => g.blockedExercises))] : [],
  }

  const profile: IntegratedProfile = { generatedAt: nowIso, sources }
  return {
    profile,
    constraints,
    sourcesUsed: sourcesUsedOf(profile),
    preferences,
    mesocycle,
    tiredness: disabled.has('cansaco') ? null : tiredness,
    notices,
  }
}

/** Data de hoje (UTC) — mesma convenção do cansaço (011). */
export const profileToday = (now: Date = new Date()) => todaySlug(now)
