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
import type { MesocycleSession, PlanDecision, UsageRecord } from '@helux/types'
import { generateMesocyclePlan } from '../../mesocycle-planner'
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
type JudgeCriterion = (typeof JUDGE_CRITERIA)[number]

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'object',
      properties: Object.fromEntries(JUDGE_CRITERIA.map(c => [c, { type: 'integer', minimum: 0, maximum: 5 }])),
      required: [...JUDGE_CRITERIA],
      additionalProperties: false,
    },
    comments: { type: 'string' },
  },
  required: ['scores', 'comments'],
  additionalProperties: false,
} as const

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

async function judge(p: EvalProfile, sessions: MesocycleSession[], rationale: string, decisions: PlanDecision[]): Promise<{ scores: Record<JudgeCriterion, number>; comments: string; usages: UsageRecord[] }> {
  const client = new Anthropic()
  const res = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: JUDGE_SCHEMA } },
    system: JUDGE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `# Perfil do usuário\n${renderProfile(p.profile)}\n\n# Plano\n${compactPlan(sessions)}\n\n# Justificativa\n${rationale}\n\n# Decisões\n${decisions.map(d => `- [${d.topic}] ${d.choice} — ${d.reason} (fontes: ${d.sources.join(', ')})`).join('\n')}`,
      },
    ],
  })
  const block = res.content.find(b => b.type === 'text')
  const parsed = JSON.parse(block && block.type === 'text' ? block.text : '{}') as { scores: Record<JudgeCriterion, number>; comments: string }
  return { ...parsed, usages: usagesFromMessage(res, 'mesociclo', null) }
}

interface ProfileOutcome extends ProfileResult {
  violations: string[]
  comments: string
  error?: string
}

async function runProfile(p: EvalProfile): Promise<ProfileOutcome> {
  try {
    const result = await generateMesocyclePlan({ profile: p.profile, constraints: p.agentConstraints, daysPerWeek: p.daysPerWeek, geneticProfile: p.geneticProfile })
    const sessions = result.plan.sessions
    const det = scorePlan({ sessions, constraints: p.expectedConstraints, expectations: p.expectations })
    const j = await judge(p, sessions, result.plan.rationale, result.decisions)
    return {
      profile: p.id,
      scores: { ...det.scores, objetivo: j.scores.objetivo, justificativas: j.scores.justificativas, 'genetica-proporcional': j.scores['genetica-proporcional'], 'notas-honestas': Math.min(det.scores['notas-honestas'], j.scores['notas-honestas']) },
      usages: [...result.usages, ...j.usages],
      violations: det.violations.map(v => `${v.exercise ?? '—'}: ${v.rule}`),
      comments: j.comments,
    }
  } catch (err) {
    const usages = (err as { usages?: UsageRecord[] }).usages ?? []
    return { profile: p.id, scores: { seguranca: 0, 'frequencia-volume': 0, 'cardio-mobilidade': 0, 'notas-honestas': 0, objetivo: 0, justificativas: 0, 'genetica-proporcional': 0 }, usages, violations: [], comments: '', error: (err as Error).message }
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
      for (const o of outcomes) console.log([o.profile, ...criteria.map(c => o.scores[c] ?? '—')].join(' | ') + (o.error ? `  ERRO: ${o.error}` : ''))
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
