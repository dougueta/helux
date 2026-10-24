/**
 * Eval de qualidade do Agente de Treino (spec 024, R15, FR-032–034).
 *
 * Usa a API real (custa dinheiro): roda só sob demanda, com ANTHROPIC_API_KEY e
 * EVAL_CONFIRM=1, via `pnpm --filter @helux/ai eval:treino`. Sem EVAL_CONFIRM,
 * só imprime a estimativa de custo.
 *
 * Para cada perfil: gera o plano com o agente vigente, aplica as checagens
 * determinísticas (`treino-scoring.ts`) e pede a um LLM-juiz as notas dos
 * critérios qualitativos. Grava `results/<data>-<sha>.local.json` e compara com
 * `results/baseline.json` quando existir.
 */
import Anthropic from '@anthropic-ai/sdk'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'vitest'
import type { HealthCondition, MesocycleSession, PlanDecision, UsageRecord } from '@helux/types'
import { CONDITION_CATALOG, constraintsFromConditions, modifiersFromFindings, prescribeMethod, rulesFor } from '@helux/workouts'
import { generateMesocyclePlan, type AgentEffort } from '../../mesocycle-planner'
import { validateAgainstMethod } from '../method-validation'
import { renderProfile } from '../render-profile'
import { usagesFromMessage } from '../client'
import { aggregate, scorePlan, type ProfileResult } from './treino-scoring'
import { EVAL_PROFILES, type EvalProfile } from './treino-profiles'

const HAS_KEY = !!process.env.ANTHROPIC_API_KEY
const CONFIRMED = process.env.EVAL_CONFIRM === '1'
const ONLY = process.env.EVAL_PROFILE
// O script roda a partir de packages/ai (pnpm --filter @helux/ai).
const RESULTS_DIR = path.resolve('src/agents/__evals__/results')
/** Estimativa por perfil (geração + juiz), em US$, para o aviso antes de rodar. */
const ESTIMATED_USD_PER_PROFILE = 0.6

const JUDGE_CRITERIA = ['objetivo', 'justificativas', 'genetica-proporcional', 'notas-honestas'] as const
/** Só no perfil com ciclo anterior (024 F5). */
const CYCLE_CRITERION = 'ciclo'
type JudgeCriterion = (typeof JUDGE_CRITERIA)[number] | typeof CYCLE_CRITERION

function judgeSchema(criteria: readonly JudgeCriterion[]) {
  return {
    type: 'object',
    properties: {
      scores: {
        type: 'object',
        // Structured outputs não aceitam minimum/maximum em inteiros: a faixa 0–5 vai no prompt e é limitada ao ler.
        properties: Object.fromEntries(criteria.map(c => [c, { type: 'integer' }])),
        required: [...criteria],
        additionalProperties: false,
      },
      comments: { type: 'string' },
    },
    required: ['scores', 'comments'],
    additionalProperties: false,
  }
}

const CYCLE_JUDGE = `- ciclo: o plano trata cada achado do ciclo anterior? Exercício estagnado com faixa ou variação diferente, exercício com dor recorrente fora do plano (com alternativa de menor carga articular), cardio em formato que caiba melhor, e as decisões com tópico "ciclo" explicam o que mudou com os números do ciclo.`

const JUDGE_SYSTEM = `Você é um treinador sênior revisando um plano de treino gerado por IA para um usuário real. Dê notas inteiras de 0 a 5:
- objetivo: o plano serve ao objetivo declarado, ao nível, ao tempo parado e às condições de saúde (método, volume, intensidade, cardio e mobilidade adequados)?
- justificativas: a justificativa e as decisões são corretas, específicas e citam dados reais do perfil, sem inventar relações?
- genetica-proporcional: a genética aparece só como ajuste fino? Dê nota baixa se alguma escolha de divisão, faixa de repetição ou exercício tiver a genética como motivo principal ou se houver ligação gene → exercício sem base.
- notas-honestas: as notas ao usuário são instruções de execução úteis e motivos voltados a ele? Dê nota baixa se citarem datas de uso anterior, "usado recentemente", regras do sistema ou raciocínio interno.
Em comments, aponte em até 5 linhas os problemas mais graves.`

function compactPlan(sessions: MesocycleSession[]): string {
  return sessions
    .map(s => {
      const head = `${s.letter}${s.week ? ` (semana ${s.week})` : ''}${s.kind ? ` [${s.kind}]` : ''} — ${s.focus}`
      const items = s.exercises.map(e => `  - ${e.phase ?? 'principal'} | ${e.name} | ${e.sets}x${e.reps} | ${e.weight}${e.rirTarget !== undefined ? ` | RIR ${e.rirTarget}` : ''}${e.notes ? ` | nota: ${e.notes}` : ''}`)
      return [head, ...items].join('\n')
    })
    .join('\n')
}

