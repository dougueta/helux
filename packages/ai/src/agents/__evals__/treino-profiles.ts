import { EMPTY_HARD_CONSTRAINTS, SOURCE_KEYS, type CycleSummary, type GeneticProfile, type Goal, type HardConstraints, type HealthConditionInput, type IntegratedProfile, type SourceKey } from '@helux/types'
import type { EvalExpectations } from './treino-scoring'

// Spec 024 (R15) — perfis de teste do eval do Agente de Treino. Fictícios; o
// perfil "dono" reproduz o caso real (joelhos operados, artrose, gota) sem dados
// pessoais identificáveis.

export interface EvalProfile {
  id: string
  description: string
  /** Perfil Integrado entregue ao agente (texto, como em produção). */
  profile: IntegratedProfile
  /** Restrições entregues ao agente. */
  agentConstraints: HardConstraints
  /** Restrições que o plano precisa respeitar (inclui as regras das condições). */
  expectedConstraints: HardConstraints
  daysPerWeek: number
  geneticProfile: GeneticProfile | null
  /** Dados estruturados (onboarding da 024): usados pela prescrição de método. */
  structured: {
    goal: Goal
    level: 'iniciante' | 'intermediario' | 'avancado'
    timeOffMonths: number
    minutesPerSession: number | null
    conditions: HealthConditionInput[]
  }
  expectations: EvalExpectations
  /** Spec 024 F5: análise do ciclo anterior entregue ao agente (perfil "ciclo concluído"). */
  cycle?: CycleSummary
}

function profileOf(summaries: Partial<Record<SourceKey, string>>): IntegratedProfile {
  return {
    generatedAt: '2026-10-24T10:00:00Z',
    sources: Object.fromEntries(
      SOURCE_KEYS.map(k => [k, summaries[k] ? { status: 'ativa', updatedAt: null, summary: summaries[k]!, data: null } : { status: 'vazia', updatedAt: null, summary: '', data: null }]),
    ) as IntegratedProfile['sources'],
  }
}

const cond = (catalogKey: string, region: HealthConditionInput['region'], status: HealthConditionInput['status'], extra: Partial<HealthConditionInput> = {}): HealthConditionInput => ({
  catalogKey,
  customLabel: null,
  region,
  side: null,
  since: null,
  count: 1,
  status,
  notes: null,
  ...extra,
})

