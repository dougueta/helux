/**
 * Recalcula as variantes dos planos ativos pela regra nova (028 R8, T075).
 *
 *   pnpm --filter @helux/api exec tsx scripts/refresh-plan-variants.ts                       # simula, não grava
 *   pnpm --filter @helux/api exec tsx scripts/refresh-plan-variants.ts --apply --backup <dir> # grava, com backup fora do repo
 *
 * Plano ativo = o mais recente de cada pessoa. Só sessões não concluídas mudam.
 * A saída traz só contagens e nomes de exercícios; o backup (com os planos completos) fica fora do repositório.
 * Precisa de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (lidos de apps/api/.env quando existir).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { parseGeneraJson } from '@helux/genetics'
import type { GeneticProfile, MesocycleSession } from '@helux/types'
import { getGeneticRaw } from '../src/services/genetics.service'
import { parseRefreshArgs, refreshPlanSessions, summarizeRefresh, type RefreshResult } from '../src/services/plan-variants-refresh.service'

const apiRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(apiRoot, '..', '..')

interface PlanRow {
  id: string
  user_id: string
  created_at: string
  sessions: MesocycleSession[]
}

async function main(): Promise<number> {
  const args = parseRefreshArgs(process.argv.slice(2), repoRoot, (p) => path.resolve(process.cwd(), p))
  if (args.mode === 'error') {
    console.error(`Erro: ${args.message}`)
    return 2
  }

  const envFile = path.join(apiRoot, '.env')
  if (existsSync(envFile)) process.loadEnvFile(envFile)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Erro: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
    return 2
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data, error } = await supabase.from('mesocycle_plans').select('id, user_id, created_at, sessions').order('created_at', { ascending: false })
  if (error) throw error
  const latest = new Map<string, PlanRow>()
  for (const row of (data ?? []) as PlanRow[]) if (!latest.has(row.user_id)) latest.set(row.user_id, row)

  const results: { row: PlanRow; result: RefreshResult }[] = []
  let neutral = 0
  for (const row of latest.values()) {
    let profile: GeneticProfile | null = null
    const raw = await getGeneticRaw(row.user_id, supabase)
    if (raw) {
      try {
        profile = parseGeneraJson(raw as never)
      } catch {
        profile = null
      }
    }
    if (!profile) neutral++
    results.push({ row, result: refreshPlanSessions(row.sessions ?? [], profile) })
  }

  const summary = summarizeRefresh(results)
  console.log(args.mode === 'apply' ? 'Modo: aplicar' : 'Modo: simulação (nada é gravado)')
  console.log(`Planos ativos lidos: ${summary.plansRead} (perfil neutro em ${neutral})`)
  console.log(`Planos com mudança: ${summary.plansChanged}`)
  console.log(`Exercícios com lista nova: ${summary.exercisesChanged}`)
  for (const [name, row] of Object.entries(summary.byExercise).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`- ${name} (${row.count}): sai ${row.removed.join(', ') || 'nada'}; entra ${row.added.join(', ') || 'nada'}`)
  }

  if (args.mode !== 'apply') return 0

  const changed = results.filter((r) => r.result.changes.length > 0)
  mkdirSync(args.backupDir, { recursive: true })
  const backupFile = path.join(args.backupDir, `mesocycle-plans-before-refresh-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(backupFile, JSON.stringify(changed.map(({ row }) => ({ id: row.id, sessions: row.sessions })), null, 2))
  console.log(`Backup gravado: ${changed.length} plano(s)`)

  let written = 0
  for (const { row, result } of changed) {
    const { error: updateError } = await supabase.from('mesocycle_plans').update({ sessions: result.sessions }).eq('id', row.id)
    if (updateError) {
      console.error(`Erro ao gravar um plano depois de ${written} gravado(s); restaure pelo backup se precisar`)
      throw updateError
    }
    written++
  }
  console.log(`Planos gravados: ${written}`)
  return 0
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : 'Falha inesperada')
    process.exit(1)
  },
)