async function judge(p: EvalProfile, sessions: MesocycleSession[], rationale: string, decisions: PlanDecision[]): Promise<{ scores: Partial<Record<JudgeCriterion, number>>; comments: string; usages: UsageRecord[] }> {
  const criteria: JudgeCriterion[] = p.cycle ? [...JUDGE_CRITERIA, CYCLE_CRITERION] : [...JUDGE_CRITERIA]
  const cycleText = p.cycle ? `\n\n# Ciclo anterior\n${p.cycle.findings.map(f => `- ${f.kind}: ${f.subject} — ${f.evidence}`).join('\n')}` : ''
  const client = new Anthropic()
  const res = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: judgeSchema(criteria) } },
    system: p.cycle ? JUDGE_SYSTEM.replace('\nEm comments', `\n${CYCLE_JUDGE}\nEm comments`) : JUDGE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `# Perfil do usuário\n${renderProfile(p.profile)}${cycleText}\n\n# Plano\n${compactPlan(sessions)}\n\n# Justificativa\n${rationale}\n\n# Decisões\n${decisions.map(d => `- [${d.topic}] ${d.choice} — ${d.reason} (fontes: ${d.sources.join(', ')})`).join('\n')}`,
      },
    ],
  })
  const block = res.content.find(b => b.type === 'text')
  const parsed = JSON.parse(block && block.type === 'text' ? block.text : '{}') as { scores: Record<JudgeCriterion, number>; comments: string }
  const scores = Object.fromEntries(criteria.map(c => [c, Math.max(0, Math.min(5, parsed.scores?.[c] ?? 0))])) as Partial<Record<JudgeCriterion, number>>
  return { scores, comments: parsed.comments ?? '', usages: usagesFromMessage(res, 'mesociclo', null) }
}

interface ProfileOutcome extends ProfileResult {
  violations: string[]
  comments: string
  error?: string
}

/** Entrada do agente como a produção monta (024): condições → restrições, método pelos dados estruturados. */
function agentInput(p: EvalProfile) {
  const conditions: HealthCondition[] = p.structured.conditions.map((c, i) => ({ ...c, id: `c${i}`, flare: null }))
  const fromConditions = constraintsFromConditions(conditions)
  // Como em produção (024 F5): achados do ciclo viram modificadores e bloqueios.
  const fromCycle = p.cycle ? modifiersFromFindings(p.cycle.findings) : { modifiers: [], blockedExercises: [] }
  const constraints = { ...p.agentConstraints, ...fromConditions, blockedPatterns: [...p.agentConstraints.blockedPatterns, ...fromConditions.blockedPatterns], blockedExercises: [...p.agentConstraints.blockedExercises, ...fromConditions.blockedExercises, ...fromCycle.blockedExercises] }
  const method = prescribeMethod({
    goal: p.structured.goal,
    level: p.structured.level,
    timeOffMonths: p.structured.timeOffMonths,
    daysAvailable: p.daysPerWeek,
    maxCardioImpact: constraints.maxCardioImpact,
    minRir: constraints.minRir,
    cardioLikes: [],
    cardioAvoid: [],
    maxSessionMinutes: constraints.maxSessionMinutes,
    modifiers: fromCycle.modifiers,
  })
  const labelled = conditions.map(c => {
    const label = CONDITION_CATALOG.find(k => k.key === c.catalogKey)?.label ?? c.customLabel ?? 'Condição'
    const r = rulesFor(c)
    return { label: `${label} (${c.region}${c.side ? ` ${c.side}` : ''}${c.count > 1 ? `, ${c.count}×` : ''})`, rules: [...Object.entries(r.maxJointStress).map(([j, l]) => `carga no ${j} ≤ ${l}`), ...r.cues] }
  })
  return { constraints, method, conditions: labelled }
}