export const EVAL_PROFILES: EvalProfile[] = [
  {
    id: 'dono-joelho-gota',
    description: 'Retorno após 8 meses; 3 reconstruções de LCA, artrose no joelho esquerdo, gota; entrar em forma e voltar a correr 5 km sem dor',
    profile: profileOf({
      perfil:
        'Objetivo: entrar em forma e voltar a correr 5 km sem dor no joelho\nNível: intermediario\nTreina há: 3 anos\nTempo parado: 8 meses\nLesão atual: 3 cirurgias de LCA (2 no joelho esquerdo, 1 no direito), bem recuperadas, sem limitação; artrose no joelho esquerdo; lesão de ligamento colateral recuperada. Tenho gota (sem crise no momento).\nAltura: 178 cm\nSexo: masculino',
      preferencias: 'Dias disponíveis: seg, ter, qui, sex\nDuração máxima por sessão (rígida): 60 min\nLocal: academia\nEquipamentos disponíveis (rígido): todos',
      checkins: '2026-09: peso 84,1 kg gordura 22% cintura 94 cm\n2026-10: peso 82,6 kg gordura 21% cintura 92 cm',
      genetica: 'Metabolismo moderado; recuperação muscular media; predisposição misto; risco cardiovascular medio.\nCOL1A1 — maior suscetibilidade a lesões ligamentares (atenção) [evidência moderada]\nACTN3 — perfil misto de potência e resistência [evidência moderada]',
    }),
    // O agente recebe o limite de 60 min das preferências, como em produção (R17).
    agentConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 60 },
    expectedConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 60, maxJointStress: { joelho: 1 }, maxCardioImpact: 0 },
    daysPerWeek: 4,
    geneticProfile: { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'medio', predisposicao: 'misto', alertas: ['Maior suscetibilidade a lesões ligamentares (COL1A1)'] },
    structured: {
      goal: 'condicionamento',
      level: 'intermediario',
      timeOffMonths: 8,
      minutesPerSession: 60,
      conditions: [
        cond('lca-reconstrucao', 'joelho', 'controlada', { side: 'esquerdo', count: 2 }),
        cond('lca-reconstrucao', 'joelho', 'controlada', { side: 'direito' }),
        cond('artrose', 'joelho', 'controlada', { side: 'esquerdo' }),
        cond('gota', 'sistemica', 'controlada'),
      ],
    },
    expectations: { daysPerWeek: 4, minFrequency: 2, setsRange: { min: 6, max: 14 }, cardioPerWeek: 2, mobilityPerWeek: 1 },
  },
  {
    id: 'iniciante-hipertrofia',
    description: 'Iniciante, sem condições, hipertrofia, 3 dias',
    profile: profileOf({
      perfil: 'Objetivo: ganhar massa muscular\nNível: iniciante\nTreina há: 2 meses\nTempo parado: nenhum\nLesão atual: nenhuma declarada',
      preferencias: 'Dias disponíveis: seg, qua, sex\nDuração máxima por sessão (rígida): 60 min\nLocal: academia\nEquipamentos disponíveis (rígido): todos',
    }),
    agentConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 60 },
    expectedConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 60 },
    daysPerWeek: 3,
    geneticProfile: null,
    structured: { goal: 'hipertrofia', level: 'iniciante', timeOffMonths: 0, minutesPerSession: 60, conditions: [] },
    expectations: { daysPerWeek: 3, minFrequency: 2, setsRange: { min: 6, max: 12 }, cardioPerWeek: 1, mobilityPerWeek: 1 },
  },
  {
    id: 'pouco-tempo-emagrecimento',
    description: 'Intermediário, 3 × 40 min, emagrecimento',
    profile: profileOf({
      perfil: 'Objetivo: perder gordura\nNível: intermediario\nTreina há: 1 ano\nTempo parado: 1 mês\nLesão atual: nenhuma declarada',
      preferencias: 'Dias disponíveis: ter, qui, sáb\nDuração máxima por sessão (rígida): 40 min\nLocal: academia\nEquipamentos disponíveis (rígido): todos',
      checkins: '2026-09: peso 91 kg cintura 101 cm\n2026-10: peso 91,4 kg cintura 101 cm',
    }),
    agentConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 40 },
    expectedConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 40 },
    daysPerWeek: 3,
    geneticProfile: null,
    structured: { goal: 'emagrecimento', level: 'intermediario', timeOffMonths: 1, minutesPerSession: 40, conditions: [] },
    expectations: { daysPerWeek: 3, minFrequency: 2, setsRange: { min: 6, max: 14 }, cardioPerWeek: 2, mobilityPerWeek: 1 },
  },
  {
    id: 'casa-halteres-lombalgia',
    description: 'Casa, só halteres e peso corporal, condicionamento, lombalgia controlada',
    profile: profileOf({
      perfil: 'Objetivo: melhorar o condicionamento\nNível: intermediario\nTreina há: 2 anos\nTempo parado: nenhum\nLesão atual: lombalgia controlada, dói quando pego peso do chão',
      preferencias: 'Dias disponíveis: seg, qua, sex, sáb\nDuração máxima por sessão (rígida): 50 min\nLocal: casa\nEquipamentos disponíveis (rígido): halteres, peso-corporal',
    }),
    agentConstraints: { ...EMPTY_HARD_CONSTRAINTS, availableEquipment: ['halteres', 'peso-corporal'], maxSessionMinutes: 50 },
    expectedConstraints: { ...EMPTY_HARD_CONSTRAINTS, availableEquipment: ['halteres', 'peso-corporal'], maxSessionMinutes: 50, maxJointStress: { lombar: 1 } },
    daysPerWeek: 4,
    geneticProfile: null,
    structured: { goal: 'condicionamento', level: 'intermediario', timeOffMonths: 0, minutesPerSession: 50, conditions: [cond('lombalgia', 'lombar', 'controlada')] },
    expectations: { daysPerWeek: 4, minFrequency: 2, setsRange: { min: 8, max: 16 }, cardioPerWeek: 2, mobilityPerWeek: 1 },
  },
  {
    id: 'avancado-forca',
    description: 'Avançado, força, 5 dias',
    profile: profileOf({
      perfil: 'Objetivo: aumentar o total de agachamento, supino e terra\nNível: avancado\nTreina há: 8 anos\nTempo parado: nenhum\nLesão atual: nenhuma declarada',
      preferencias: 'Dias disponíveis: seg, ter, qua, sex, sáb\nDuração máxima por sessão (rígida): 90 min\nLocal: academia\nEquipamentos disponíveis (rígido): todos',
      historico: '20/10: Agachamento Livre (Barra) 5x5 @ 140 kg (esforço 8); Supino Reto (Barra) 5x5 @ 105 kg (esforço 8)\n17/10: Levantamento Terra (Barra) 3x5 @ 170 kg (esforço 9)',
    }),
    agentConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 90 },
    expectedConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 90 },
    daysPerWeek: 5,
    geneticProfile: null,
    structured: { goal: 'forca', level: 'avancado', timeOffMonths: 0, minutesPerSession: 90, conditions: [] },
    expectations: { daysPerWeek: 5, minFrequency: 2, setsRange: { min: 8, max: 20 }, cardioPerWeek: 1, mobilityPerWeek: 1 },
  },
  {
    id: 'ciclo-concluido',
    description: 'Fim de ciclo: agachamento estagnado, dor recorrente no leg press, cardio pouco feito (024 F5)',
    profile: profileOf({
      perfil: 'Objetivo: ganhar massa muscular\nNível: intermediario\nTreina há: 3 anos\nTempo parado: nenhum\nLesão atual: nenhuma declarada',
      preferencias: 'Dias disponíveis: seg, ter, qui, sex\nDuração máxima por sessão (rígida): 70 min\nLocal: academia\nEquipamentos disponíveis (rígido): todos',
      historico: '22/10: Agachamento Livre (Barra) 4x8 @ 101 kg (esforço 9); Leg Press 45° 3x10 @ 200 kg (esforço 7, dor no joelho)\n15/10: Agachamento Livre (Barra) 4x8 @ 100 kg (esforço 9); Supino Reto (Barra) 4x10 @ 70 kg (esforço 7)',
    }),
    agentConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 70 },
    // O exercício com dor recorrente sai do próximo ciclo (FR-025).
    expectedConstraints: { ...EMPTY_HARD_CONSTRAINTS, maxSessionMinutes: 70, blockedExercises: ['Leg Press 45°'] },
    daysPerWeek: 4,
    geneticProfile: null,
    structured: { goal: 'hipertrofia', level: 'intermediario', timeOffMonths: 0, minutesPerSession: 70, conditions: [] },
    expectations: { daysPerWeek: 4, minFrequency: 2, setsRange: { min: 8, max: 16 }, cardioPerWeek: 1, mobilityPerWeek: 1 },
    cycle: {
      mesocycleId: 'eval-ciclo-anterior',
      weeks: 5,
      adherence: { forca: { done: 15, planned: 16 }, cardio: { done: 1, planned: 5 }, mobilidade: { done: 4, planned: 5 } },
      exercises: [
        { name: 'Agachamento Livre (Barra)', firstE1rm: 126.7, lastE1rm: 127.9, avgRpe: 8.8, painReports: 0 },
        { name: 'Leg Press 45°', firstE1rm: 266.7, lastE1rm: 266.7, avgRpe: 7.2, painReports: 3 },
        { name: 'Supino Reto (Barra)', firstE1rm: 85, lastE1rm: 93.3, avgRpe: 7.4, painReports: 0 },
      ],
      avgRpeByWeek: [7.2, 7.8, 8.4, 8.9, 6.1],
      pains: [{ region: 'joelho', count: 3 }],
      tirednessAvg: 2.3,
      checkinTrend: null,
      findings: [
        { kind: 'estagnacao', subject: 'Agachamento Livre (Barra)', evidence: '1RM estimado 126.7 → 127.9 kg (+1%), esforço médio 8.8' },
        { kind: 'dor-recorrente', subject: 'Leg Press 45°', evidence: '3 relatos de dor neste exercício' },
        { kind: 'baixa-aderencia', subject: 'cardio', evidence: '1 de 5 sessões de cardio feitas' },
        { kind: 'progresso', subject: 'Supino Reto (Barra)', evidence: '1RM estimado 85 → 93.3 kg (+10%), esforço médio 7.4' },
      ],
      missingData: ['check-in corporal do mês'],
    },
  },
]