async function runProfile(p: EvalProfile): Promise<ProfileOutcome> {
  try {
    const { constraints, method, conditions } = agentInput(p)
    const effort = process.env.EVAL_EFFORT as AgentEffort | undefined
    const result = await generateMesocyclePlan({ profile: p.profile, constraints, method, conditions, geneticProfile: p.geneticProfile, ...(p.cycle ? { cycle: p.cycle } : {}), ...(effort ? { effort } : {}) })
    // A semana-modelo é uma semana: marca semana 1 para a pontuação contar sem escalar.
    const sessions = result.plan.sessions.map(s => ({ ...s, week: 1 }))
    const det = scorePlan({ sessions, constraints: p.expectedConstraints, expectations: { ...p.expectations, setsRange: method.weeklySetsPerGroup, cardioPerWeek: method.cardioSessions }, extraViolations: validateAgainstMethod(result.plan.sessions, method) })
    // O plano fica salvo mesmo se o juiz falhar, para não perder a geração (que é a parte cara).
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
    fs.writeFileSync(path.join(RESULTS_DIR, `plan-${p.id}.local.json`), JSON.stringify({ sessions, rationale: result.plan.rationale, decisions: result.decisions }, null, 2))
    const j = await judge(p, sessions, result.plan.rationale, result.decisions).catch(err => ({ scores: { objetivo: 0, justificativas: 0, 'genetica-proporcional': 0, 'notas-honestas': 0, ...(p.cycle ? { ciclo: 0 } : {}) } as Partial<Record<JudgeCriterion, number>>, comments: `juiz falhou: ${(err as Error).message}`, usages: [] as UsageRecord[] }))
    return {
      profile: p.id,
      scores: {
        ...det.scores,
        objetivo: j.scores.objetivo ?? 0,
        justificativas: j.scores.justificativas ?? 0,
        'genetica-proporcional': j.scores['genetica-proporcional'] ?? 0,
        'notas-honestas': Math.min(det.scores['notas-honestas'], j.scores['notas-honestas'] ?? 0),
        ...(p.cycle ? { ciclo: j.scores.ciclo ?? 0 } : {}),
      },
      usages: [...result.usages, ...j.usages],
      violations: det.violations.map(v => `${v.exercise ?? '—'}: ${v.rule}`),
      comments: j.comments,
    }
  } catch (err) {
    const usages = (err as { usages?: UsageRecord[] }).usages ?? []
    // Restrições impossíveis: as violações da última tentativa explicam a falha.
    const violations = ((err as { violations?: { exercise?: string | null; rule: string; message: string }[] }).violations ?? []).map(v => `${v.exercise ?? '—'}: ${v.rule} — ${v.message}`)
    return { profile: p.id, scores: { seguranca: 0, 'frequencia-volume': 0, 'cardio-mobilidade': 0, 'notas-honestas': 0, objetivo: 0, justificativas: 0, 'genetica-proporcional': 0 }, usages, violations, comments: '', error: (err as Error).message }
  }
}

function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'sem-git'
  }
}

describe.skipIf(!HAS_KEY)('eval: Agente de Treino (024)', () => {
  const profiles = EVAL_PROFILES.filter(p => !ONLY || p.id === ONLY)

  it.skipIf(CONFIRMED)('estimativa de custo (defina EVAL_CONFIRM=1 para rodar)', () => {
    console.log(`[eval:treino] ${profiles.length} perfis, custo estimado ~US$ ${(profiles.length * ESTIMATED_USD_PER_PROFILE).toFixed(2)}. Rode com EVAL_CONFIRM=1.`)
  })

  it.skipIf(!CONFIRMED)(
    'gera, pontua e grava o resultado',
    async () => {
      const outcomes = await Promise.all(profiles.map(runProfile))
      const summary = aggregate(outcomes)
      const criteria = Object.keys(summary.byCriterion)
      console.log(['perfil', ...criteria].join(' | '))
      for (const o of outcomes) {
        console.log([o.profile, ...criteria.map(c => o.scores[c] ?? '—')].join(' | ') + (o.error ? `  ERRO: ${o.error}` : ''))
        if (o.error) for (const v of o.violations) console.log(`    · ${v}`)
      }
      console.log(['média', ...criteria.map(c => summary.byCriterion[c])].join(' | '))
      console.log(`total ${summary.total} · custo US$ ${summary.costUsd.toFixed(2)}`)

      const baselinePath = path.join(RESULTS_DIR, 'baseline.json')
      if (fs.existsSync(baselinePath)) {
        const base = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as { summary: { byCriterion: Record<string, number>; total: number } }
        console.log(`linha de base: total ${base.summary.total} → ${summary.total}`)
        for (const c of criteria) if (base.summary.byCriterion[c] !== undefined) console.log(`  ${c}: ${base.summary.byCriterion[c]} → ${summary.byCriterion[c]}`)
      }

      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
      fs.mkdirSync(RESULTS_DIR, { recursive: true })
      fs.writeFileSync(
        path.join(RESULTS_DIR, `${stamp}-${gitSha()}.local.json`),
        JSON.stringify({ date: new Date().toISOString(), sha: gitSha(), effort: process.env.EVAL_EFFORT ?? null, summary, outcomes: outcomes.map(o => ({ ...o, usages: undefined })) }, null, 2),
      )
    },
    900_000,
  )
})
