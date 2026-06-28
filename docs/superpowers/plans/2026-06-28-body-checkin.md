# Body Check-in Mensal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar check-in mensal de medidas corporais e performance que alimenta a IA de geração de treinos com regras explícitas de ajuste dinâmico.

**Architecture:** O cliente web registra check-ins via formulário e os inclui no `PlanInput` ao gerar o treino. A IA recebe os 2 últimos check-ins, calcula a tendência e aplica regras de ajuste explícitas no system prompt. Os dados ficam em nova tabela `body_checkins` no Supabase com RLS.

**Tech Stack:** Supabase (Postgres + RLS), Zod (validação API), TypeScript strict, Next.js 14 App Router, Vitest + RTL (testes).

## Global Constraints

- TypeScript strict mode em todos os arquivos novos
- Testes com Vitest (não Jest): importar de `vitest`, não de `jest`
- Supabase client pattern: `createClient(url, anonKey)` para verificar token + `createClient(url, anonKey, { global: { headers: { Authorization: Bearer } } })` para queries com RLS — exatamente como `workout-sessions.ts`
- Zod para validação em todos os endpoints da API
- `apiFetch` do `@/services/api-client` para todas as chamadas no web client
- Componentes client: `'use client'` na primeira linha
- Estilo inline com CSS variables (`var(--surface-1)`, `var(--accent)`, etc.) — não usar classes Tailwind para estilos visuais, seguir padrão de `HomeClient.tsx`
- Testes de API: mockar `@supabase/supabase-js` com `vi.mock` antes dos imports, chamar `vi.resetModules()` em `beforeEach` — exatamente como `workout-sessions.test.ts`

---

## File Map

**Novos:**
- `supabase/migrations/20260628000000_create_body_checkins.sql`
- `packages/types/src/checkin.ts`
- `apps/api/src/routes/checkins.ts`
- `apps/api/src/__tests__/checkins.test.ts`
- `apps/web/src/services/checkin.service.ts`
- `apps/web/src/hooks/useCheckin.ts`
- `apps/web/src/hooks/useCheckinHistory.ts`
- `apps/web/src/components/checkin/CheckinCard.tsx`
- `apps/web/src/components/checkin/CheckinForm.tsx`
- `apps/web/src/components/checkin/CheckinHistoryTable.tsx`
- `apps/web/src/app/checkin/page.tsx`
- `apps/web/src/app/checkin/loading.tsx`
- `apps/web/src/app/checkin/history/page.tsx`
- `apps/web/src/app/checkin/history/loading.tsx`
- `apps/web/src/__tests__/components/CheckinCard.test.tsx`
- `apps/web/src/__tests__/services/checkin.service.test.ts`

**Modificados:**
- `packages/types/src/plan.ts` — adicionar `bodyCheckins?`
- `packages/types/src/index.ts` — exportar `BodyCheckin`, `CheckinInput`
- `packages/ai/src/prompts.ts` — adicionar seções de check-in em ambos os prompts
- `packages/ai/src/__tests__/planner.test.ts` — adicionar testes de check-in
- `apps/api/src/app.ts` — registrar `checkinsRoutes`
- `apps/web/src/services/workout.service.ts` — adicionar param `bodyCheckins`
- `apps/web/src/hooks/useWorkoutPlan.ts` — buscar check-ins antes de gerar plano
- `apps/web/src/app/page.tsx` — buscar 2 últimos check-ins server-side
- `apps/web/src/app/HomeClient.tsx` — adicionar `CheckinCard` + prop `checkins`
- `apps/web/src/components/layout/NavBar.tsx` — substituir tab DNA por Check-in

---

### Task 1: Supabase migration + tipos compartilhados

**Files:**
- Create: `supabase/migrations/20260628000000_create_body_checkins.sql`
- Create: `packages/types/src/checkin.ts`
- Modify: `packages/types/src/plan.ts`
- Modify: `packages/types/src/index.ts`

**Interfaces:**
- Produces: `BodyCheckin`, `CheckinInput` (usados em tasks 2, 3, 4, 5, 6, 7)
- Produces: `PlanInput.bodyCheckins?` (usado em tasks 2 e 5)

- [ ] **Step 1: Criar a migration SQL**

Criar `supabase/migrations/20260628000000_create_body_checkins.sql`:

```sql
create table body_checkins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  month        date not null,
  weight_kg    numeric(5,2),
  body_fat_pct numeric(4,1),
  waist_cm     numeric(5,1),
  hip_cm       numeric(5,1),
  arm_cm       numeric(5,1),
  leg_cm       numeric(5,1),
  squat_kg     numeric(6,2),
  bench_kg     numeric(6,2),
  deadlift_kg  numeric(6,2),
  notes        text,
  created_at   timestamptz not null default now(),
  constraint body_checkins_user_month_unique unique (user_id, month)
);

alter table body_checkins enable row level security;

create policy "users manage own checkins" on body_checkins
  for all using (auth.uid() = user_id);

create index body_checkins_user_month_idx on body_checkins (user_id, month desc);
```

- [ ] **Step 2: Criar `packages/types/src/checkin.ts`**

```ts
export interface BodyCheckin {
  id: string
  month: string
  weight_kg?: number
  body_fat_pct?: number
  waist_cm?: number
  hip_cm?: number
  arm_cm?: number
  leg_cm?: number
  squat_kg?: number
  bench_kg?: number
  deadlift_kg?: number
  notes?: string
  created_at: string
}

export interface CheckinInput {
  month: string
  weight_kg?: number
  body_fat_pct?: number
  waist_cm?: number
  hip_cm?: number
  arm_cm?: number
  leg_cm?: number
  squat_kg?: number
  bench_kg?: number
  deadlift_kg?: number
  notes?: string
}
```

- [ ] **Step 3: Atualizar `packages/types/src/plan.ts`**

Adicionar import de `BodyCheckin` e campo opcional:

```ts
import type { GeneticProfile, WorkoutConstraints } from './genetic'
import type { WorkoutSession, PlannedExercise } from './workout'
import type { RecoveryData } from './recovery'
import type { BodyCheckin } from './checkin'

export interface PlanInput {
  geneticProfile: GeneticProfile
  constraints: WorkoutConstraints
  workoutHistory: WorkoutSession[]
  recoveryData: RecoveryData[]
  userGoals: string
  userLevel: 'iniciante' | 'intermediario' | 'avancado'
  availableDaysPerWeek: number
  bodyCheckins?: BodyCheckin[]
}

export interface NextWorkoutPlan {
  generatedAt: string
  exercises: PlannedExercise[]
  rationale: string
}
```

- [ ] **Step 4: Atualizar `packages/types/src/index.ts`**

Adicionar export:

```ts
export * from './genetic'
export * from './workout'
export * from './recovery'
export * from './plan'
export * from './analytics'
export * from './checkin'
```

- [ ] **Step 5: Rodar os testes existentes de types**

```
cd packages/types && npx vitest run
```

Esperado: todos os testes existentes passando (sem novos ainda).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260628000000_create_body_checkins.sql packages/types/src/checkin.ts packages/types/src/plan.ts packages/types/src/index.ts
git commit -m "feat(types): add BodyCheckin interface and PlanInput.bodyCheckins field"
```

---

### Task 2: AI prompts — integração de check-in

**Files:**
- Modify: `packages/ai/src/prompts.ts`
- Modify: `packages/ai/src/__tests__/planner.test.ts`

**Interfaces:**
- Consumes: `BodyCheckin` de `@helux/types`
- Produces: `buildUserPrompt` com 6º param `checkins?: BodyCheckin[]`; `buildSystemPrompt` com regras de ajuste

- [ ] **Step 1: Escrever testes que falham em `packages/ai/src/__tests__/planner.test.ts`**

Adicionar ao final do arquivo existente:

```ts
import type { BodyCheckin } from '@helux/types'

describe('buildUserPrompt — check-in sections', () => {
  const baseArgs: [WorkoutSession[], RecoveryData[], string, string, number] = [
    [],
    [],
    'Hipertrofia',
    'intermediario',
    4,
  ]

  it('omits check-in section when no checkins provided', () => {
    const prompt = buildUserPrompt(...baseArgs)
    expect(prompt).not.toContain('Tendência de Progresso')
    expect(prompt).not.toContain('Check-in Mensal')
  })

  it('shows current data without delta when only 1 check-in', () => {
    const checkin: BodyCheckin = {
      id: '1', month: '2026-06-01', weight_kg: 82, body_fat_pct: 19,
      squat_kg: 120, bench_kg: 90, deadlift_kg: 140, created_at: '2026-06-01T00:00:00Z',
    }
    const prompt = buildUserPrompt(...baseArgs, [checkin])
    expect(prompt).toContain('Check-in Mensal Atual')
    expect(prompt).toContain('Jun/2026')
    expect(prompt).toContain('82')
    expect(prompt).not.toContain('Tendência de Progresso')
  })

  it('shows delta section when 2 check-ins provided', () => {
    const prev: BodyCheckin = {
      id: '1', month: '2026-05-01', weight_kg: 83.4, body_fat_pct: 19.0,
      squat_kg: 115, bench_kg: 90, deadlift_kg: 140, created_at: '2026-05-01T00:00:00Z',
    }
    const curr: BodyCheckin = {
      id: '2', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: 18.1,
      squat_kg: 120, bench_kg: 90, deadlift_kg: 145, created_at: '2026-06-01T00:00:00Z',
    }
    const prompt = buildUserPrompt(...baseArgs, [prev, curr])
    expect(prompt).toContain('Tendência de Progresso')
    expect(prompt).toContain('Mai/2026')
    expect(prompt).toContain('Jun/2026')
    expect(prompt).toContain('-1.2')
    expect(prompt).toContain('-0.9')
    expect(prompt).toContain('+5.0')
  })
})

describe('buildSystemPrompt — check-in rules', () => {
  it('includes check-in adjustment rules', () => {
    const profile = { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'baixo', predisposicao: 'misto', alertas: [] } as any
    const constraints = {} as any
    const prompt = buildSystemPrompt(profile, constraints)
    expect(prompt).toContain('Ajuste por Tendência de Progresso')
    expect(prompt).toContain('Gordura aumentou')
    expect(prompt).toContain('lifts estagnados')
  })
})
```

- [ ] **Step 2: Rodar para verificar que falham**

```
cd packages/ai && npx vitest run
```

Esperado: FAIL — `buildUserPrompt` não aceita 6º argumento, seção de ajuste não existe.

- [ ] **Step 3: Atualizar `packages/ai/src/prompts.ts`**

Substituir o conteúdo completo por:

```ts
import type { GeneticProfile, WorkoutConstraints, WorkoutSession, RecoveryData, BodyCheckin } from '@helux/types'

function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m, 10) - 1]}/${year}`
}

function buildCheckinSection(checkins?: BodyCheckin[]): string {
  if (!checkins || checkins.length === 0) return ''

  if (checkins.length === 1) {
    const c = checkins[0]
    const lines: string[] = []
    if (c.weight_kg !== undefined) lines.push(`Peso: ${c.weight_kg}kg`)
    if (c.body_fat_pct !== undefined) lines.push(`Gordura: ${c.body_fat_pct}%`)
    if (c.waist_cm !== undefined) lines.push(`Cintura: ${c.waist_cm}cm`)
    if (c.arm_cm !== undefined) lines.push(`Braço: ${c.arm_cm}cm`)
    if (c.leg_cm !== undefined) lines.push(`Coxa: ${c.leg_cm}cm`)
    if (c.squat_kg !== undefined) lines.push(`Agachamento: ${c.squat_kg}kg`)
    if (c.bench_kg !== undefined) lines.push(`Supino: ${c.bench_kg}kg`)
    if (c.deadlift_kg !== undefined) lines.push(`Terra: ${c.deadlift_kg}kg`)
    if (c.notes) lines.push(`Observações: ${c.notes}`)
    return `### Check-in Mensal Atual (${monthLabel(c.month)})

${lines.join('\n')}

(Primeiro check-in — sem dados anteriores para comparar)`
  }

  const [prev, curr] = checkins
  const lines: string[] = []

  function d(label: string, currVal?: number, prevVal?: number, unit = 'kg') {
    if (currVal === undefined || prevVal === undefined) return
    const diff = currVal - prevVal
    const sign = diff > 0 ? '+' : ''
    const icon = diff === 0 ? '→' : diff > 0 ? '↑' : '↓'
    lines.push(`${label}: ${prevVal}${unit} → ${currVal}${unit} (Δ ${sign}${diff.toFixed(1)}${unit}) ${icon}`)
  }

  d('Peso', curr.weight_kg, prev.weight_kg)
  d('Gordura', curr.body_fat_pct, prev.body_fat_pct, 'pp')
  d('Cintura', curr.waist_cm, prev.waist_cm, 'cm')
  d('Braço', curr.arm_cm, prev.arm_cm, 'cm')
  d('Coxa', curr.leg_cm, prev.leg_cm, 'cm')
  d('Agachamento', curr.squat_kg, prev.squat_kg)
  d('Supino', curr.bench_kg, prev.bench_kg)
  d('Terra', curr.deadlift_kg, prev.deadlift_kg)

  return `### Tendência de Progresso (${monthLabel(prev.month)} → ${monthLabel(curr.month)})

${lines.join('\n')}`
}

export function buildSystemPrompt(profile: GeneticProfile, constraints: WorkoutConstraints): string {
  const profileDefaults: GeneticProfile = { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'baixo', predisposicao: 'misto', alertas: [] }
  const constraintDefaults: WorkoutConstraints = { maxWeeklyFrequency: 4, preferredVolume: 'medio', restBetweenSets: '90-120s', cardioIntensityLimit: 'moderado', forbiddenExerciseTypes: [] }
  profile = { ...profileDefaults, ...profile }
  constraints = { ...constraintDefaults, ...constraints }

  return `Você é um coach de performance esportiva especializado em treinamento personalizado baseado em genética e dados biométricos. Seu papel é prescrever o próximo treino ideal com base no perfil genético único do atleta, suas restrições fisiológicas, histórico de treinos e dados de recuperação.

## Sua Abordagem

Você combina ciência do esporte com genômica aplicada. Cada prescrição é baseada em evidências e adaptada ao perfil genético individual — não ao atleta médio. Você compreende que:

- O metabolismo genético influencia a intensidade e volume ideais de treino
- A capacidade de recuperação muscular dita o tempo de descanso entre sessões e entre séries
- O risco cardiovascular define os limites de intensidade para exercícios aeróbicos
- A predisposição genética (força vs. endurance vs. mista) informa a seleção de exercícios
- Alertas genéticos específicos exigem modificações protetoras no programa

## Perfil Genético do Atleta

\`\`\`json
${JSON.stringify(profile, null, 2)}
\`\`\`

### Interpretação do Perfil

**Metabolismo**: ${profile.metabolismo}
${profile.metabolismo === 'rapido' ? '→ Atleta com metabolismo acelerado: responde bem a volumes maiores, recupera carboidratos rapidamente, suporta alta frequência de treino.' : ''}
${profile.metabolismo === 'lento' ? '→ Atleta com metabolismo mais lento: prefere volumes moderados, maior atenção ao timing nutricional, frequência moderada de treino.' : ''}
${profile.metabolismo === 'moderado' ? '→ Atleta com metabolismo equilibrado: resposta equilibrada a volume e intensidade, boa adaptabilidade a diferentes estímulos.' : ''}

**Recuperação Muscular**: ${profile.recuperacaoMuscular}
${profile.recuperacaoMuscular === 'alta' ? '→ Recuperação excelente: pode treinar o mesmo grupo muscular com mais frequência, descanso mais curto entre séries.' : ''}
${profile.recuperacaoMuscular === 'media' ? '→ Recuperação moderada: frequência e descanso balanceados são ideais para maximizar adaptações.' : ''}
${profile.recuperacaoMuscular === 'baixa' ? '→ Recuperação mais lenta: exige mais tempo de descanso entre séries e sessões, evitar sobrecarregar o mesmo grupo muscular em dias consecutivos.' : ''}

**Risco Cardiovascular**: ${profile.riscoCardiovascular}
${profile.riscoCardiovascular === 'alto' ? '→ Risco elevado: cardio deve ser leve (caminhada, ciclismo de baixa intensidade), evitar sprints e treinos de alta intensidade cardíaca.' : ''}
${profile.riscoCardiovascular === 'medio' ? '→ Risco moderado: cardio moderado é adequado, evitar exercícios de intensidade muito alta, monitorar frequência cardíaca.' : ''}
${profile.riscoCardiovascular === 'baixo' ? '→ Risco baixo: pode realizar cardio em qualquer intensidade, incluindo HIIT e exercícios de alta intensidade.' : ''}

**Predisposição Genética**: ${profile.predisposicao}
${profile.predisposicao === 'forca' ? '→ Predisposição para força: responde excepcionalmente a treinos de alta carga e baixas repetições, fibras musculares de contração rápida dominantes.' : ''}
${profile.predisposicao === 'endurance' ? '→ Predisposição para resistência: excelente resposta aeróbica, fibras de contração lenta dominantes, se beneficia de volumes moderados com maior duração.' : ''}
${profile.predisposicao === 'misto' ? '→ Predisposição mista: adaptação equilibrada tanto a treinos de força quanto de resistência, versatilidade para diferentes estímulos.' : ''}

${profile.alertas.length > 0 ? `**Alertas Genéticos — OBRIGATÓRIO RESPEITAR**:\n${profile.alertas.map(a => `- ⚠️ ${a}`).join('\n')}` : ''}

## Restrições de Treino Derivadas do Perfil

\`\`\`json
${JSON.stringify(constraints, null, 2)}
\`\`\`

### Regras Obrigatórias

- **Frequência máxima semanal**: ${constraints.maxWeeklyFrequency} sessões — nunca exceder
- **Volume preferido**: ${constraints.preferredVolume} — calibrar número de séries e exercícios conforme
- **Descanso entre séries**: ${constraints.restBetweenSets} — respeitar para garantir recuperação adequada
- **Limite de intensidade cardio**: ${constraints.cardioIntensityLimit} — não prescrever cardio mais intenso que isso
${constraints.forbiddenExerciseTypes.length > 0 ? `- **Exercícios PROIBIDOS**: ${constraints.forbiddenExerciseTypes.join(', ')} — NUNCA incluir no plano` : ''}

## Metodologia de Periodização — OBRIGATÓRIO

Você DEVE respeitar uma estrutura de divisão muscular para garantir recuperação e progressão:

### Regras de Divisão por Grupo Muscular

1. **Analise o histórico de sessões** fornecido e identifique quais grupos musculares foram treinados em cada dia
2. **Respeite o descanso mínimo antes de retreinar o mesmo grupo**:
   - Recuperação alta: ≥ 48h
   - Recuperação média: ≥ 60h
   - Recuperação baixa: ≥ 72h
3. **Nunca repita o mesmo exercício** que apareceu na sessão imediatamente anterior
4. **Siga a divisão adequada** ao número de dias disponíveis e à predisposição genética:
   - 2 dias/semana → **Upper/Lower**: A = Superior (Peito, Costas, Ombro, Bíceps, Tríceps) | B = Inferior (Glúteo, Quad, Posterior, Panturrilha)
   - 3 dias/semana → **Push/Pull/Legs**: A = Empurrar (Peito, Ombro, Tríceps) | B = Puxar (Costas, Bíceps) | C = Pernas
   - 4 dias/semana → **ABCD**: A = Peito + Tríceps | B = Costas + Bíceps | C = Pernas | D = Ombro + Core
   - Predisposição endurance: substituir 1 sessão de força por Full Body de intensidade moderada
5. **Determine qual letra do ciclo** você está gerando com base no histórico (se histórico vazio → comece pelo Treino A)

### Rotulagem Obrigatória

A justificativa DEVE começar com a linha (em negrito): **Treino [LETRA] — [Grupos]**
Exemplo: **Treino B — Puxar / Costas + Bíceps**

## Ajuste por Tendência de Progresso — OBRIGATÓRIO quando dados disponíveis

Quando a seção "Tendência de Progresso" ou "Check-in Mensal Atual" estiver presente no contexto do atleta, aplique os seguintes ajustes ao plano:

| Situação detectada | Ajuste obrigatório |
|---|---|
| Gordura aumentou > 1pp | Adicionar 1 sessão de cardio moderado ao programa semanal; reduzir volume total em ~20% |
| Gordura reduziu > 1pp | Manter direção atual; não reduzir carga |
| Peso estável + lifts estagnados (Δ = 0 em ≥ 2 lifts) | Aumentar cargas em 5–10%; adicionar 1 série por exercício composto |
| Peso estável + gordura caindo | Recomposição corporal em curso; manter programa sem alteração |
| Peso caindo + lifts caindo | Reduzir volume, priorizar técnica e recuperação — possível déficit calórico excessivo |

Quando não há dados de check-in, ignore esta seção e use apenas o perfil genético e HRV.
Mencione na justificativa como os dados de check-in influenciaram o plano (quando disponíveis).

## Formato de Resposta

Você DEVE responder EXCLUSIVAMENTE com um JSON válido no seguinte formato, sem texto adicional antes ou depois:

\`\`\`json
{
  "generatedAt": "ISO 8601 timestamp atual",
  "exercises": [
    {
      "name": "Nome do exercício em português",
      "sets": 4,
      "reps": "8-10",
      "weight": "carga sugerida (ex: 80kg, +2.5kg, peso corporal)",
      "notes": "observações técnicas opcionais — cueing, progressão, modificações"
    }
  ],
  "rationale": "Justificativa detalhada em português (3-5 frases) explicando por que este plano foi escolhido para este atleta específico, referenciando dados genéticos e de recuperação relevantes. Mencione o HRV atual, a predisposição genética e como o plano respeita as restrições."
}
\`\`\`

### Diretrizes para os Exercícios

- Prescreva entre 4 e 8 exercícios por sessão dependendo do volume genético
- Para predisposição de força: 3-5 séries × 4-8 repetições, cargas elevadas (75-90% 1RM)
- Para predisposição de endurance: 2-4 séries × 12-20 repetições, cargas moderadas (50-70% 1RM)
- Para predisposição mista: 3-4 séries × 8-12 repetições, cargas moderadas-elevadas (65-80% 1RM)
- Organize os exercícios da maior para a menor prioridade neurológica (compostos primeiro)
- O campo "weight" deve ser específico quando o histórico permitir, ou sugestivo quando não houver dados

### Diretrizes para a Justificativa

A justificativa deve:
1. Mencionar o estado de recuperação atual (HRV e outros dados biométricos fornecidos)
2. Referenciar pelo menos um dado genético específico que influenciou a prescrição
3. Explicar a lógica da seleção e ordenação dos exercícios
4. Mencionar qualquer adaptação feita por conta dos alertas genéticos (se houver)
5. Sugerir o próximo passo ou progressão para a próxima sessão`
}

export function buildUserPrompt(
  history: WorkoutSession[],
  recovery: RecoveryData[],
  goals: string,
  level: string,
  daysPerWeek: number,
  checkins?: BodyCheckin[],
): string {
  const recentHistory = history.slice(-5)
  const recentRecovery = recovery.slice(-7)

  const lastSession = recentHistory[recentHistory.length - 1]
  const lastSessionAlert = lastSession
    ? `⚠️ ÚLTIMA SESSÃO (${lastSession.date}): ${lastSession.exercises.map(e => e.name).join(', ')} — NÃO repita estes exercícios e respeite o descanso dos grupos musculares envolvidos.`
    : null

  const historySection =
    recentHistory.length > 0
      ? `### Últimas ${recentHistory.length} Sessões de Treino\n\n${recentHistory
          .map(
            (s) =>
              `**${s.date}**:\n${s.exercises
                .map(
                  (e) =>
                    `- ${e.name}: ${e.sets
                      .map((set) => `${set.reps} reps × ${set.weight}kg (esforço ${set.effort}/10)`)
                      .join(', ')}`,
                )
                .join('\n')}`,
          )
          .join('\n\n')}`
      : '### Histórico de Treinos\n\nNenhuma sessão registrada ainda — atleta iniciando o programa. Gere o Treino A do ciclo.'

  const recoverySection =
    recentRecovery.length > 0
      ? `### Dados de Recuperação (últimos ${recentRecovery.length} dias)\n\n${recentRecovery
          .map(
            (r) =>
              `**${r.date}**: HRV=${r.hrv}ms | FC repouso=${r.restingHR}bpm | Calorias ativas=${r.activeCalories}kcal${r.cardioRecovery !== undefined ? ` | Recuperação cardiovascular=${r.cardioRecovery}bpm` : ''}`,
          )
          .join('\n')}`
      : '### Dados de Recuperação\n\nNenhum dado de recuperação disponível.'

  const latestHRV = recentRecovery.length > 0 ? recentRecovery[recentRecovery.length - 1].hrv : undefined
  const recoveryStatus =
    latestHRV !== undefined
      ? latestHRV >= 60
        ? `✅ HRV atual (${latestHRV}ms) indica boa recuperação — pode treinar em intensidade normal ou elevada.`
        : latestHRV >= 40
          ? `⚠️ HRV atual (${latestHRV}ms) indica recuperação moderada — preferir volume moderado, evitar excesso de intensidade.`
          : `🔴 HRV atual (${latestHRV}ms) indica recuperação comprometida — reduzir volume e intensidade, priorizar técnica.`
      : 'ℹ️ Sem dados de HRV disponíveis — usar julgamento conservador.'

  const checkinSection = buildCheckinSection(checkins)

  return `## Contexto do Atleta para Esta Sessão

**Objetivos**: ${goals}
**Nível de experiência**: ${level}
**Dias disponíveis por semana**: ${daysPerWeek}

**Status de recuperação**: ${recoveryStatus}
${lastSessionAlert ? `\n${lastSessionAlert}` : ''}

---

${historySection}

---

${recoverySection}

---
${checkinSection ? `\n${checkinSection}\n\n---` : ''}

Com base neste contexto e no perfil genético fornecido, prescreva o próximo treino ideal. Lembre-se de respeitar todas as restrições genéticas e o estado atual de recuperação.`
}
```

- [ ] **Step 4: Atualizar `packages/ai/src/planner.ts`** para passar `bodyCheckins` ao prompt

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { PlanInput, NextWorkoutPlan } from '@helux/types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'

export async function generateWorkoutPlan(input: PlanInput): Promise<NextWorkoutPlan> {
  const client = new Anthropic()

  const systemPrompt = buildSystemPrompt(input.geneticProfile, input.constraints)
  const userPrompt = buildUserPrompt(
    input.workoutHistory,
    input.recoveryData,
    input.userGoals,
    input.userLevel,
    input.availableDaysPerWeek,
    input.bodyCheckins,
  )

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
    stream: false,
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Resposta da IA não contém bloco de texto')
  }

  const plan = { ...parseJsonResponse(textBlock.text), generatedAt: new Date().toISOString() }

  return plan
}

function parseJsonResponse(text: string): NextWorkoutPlan {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonStr = jsonMatch ? jsonMatch[1] : text.trim()

  try {
    return JSON.parse(jsonStr) as NextWorkoutPlan
  } catch {
    throw new Error(`Falha ao parsear resposta da IA como JSON: ${text.slice(0, 300)}`)
  }
}
```

- [ ] **Step 5: Rodar os testes**

```
cd packages/ai && npx vitest run
```

Esperado: todos passando, incluindo os 4 novos.

- [ ] **Step 6: Commit**

```bash
git add packages/ai/src/prompts.ts packages/ai/src/planner.ts packages/ai/src/__tests__/planner.test.ts
git commit -m "feat(ai): inject monthly check-in data and add adjustment rules to prompts"
```

---

### Task 3: API — endpoints de check-in

**Files:**
- Create: `apps/api/src/routes/checkins.ts`
- Create: `apps/api/src/__tests__/checkins.test.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: `BodyCheckin`, `CheckinInput` de `@helux/types`
- Produces: `POST /api/checkins` → `BodyCheckin`; `GET /api/checkins?limit=N` → `{ checkins: BodyCheckin[] }`

- [ ] **Step 1: Escrever o teste que falha em `apps/api/src/__tests__/checkins.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const mockSingle = vi.fn().mockResolvedValue({
  data: {
    id: 'c-1', user_id: 'user-123', month: '2026-06-01',
    weight_kg: 82, body_fat_pct: 18.5, squat_kg: 120,
    created_at: new Date().toISOString(),
  },
  error: null,
})
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockUpsert = vi.fn(() => ({ select: mockSelect }))
const mockOrder = vi.fn(() => ({ range: vi.fn().mockResolvedValue({ data: [], error: null }) }))
const mockRange = vi.fn().mockResolvedValue({ data: [], error: null })
const mockFrom = vi.fn(() => ({ upsert: mockUpsert, select: vi.fn(() => ({ order: mockOrder })) }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: mockFrom,
  }),
}))

async function buildApp() {
  const app = Fastify()
  const { checkinsRoutes } = await import('../routes/checkins')
  await app.register(checkinsRoutes)
  return app
}

describe('POST /api/checkins', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('returns 401 without Bearer token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/checkins',
      payload: { month: '2026-06-01', weight_kg: 82 },
    })
    expect(res.statusCode).toBe(401)
  })

  it('saves check-in and returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/checkins',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { month: '2026-06-01', weight_kg: 82, squat_kg: 120 },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('id')
  })

  it('returns 400 when month is not day 01', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/checkins',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { month: '2026-06-15', weight_kg: 82 },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when month is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/checkins',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { weight_kg: 82 },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/checkins', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    app = await buildApp()
  })

  it('returns 401 without Bearer token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/checkins' })
    expect(res.statusCode).toBe(401)
  })

  it('returns checkins array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/checkins?limit=2',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('checkins')
    expect(Array.isArray(body.checkins)).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falham**

```
cd apps/api && npx vitest run __tests__/checkins.test.ts
```

Esperado: FAIL — arquivo `routes/checkins.ts` não existe.

- [ ] **Step 3: Criar `apps/api/src/routes/checkins.ts`**

```ts
import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const CheckinBodySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'month must be YYYY-MM-01'),
  weight_kg: z.number().min(20).max(500).optional(),
  body_fat_pct: z.number().min(1).max(70).optional(),
  waist_cm: z.number().min(30).max(300).optional(),
  hip_cm: z.number().min(30).max(300).optional(),
  arm_cm: z.number().min(10).max(100).optional(),
  leg_cm: z.number().min(10).max(150).optional(),
  squat_kg: z.number().min(0).max(1000).optional(),
  bench_kg: z.number().min(0).max(1000).optional(),
  deadlift_kg: z.number().min(0).max(1000).optional(),
  notes: z.string().max(500).optional(),
})

export async function checkinsRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  async function getUser(authHeader: string | undefined, reply: any) {
    if (!authHeader?.startsWith('Bearer ')) {
      await reply.code(401).send({ error: 'Unauthorized' })
      return null
    }
    const token = authHeader.slice(7)
    const verifyClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error } = await verifyClient.auth.getUser(token)
    if (error || !user) {
      await reply.code(401).send({ error: 'Unauthorized' })
      return null
    }
    return { user, token }
  }

  app.post('/api/checkins', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    const parsed = CheckinBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    }

    const { month, ...fields } = parsed.data
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    })

    const { data, error } = await supabase
      .from('body_checkins')
      .upsert({ user_id: auth.user.id, month, ...fields }, { onConflict: 'user_id,month' })
      .select('*')
      .single()

    if (error) {
      app.log.error(error, 'checkins upsert error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.send(data)
  })

  app.get('/api/checkins', async (request, reply) => {
    const auth = await getUser(request.headers.authorization, reply)
    if (!auth) return

    const query = request.query as { limit?: string }
    const limit = Math.min(Number(query.limit ?? 13), 60)

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    })

    const { data: checkins, error } = await supabase
      .from('body_checkins')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('month', { ascending: false })
      .range(0, limit - 1)

    if (error) {
      app.log.error(error, 'checkins query error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    return reply.send({ checkins: checkins ?? [] })
  })
}
```

- [ ] **Step 4: Registrar em `apps/api/src/app.ts`**

Adicionar import e registro:

```ts
import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { healthRoutes } from './routes/health'
import { geneticProfileRoutes } from './routes/genetic-profile'
import { workoutGenerateRoutes } from './routes/workout-generate'
import { workoutLatestPlanRoutes } from './routes/workout-latest-plan'
import { healthSyncRoutes } from './routes/health-sync'
import { recoveryLatestRoutes } from './routes/recovery-latest'
import { workoutSessionsRoutes } from './routes/workout-sessions'
import { workoutHistoryRoutes } from './routes/workout-history'
import { workoutAnalyticsRoutes } from './routes/workout-analytics'
import { checkinsRoutes } from './routes/checkins'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })

  app.register(healthRoutes)
  app.register(geneticProfileRoutes)
  app.register(workoutGenerateRoutes)
  app.register(workoutLatestPlanRoutes)
  app.register(healthSyncRoutes)
  app.register(recoveryLatestRoutes)
  app.register(workoutSessionsRoutes)
  app.register(workoutHistoryRoutes)
  app.register(workoutAnalyticsRoutes)
  app.register(checkinsRoutes)

  return app
}
```

- [ ] **Step 5: Rodar os testes da API**

```
cd apps/api && npx vitest run
```

Esperado: todos passando.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/checkins.ts apps/api/src/__tests__/checkins.test.ts apps/api/src/app.ts
git commit -m "feat(api): add POST /api/checkins and GET /api/checkins endpoints"
```

---

### Task 4: Web — serviço e hooks de check-in

**Files:**
- Create: `apps/web/src/services/checkin.service.ts`
- Create: `apps/web/src/hooks/useCheckin.ts`
- Create: `apps/web/src/hooks/useCheckinHistory.ts`
- Create: `apps/web/src/__tests__/services/checkin.service.test.ts`

**Interfaces:**
- Consumes: `BodyCheckin`, `CheckinInput` de `@helux/types`; `apiFetch` de `@/services/api-client`
- Produces: `getCheckins(limit)`, `upsertCheckin(input)`, `useCheckin()`, `useCheckinHistory(limit)`

- [ ] **Step 1: Escrever o teste que falha em `apps/web/src/__tests__/services/checkin.service.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

describe('checkin.service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getCheckins calls GET /api/checkins with limit', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce({ checkins: [] })
    const { getCheckins } = await import('@/services/checkin.service')
    const result = await getCheckins(2)
    expect(apiFetch).toHaveBeenCalledWith('/api/checkins?limit=2')
    expect(result).toEqual([])
  })

  it('getCheckins returns empty array on error', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('HTTP 401'))
    const { getCheckins } = await import('@/services/checkin.service')
    const result = await getCheckins(2)
    expect(result).toEqual([])
  })

  it('upsertCheckin calls POST /api/checkins with body', async () => {
    const { apiFetch } = await import('@/services/api-client')
    const saved = { id: 'c-1', month: '2026-06-01', weight_kg: 82, created_at: '2026-06-01T00:00:00Z' }
    vi.mocked(apiFetch).mockResolvedValueOnce(saved)
    const { upsertCheckin } = await import('@/services/checkin.service')
    const result = await upsertCheckin({ month: '2026-06-01', weight_kg: 82 })
    expect(apiFetch).toHaveBeenCalledWith('/api/checkins', {
      method: 'POST',
      body: JSON.stringify({ month: '2026-06-01', weight_kg: 82 }),
    })
    expect(result).toEqual(saved)
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falham**

```
cd apps/web && npx vitest run __tests__/services/checkin.service.test.ts
```

Esperado: FAIL — arquivo não existe.

- [ ] **Step 3: Criar `apps/web/src/services/checkin.service.ts`**

```ts
import { apiFetch } from '@/services/api-client'
import type { BodyCheckin, CheckinInput } from '@helux/types'

export async function getCheckins(limit = 13): Promise<BodyCheckin[]> {
  try {
    const data = (await apiFetch(`/api/checkins?limit=${limit}`)) as { checkins: BodyCheckin[] }
    return data.checkins ?? []
  } catch {
    return []
  }
}

export async function upsertCheckin(input: CheckinInput): Promise<BodyCheckin> {
  return apiFetch('/api/checkins', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<BodyCheckin>
}
```

- [ ] **Step 4: Rodar para confirmar que passam**

```
cd apps/web && npx vitest run __tests__/services/checkin.service.test.ts
```

Esperado: PASS.

- [ ] **Step 5: Criar `apps/web/src/hooks/useCheckin.ts`**

```ts
'use client'

import { useState, useEffect } from 'react'
import { getCheckins, upsertCheckin } from '@/services/checkin.service'
import type { BodyCheckin, CheckinInput } from '@helux/types'

function currentMonthSlug(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function useCheckin() {
  const [current, setCurrent] = useState<BodyCheckin | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCheckins(1)
      .then(([c]) => {
        const month = currentMonthSlug()
        setCurrent(c?.month === month ? c : null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function save(input: Omit<CheckinInput, 'month'>): Promise<BodyCheckin> {
    setSaving(true)
    try {
      const saved = await upsertCheckin({ ...input, month: currentMonthSlug() })
      setCurrent(saved)
      return saved
    } finally {
      setSaving(false)
    }
  }

  return { current, loading, saving, save }
}
```

- [ ] **Step 6: Criar `apps/web/src/hooks/useCheckinHistory.ts`**

```ts
'use client'

import { useState, useEffect } from 'react'
import { getCheckins } from '@/services/checkin.service'
import type { BodyCheckin } from '@helux/types'

export function useCheckinHistory(limit = 13) {
  const [checkins, setCheckins] = useState<BodyCheckin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCheckins(limit)
      .then(setCheckins)
      .finally(() => setLoading(false))
  }, [limit])

  return { checkins, loading }
}
```

- [ ] **Step 7: Rodar todos os testes do web**

```
cd apps/web && npx vitest run
```

Esperado: todos passando.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/services/checkin.service.ts apps/web/src/hooks/useCheckin.ts apps/web/src/hooks/useCheckinHistory.ts apps/web/src/__tests__/services/checkin.service.test.ts
git commit -m "feat(web): add checkin service and useCheckin/useCheckinHistory hooks"
```

---

### Task 5: Web — CheckinCard + integração na home

**Files:**
- Create: `apps/web/src/components/checkin/CheckinCard.tsx`
- Create: `apps/web/src/__tests__/components/CheckinCard.test.tsx`
- Modify: `apps/web/src/services/workout.service.ts`
- Modify: `apps/web/src/hooks/useWorkoutPlan.ts`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/HomeClient.tsx`

**Interfaces:**
- Consumes: `BodyCheckin[]` de `@helux/types`; `getCheckins` de `checkin.service`
- Produces: `<CheckinCard checkins={BodyCheckin[]} />` (renderiza card resumo na home)

- [ ] **Step 1: Escrever o teste que falha em `apps/web/src/__tests__/components/CheckinCard.test.tsx`**

```ts
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CheckinCard } from '@/components/checkin/CheckinCard'
import type { BodyCheckin } from '@helux/types'

const checkin1: BodyCheckin = {
  id: '1', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: 18.1,
  squat_kg: 120, bench_kg: 90, created_at: '2026-06-01T00:00:00Z',
}
const checkin2: BodyCheckin = {
  id: '2', month: '2026-05-01', weight_kg: 83.4, body_fat_pct: 19.0,
  squat_kg: 115, bench_kg: 90, created_at: '2026-05-01T00:00:00Z',
}

describe('CheckinCard', () => {
  it('renders nothing when no checkins', () => {
    const { container } = render(<CheckinCard checkins={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders latest month label with 1 check-in', () => {
    render(<CheckinCard checkins={[checkin1]} />)
    expect(screen.getByText(/Jun\/2026/)).toBeTruthy()
    expect(screen.getByText(/82\.2/)).toBeTruthy()
  })

  it('renders weight delta when 2 check-ins provided (newest first)', () => {
    render(<CheckinCard checkins={[checkin1, checkin2]} />)
    expect(screen.getByText(/Jun\/2026/)).toBeTruthy()
    expect(screen.getByText(/-1\.2/)).toBeTruthy()
  })

  it('renders lift delta for squat', () => {
    render(<CheckinCard checkins={[checkin1, checkin2]} />)
    expect(screen.getByText(/\+5/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falham**

```
cd apps/web && npx vitest run __tests__/components/CheckinCard.test.tsx
```

Esperado: FAIL — componente não existe.

- [ ] **Step 3: Criar `apps/web/src/components/checkin/CheckinCard.tsx`**

```tsx
'use client'

import Link from 'next/link'
import type { BodyCheckin } from '@helux/types'

function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m, 10) - 1]}/${year}`
}

function fmt(val?: number, decimals = 1): string {
  return val !== undefined ? val.toFixed(decimals) : '—'
}

function deltaStr(curr?: number, prev?: number, decimals = 1): string {
  if (curr === undefined || prev === undefined) return ''
  const d = curr - prev
  if (Math.abs(d) < 0.05) return ' ='
  const sign = d > 0 ? '+' : ''
  return ` ${sign}${d.toFixed(decimals)}`
}

function DeltaSpan({ curr, prev, lowerIsBetter = false, decimals = 1 }: {
  curr?: number; prev?: number; lowerIsBetter?: boolean; decimals?: number
}) {
  if (curr === undefined || prev === undefined) return null
  const d = curr - prev
  const neutral = Math.abs(d) < 0.05
  const positive = lowerIsBetter ? d < 0 : d > 0
  const color = neutral ? 'var(--text-faint)' : positive ? 'var(--success, #4ade80)' : 'var(--danger, #f87171)'
  return (
    <span style={{ color, fontSize: 12, marginLeft: 2 }}>
      {deltaStr(curr, prev, decimals)}
    </span>
  )
}

interface CheckinCardProps {
  checkins: BodyCheckin[]
}

export function CheckinCard({ checkins }: CheckinCardProps) {
  if (checkins.length === 0) return null

  const curr = checkins[0]
  const prev = checkins[1]

  return (
    <Link href="/checkin/history" style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)',
        padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>
          Check-in {monthLabel(curr.month)}
        </div>
        <div className="grid grid-cols-2 gap-y-1" style={{ fontSize: 13, color: 'var(--text)' }}>
          {curr.weight_kg !== undefined && (
            <span>
              Peso <strong>{fmt(curr.weight_kg)}kg</strong>
              <DeltaSpan curr={curr.weight_kg} prev={prev?.weight_kg} lowerIsBetter decimals={1} />
            </span>
          )}
          {curr.body_fat_pct !== undefined && (
            <span>
              Gordura <strong>{fmt(curr.body_fat_pct)}%</strong>
              <DeltaSpan curr={curr.body_fat_pct} prev={prev?.body_fat_pct} lowerIsBetter decimals={1} />
            </span>
          )}
          {curr.squat_kg !== undefined && (
            <span>
              Agach. <strong>{fmt(curr.squat_kg, 0)}kg</strong>
              <DeltaSpan curr={curr.squat_kg} prev={prev?.squat_kg} decimals={0} />
            </span>
          )}
          {curr.bench_kg !== undefined && (
            <span>
              Supino <strong>{fmt(curr.bench_kg, 0)}kg</strong>
              <DeltaSpan curr={curr.bench_kg} prev={prev?.bench_kg} decimals={0} />
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Rodar para confirmar que passam**

```
cd apps/web && npx vitest run __tests__/components/CheckinCard.test.tsx
```

Esperado: PASS.

- [ ] **Step 5: Atualizar `apps/web/src/services/workout.service.ts`**

Adicionar `bodyCheckins` como 4º parâmetro de `generatePlan`:

```ts
import { apiFetch } from '@/services/api-client'
import type { NextWorkoutPlan, WorkoutSession, WorkoutAnalytics, BodyCheckin } from '@helux/types'

export async function getLatestPlan(): Promise<NextWorkoutPlan | null> {
  try {
    return (await apiFetch('/workout/latest-plan')) as NextWorkoutPlan
  } catch {
    return null
  }
}

export async function getWorkoutHistory(limit = 5): Promise<WorkoutSession[]> {
  try {
    const data = (await apiFetch(`/api/workouts/history?limit=${limit}`)) as { sessions: WorkoutSession[] }
    return data.sessions ?? []
  } catch {
    return []
  }
}

export async function generatePlan(
  geneticProfile: unknown,
  recoveryData: unknown | null,
  workoutHistory: WorkoutSession[] = [],
  bodyCheckins: BodyCheckin[] = [],
): Promise<NextWorkoutPlan> {
  const body = {
    geneticProfile: geneticProfile ?? {},
    constraints: {},
    workoutHistory,
    recoveryData: recoveryData ? [recoveryData] : [],
    userGoals: 'Hipertrofia e condicionamento geral',
    userLevel: 'intermediario',
    availableDaysPerWeek: 4,
    bodyCheckins,
  }
  return (await apiFetch('/workout/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })) as NextWorkoutPlan
}

export async function getWorkoutAnalytics(): Promise<WorkoutAnalytics | null> {
  try {
    return (await apiFetch('/api/workouts/analytics')) as WorkoutAnalytics
  } catch {
    return null
  }
}
```

- [ ] **Step 6: Atualizar `apps/web/src/hooks/useWorkoutPlan.ts`**

Adicionar fetch de check-ins antes de gerar o plano:

```ts
'use client'

import { useState, useEffect } from 'react'
import { getLatestPlan, generatePlan as generatePlanService, getWorkoutHistory } from '@/services/workout.service'
import { getGeneticProfile } from '@/services/genetics.service'
import { getLatestRecovery } from '@/services/recovery.service'
import { getCheckins } from '@/services/checkin.service'
import type { NextWorkoutPlan } from '@helux/types'

const STORAGE_KEY = 'helux:workout-plan'

function loadFromStorage(): NextWorkoutPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as NextWorkoutPlan) : null
  } catch {
    return null
  }
}

function saveToStorage(plan: NextWorkoutPlan) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  } catch {}
}

export function useWorkoutPlan() {
  const [plan, setPlanState] = useState<NextWorkoutPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  useEffect(() => {
    const cached = loadFromStorage()
    if (cached) {
      setPlanState(cached)
      setLoading(false)
      return
    }
    getLatestPlan()
      .then(p => {
        if (p) saveToStorage(p)
        setPlanState(p)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  async function generatePlan() {
    setGenerating(true)
    setGenerationError(null)
    try {
      const [profile, recovery, history, checkins] = await Promise.all([
        getGeneticProfile(),
        getLatestRecovery(),
        getWorkoutHistory(5),
        getCheckins(2),
      ])
      const checkinsSorted = [...checkins].sort((a, b) => a.month.localeCompare(b.month))
      const newPlan = await generatePlanService(profile, recovery, history, checkinsSorted)
      saveToStorage(newPlan)
      setPlanState(newPlan)
    } catch (e) {
      setGenerationError(e instanceof Error ? e.message : 'Erro ao gerar plano')
    } finally {
      setGenerating(false)
    }
  }

  function setPlan(p: NextWorkoutPlan | null) {
    if (p) saveToStorage(p)
    setPlanState(p)
  }

  return { plan, loading, generating, error, generationError, setPlan, generatePlan }
}
```

- [ ] **Step 7: Atualizar `apps/web/src/app/page.tsx`**

Adicionar fetch server-side dos 2 últimos check-ins:

```ts
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { HomeClient } from './HomeClient'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getLatestPlan() {
  try {
    const res = await fetch(`${API}/workout/latest-plan`, { next: { revalidate: 300 } })
    return res.ok ? res.json() : null
  } catch { return null }
}

async function getRecovery(token: string) {
  try {
    const res = await fetch(`${API}/api/recovery/latest`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 }
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

async function getGeneticInsight() {
  try {
    const res = await fetch(`${API}/genetic-profile`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const p = await res.json()
    if (p?.drivers?.[0]) return p.drivers[0]
    return null
  } catch { return null }
}

async function getLatestCheckins(token: string) {
  try {
    const res = await fetch(`${API}/api/checkins?limit=2`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.checkins ?? []
  } catch { return [] }
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [plan, recovery, insight, checkins] = await Promise.all([
    getLatestPlan(),
    getRecovery(session.access_token),
    getGeneticInsight(),
    getLatestCheckins(session.access_token),
  ])

  const firstName = session.user.email?.split('@')[0] ?? 'atleta'

  return (
    <HomeClient
      plan={plan}
      recovery={recovery}
      insight={insight}
      firstName={firstName}
      checkins={checkins}
    />
  )
}
```

- [ ] **Step 8: Atualizar `apps/web/src/app/HomeClient.tsx`**

Adicionar prop `checkins` e renderizar `<CheckinCard>` abaixo do botão gerar. Localizar a interface `HomeClientProps` e adicionar o campo, depois importar e usar o card:

No início do arquivo, adicionar import:
```ts
import { CheckinCard } from '@/components/checkin/CheckinCard'
import type { BodyCheckin } from '@helux/types'
```

Atualizar a interface:
```ts
interface HomeClientProps {
  plan: any
  recovery: { hrv?: number; restingHR?: number; activeCalories?: number; sleepHours?: number; date?: string } | null
  insight: { title?: string; text?: string; icon?: string } | null
  firstName: string
  checkins: BodyCheckin[]
}
```

Atualizar a assinatura da função:
```ts
export function HomeClient({ plan: initialPlan, recovery, insight, firstName, checkins }: HomeClientProps) {
```

Após o bloco do botão "Gerar Novo Plano" e antes do bloco de Recovery Ring, inserir:
```tsx
{/* Check-in card */}
<CheckinCard checkins={checkins} />
```

- [ ] **Step 9: Rodar todos os testes**

```
cd apps/web && npx vitest run
```

Esperado: todos passando.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/components/checkin/CheckinCard.tsx apps/web/src/__tests__/components/CheckinCard.test.tsx apps/web/src/services/workout.service.ts apps/web/src/hooks/useWorkoutPlan.ts apps/web/src/app/page.tsx apps/web/src/app/HomeClient.tsx
git commit -m "feat(web): add CheckinCard to home and wire check-ins into plan generation"
```

---

### Task 6: Web — CheckinForm + página /checkin

**Files:**
- Create: `apps/web/src/components/checkin/CheckinForm.tsx`
- Create: `apps/web/src/app/checkin/page.tsx`
- Create: `apps/web/src/app/checkin/loading.tsx`

**Interfaces:**
- Consumes: `useCheckin()` hook; `CheckinInput` de `@helux/types`
- Produces: formulário de check-in em `/checkin`

- [ ] **Step 1: Criar `apps/web/src/components/checkin/CheckinForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCheckin } from '@/hooks/useCheckin'
import type { CheckinInput } from '@helux/types'

type FieldName = keyof Omit<CheckinInput, 'month' | 'notes'>

function NumericField({ label, name, value, onChange }: {
  label: string; name: FieldName; value: string; onChange: (n: FieldName, v: string) => void
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        value={value}
        onChange={e => onChange(name, e.target.value)}
        style={{
          width: '100%',
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 15,
          color: 'var(--text)',
          minHeight: 44,
        }}
      />
    </div>
  )
}

function currentMonthLabel(): string {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

export function CheckinForm() {
  const router = useRouter()
  const { current, saving, save } = useCheckin()

  const toStr = (v?: number) => v !== undefined ? String(v) : ''

  const [fields, setFields] = useState<Record<FieldName, string>>({
    weight_kg: toStr(current?.weight_kg),
    body_fat_pct: toStr(current?.body_fat_pct),
    waist_cm: toStr(current?.waist_cm),
    hip_cm: toStr(current?.hip_cm),
    arm_cm: toStr(current?.arm_cm),
    leg_cm: toStr(current?.leg_cm),
    squat_kg: toStr(current?.squat_kg),
    bench_kg: toStr(current?.bench_kg),
    deadlift_kg: toStr(current?.deadlift_kg),
  })
  const [notes, setNotes] = useState(current?.notes ?? '')
  const [showBody, setShowBody] = useState(true)
  const [showPerf, setShowPerf] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function update(name: FieldName, value: string) {
    setFields(f => ({ ...f, [name]: value }))
  }

  function toNum(v: string): number | undefined {
    const n = parseFloat(v)
    return isNaN(n) ? undefined : n
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const input: Omit<CheckinInput, 'month'> = {
        weight_kg: toNum(fields.weight_kg),
        body_fat_pct: toNum(fields.body_fat_pct),
        waist_cm: toNum(fields.waist_cm),
        hip_cm: toNum(fields.hip_cm),
        arm_cm: toNum(fields.arm_cm),
        leg_cm: toNum(fields.leg_cm),
        squat_kg: toNum(fields.squat_kg),
        bench_kg: toNum(fields.bench_kg),
        deadlift_kg: toNum(fields.deadlift_kg),
        notes: notes.trim() || undefined,
      }
      await save(input)
      router.push('/checkin/history')
    } catch {
      setError('Erro ao salvar check-in. Tente novamente.')
    }
  }

  function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
    return (
      <button type="button" onClick={onToggle} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'none', border: 'none', padding: '12px 0 8px', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.05em',
      }}>
        {label}
        <span style={{ fontSize: 18, color: 'var(--text-faint)' }}>{open ? '−' : '+'}</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '0 16px 16px' }}>
      <SectionHeader label="COMPOSIÇÃO CORPORAL" open={showBody} onToggle={() => setShowBody(v => !v)} />
      {showBody && (
        <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 8 }}>
          <NumericField label="Peso (kg)" name="weight_kg" value={fields.weight_kg} onChange={update} />
          <NumericField label="Gordura (%)" name="body_fat_pct" value={fields.body_fat_pct} onChange={update} />
          <NumericField label="Cintura (cm)" name="waist_cm" value={fields.waist_cm} onChange={update} />
          <NumericField label="Quadril (cm)" name="hip_cm" value={fields.hip_cm} onChange={update} />
          <NumericField label="Braço (cm)" name="arm_cm" value={fields.arm_cm} onChange={update} />
          <NumericField label="Coxa (cm)" name="leg_cm" value={fields.leg_cm} onChange={update} />
        </div>
      )}

      <SectionHeader label="PERFORMANCE" open={showPerf} onToggle={() => setShowPerf(v => !v)} />
      {showPerf && (
        <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 8 }}>
          <NumericField label="Agachamento (kg)" name="squat_kg" value={fields.squat_kg} onChange={update} />
          <NumericField label="Supino (kg)" name="bench_kg" value={fields.bench_kg} onChange={update} />
          <NumericField label="Terra (kg)" name="deadlift_kg" value={fields.deadlift_kg} onChange={update} />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>
          OBSERVAÇÕES (opcional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            background: 'var(--surface-2)',
            border: '1px solid var(--hairline)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 14,
            color: 'var(--text)',
            resize: 'vertical',
          }}
        />
      </div>

      {error && <p style={{ color: 'var(--danger, #f87171)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <button type="submit" disabled={saving} style={{
        width: '100%',
        background: 'var(--accent)',
        color: 'var(--accent-ink)',
        border: 'none',
        borderRadius: 'var(--r-pill)',
        padding: '14px 20px',
        fontSize: 15,
        fontWeight: 600,
        fontFamily: 'var(--font-space-grotesk)',
        cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.7 : 1,
        minHeight: 44,
      }}>
        {saving ? 'Salvando…' : `Salvar check-in de ${currentMonthLabel()}`}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Criar `apps/web/src/app/checkin/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Shell } from '@/components/layout/Shell'
import { CheckinForm } from '@/components/checkin/CheckinForm'

export default async function CheckinPage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <div className="max-w-lg mx-auto pb-24">
        <header style={{ padding: '48px 16px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>
            Mensal
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Check-in
          </h1>
        </header>
        <CheckinForm />
      </div>
    </Shell>
  )
}
```

- [ ] **Step 3: Criar `apps/web/src/app/checkin/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Carregando…</p>
    </div>
  )
}
```

- [ ] **Step 4: Rodar os testes**

```
cd apps/web && npx vitest run
```

Esperado: todos passando.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/checkin/CheckinForm.tsx apps/web/src/app/checkin/page.tsx apps/web/src/app/checkin/loading.tsx
git commit -m "feat(web): add CheckinForm and /checkin page"
```

---

### Task 7: Web — CheckinHistoryTable + página /checkin/history

**Files:**
- Create: `apps/web/src/components/checkin/CheckinHistoryTable.tsx`
- Create: `apps/web/src/__tests__/components/CheckinHistoryTable.test.tsx`
- Create: `apps/web/src/app/checkin/history/page.tsx`
- Create: `apps/web/src/app/checkin/history/loading.tsx`

**Interfaces:**
- Consumes: `useCheckinHistory()` hook; `BodyCheckin[]`
- Produces: tabela de histórico em `/checkin/history`

- [ ] **Step 1: Escrever o teste que falha em `apps/web/src/__tests__/components/CheckinHistoryTable.test.tsx`**

```ts
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CheckinHistoryTable } from '@/components/checkin/CheckinHistoryTable'
import type { BodyCheckin } from '@helux/types'

const rows: BodyCheckin[] = [
  { id: '2', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: 18.1, squat_kg: 120, created_at: '2026-06-01T00:00:00Z' },
  { id: '1', month: '2026-05-01', weight_kg: 83.4, body_fat_pct: 19.0, squat_kg: 115, created_at: '2026-05-01T00:00:00Z' },
]

describe('CheckinHistoryTable', () => {
  it('renders empty state when no checkins', () => {
    render(<CheckinHistoryTable checkins={[]} />)
    expect(screen.getByText(/Nenhum check-in/)).toBeTruthy()
  })

  it('renders month labels for each row', () => {
    render(<CheckinHistoryTable checkins={rows} />)
    expect(screen.getByText('Jun/2026')).toBeTruthy()
    expect(screen.getByText('Mai/2026')).toBeTruthy()
  })

  it('renders weight values', () => {
    render(<CheckinHistoryTable checkins={rows} />)
    expect(screen.getByText('82.2')).toBeTruthy()
    expect(screen.getByText('83.4')).toBeTruthy()
  })

  it('renders delta for weight (second row vs first)', () => {
    render(<CheckinHistoryTable checkins={rows} />)
    expect(screen.getByText('-1.2')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falham**

```
cd apps/web && npx vitest run __tests__/components/CheckinHistoryTable.test.tsx
```

Esperado: FAIL — componente não existe.

- [ ] **Step 3: Criar `apps/web/src/components/checkin/CheckinHistoryTable.tsx`**

```tsx
'use client'

import Link from 'next/link'
import type { BodyCheckin } from '@helux/types'

function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m, 10) - 1]}/${year}`
}

function fmt(val?: number, decimals = 1): string {
  return val !== undefined ? val.toFixed(decimals) : '—'
}

function DeltaCell({ curr, prev, lowerIsBetter = false, decimals = 1 }: {
  curr?: number; prev?: number; lowerIsBetter?: boolean; decimals?: number
}) {
  if (curr === undefined || prev === undefined) return <span style={{ color: 'var(--text-faint)' }}>—</span>
  const d = curr - prev
  const neutral = Math.abs(d) < 0.05
  const positive = lowerIsBetter ? d < 0 : d > 0
  const color = neutral ? 'var(--text-faint)' : positive ? 'var(--success, #4ade80)' : 'var(--danger, #f87171)'
  const sign = d > 0 ? '+' : ''
  const text = neutral ? '=' : `${sign}${d.toFixed(decimals)}`
  return <span style={{ color, fontSize: 12 }}>{text}</span>
}

interface CheckinHistoryTableProps {
  checkins: BodyCheckin[]
}

export function CheckinHistoryTable({ checkins }: CheckinHistoryTableProps) {
  if (checkins.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Nenhum check-in registrado ainda.</p>
        <Link href="/checkin" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 8, display: 'inline-block' }}>
          Fazer primeiro check-in →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', padding: '0 16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
            {['Mês','Peso','Gordura','Cintura','Braço','Agach.','Supino','Terra'].map(h => (
              <th key={h} style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--text-faint)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {checkins.map((c, i) => {
            const next = checkins[i + 1]
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                <td style={{ padding: '10px 6px', color: 'var(--text)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {monthLabel(c.month)}
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.weight_kg)}</div>
                  <DeltaCell curr={c.weight_kg} prev={next?.weight_kg} lowerIsBetter decimals={1} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.body_fat_pct)}</div>
                  <DeltaCell curr={c.body_fat_pct} prev={next?.body_fat_pct} lowerIsBetter decimals={1} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.waist_cm)}</div>
                  <DeltaCell curr={c.waist_cm} prev={next?.waist_cm} lowerIsBetter decimals={1} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.arm_cm)}</div>
                  <DeltaCell curr={c.arm_cm} prev={next?.arm_cm} decimals={1} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.squat_kg, 0)}</div>
                  <DeltaCell curr={c.squat_kg} prev={next?.squat_kg} decimals={0} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.bench_kg, 0)}</div>
                  <DeltaCell curr={c.bench_kg} prev={next?.bench_kg} decimals={0} />
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <div>{fmt(c.deadlift_kg, 0)}</div>
                  <DeltaCell curr={c.deadlift_kg} prev={next?.deadlift_kg} decimals={0} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Rodar para confirmar que passam**

```
cd apps/web && npx vitest run __tests__/components/CheckinHistoryTable.test.tsx
```

Esperado: PASS.

- [ ] **Step 5: Criar `apps/web/src/app/checkin/history/page.tsx`**

```tsx
'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { CheckinHistoryTable } from '@/components/checkin/CheckinHistoryTable'
import { useCheckinHistory } from '@/hooks/useCheckinHistory'

function HistoryContent() {
  const { checkins, loading } = useCheckinHistory(24)

  if (loading) {
    return <p style={{ color: 'var(--text-faint)', fontSize: 14, padding: '0 16px' }}>Carregando…</p>
  }

  return <CheckinHistoryTable checkins={checkins} />
}

export default function CheckinHistoryPage() {
  return (
    <Shell>
      <div className="max-w-lg mx-auto pb-24">
        <header style={{ padding: '48px 16px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>
              Histórico
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Check-ins</h1>
          </div>
          <Link href="/checkin" style={{
            background: 'var(--accent)', color: 'var(--accent-ink)',
            borderRadius: 'var(--r-pill)', padding: '10px 16px',
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            + Novo
          </Link>
        </header>
        <HistoryContent />
      </div>
    </Shell>
  )
}
```

Note: esta página usa `'use client'` implicitamente via `useCheckinHistory`. Adicionar `'use client'` no topo do arquivo.

Arquivo final com `'use client'` na primeira linha:

```tsx
'use client'

import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { CheckinHistoryTable } from '@/components/checkin/CheckinHistoryTable'
import { useCheckinHistory } from '@/hooks/useCheckinHistory'

function HistoryContent() {
  const { checkins, loading } = useCheckinHistory(24)

  if (loading) {
    return <p style={{ color: 'var(--text-faint)', fontSize: 14, padding: '0 16px' }}>Carregando…</p>
  }

  return <CheckinHistoryTable checkins={checkins} />
}

export default function CheckinHistoryPage() {
  return (
    <Shell>
      <div className="max-w-lg mx-auto pb-24">
        <header style={{ padding: '48px 16px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>
              Histórico
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Check-ins</h1>
          </div>
          <Link href="/checkin" style={{
            background: 'var(--accent)', color: 'var(--accent-ink)',
            borderRadius: 'var(--r-pill)', padding: '10px 16px',
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            + Novo
          </Link>
        </header>
        <HistoryContent />
      </div>
    </Shell>
  )
}
```

- [ ] **Step 6: Criar `apps/web/src/app/checkin/history/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Carregando histórico…</p>
    </div>
  )
}
```

- [ ] **Step 7: Rodar todos os testes**

```
cd apps/web && npx vitest run
```

Esperado: todos passando.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/checkin/CheckinHistoryTable.tsx apps/web/src/__tests__/components/CheckinHistoryTable.test.tsx apps/web/src/app/checkin/history/page.tsx apps/web/src/app/checkin/history/loading.tsx
git commit -m "feat(web): add CheckinHistoryTable and /checkin/history page"
```

---

### Task 8: Web — NavBar update

**Files:**
- Modify: `apps/web/src/components/layout/NavBar.tsx`

**Interfaces:**
- Produces: tab "Check-in" em `/checkin` substituindo tab "DNA" em `/dna`

- [ ] **Step 1: Atualizar `apps/web/src/components/layout/NavBar.tsx`**

Substituir o conteúdo completo:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ICONS: Record<string, string> = {
  home:     'M4 11.5 12 4l8 7.5M6 10v9h12v-9',
  dumbbell: 'M6.5 9v6M9.5 7.5v9M14.5 7.5v9M17.5 9v6M9.5 12h5M4.5 11v2M19.5 11v2',
  ruler:    'M21 6H3M21 12H3M21 18H3M7 6v12M12 6v4M17 6v8',
  chart:    'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8',
  play:     'M7 4.5v15l13-7.5z',
  flame:    'M12 3c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 1-2-1-4-1-8z',
  chevron:  'M9 6l6 6-6 6',
  dna:      'M8 3c0 5 8 7 8 12s-8 6-8 9M16 3c0 5-8 7-8 12s8 6 8 9M8.5 7h7M7.5 12h9M8.5 17h7',
}

function Icon({ name, size = 22, stroke = 'currentColor', sw = 1.9 }: { name: keyof typeof ICONS; size?: number; stroke?: string; sw?: number }) {
  const solid = name === 'play'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={solid ? stroke : 'none'} stroke={solid ? 'none' : stroke}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

const tabs = [
  { href: '/', label: 'Hoje', icon: 'home' as const },
  { href: '/history', label: 'Treinos', icon: 'dumbbell' as const },
  { href: '/checkin', label: 'Check-in', icon: 'ruler' as const },
  { href: '/recovery', label: 'Progresso', icon: 'chart' as const },
]

export function NavBar() {
  const pathname = usePathname()
  if (pathname === '/login' || pathname.startsWith('/auth') || pathname === '/workout') return null

  return (
    <nav style={{ background: 'rgba(22,25,22,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--hairline)' }}
      className="fixed bottom-0 left-0 right-0 z-50">
      <div className="flex max-w-lg mx-auto pb-safe">
        {tabs.map(tab => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href}
              className="flex-1 flex flex-col items-center py-3 gap-1 min-h-[56px] justify-center transition-colors"
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-faint)' }}>
              <Icon name={tab.icon} size={22} stroke="currentColor" />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', fontFamily: 'var(--font-space-grotesk)' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Rodar todos os testes finais**

```
cd apps/web && npx vitest run
cd apps/api && npx vitest run
cd packages/ai && npx vitest run
```

Esperado: todos passando.

- [ ] **Step 3: Commit final**

```bash
git add apps/web/src/components/layout/NavBar.tsx
git commit -m "feat(web): replace DNA tab with Check-in tab in NavBar"
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Tabela `body_checkins` com todos os campos — Task 1
- ✅ `BodyCheckin` e `CheckinInput` em `@helux/types` — Task 1
- ✅ Regras de ajuste no system prompt — Task 2
- ✅ Seção de tendência no user prompt — Task 2
- ✅ `POST /api/checkins` com upsert por `(user_id, month)` — Task 3
- ✅ `GET /api/checkins?limit=N` — Task 3
- ✅ `getCheckins` e `upsertCheckin` no web service — Task 4
- ✅ `useCheckin` com pré-preenchimento do mês atual — Task 4
- ✅ `useCheckinHistory` — Task 4
- ✅ `CheckinCard` na home com delta — Task 5
- ✅ `generatePlan` recebe e envia `bodyCheckins` — Task 5
- ✅ Check-ins buscados server-side na home page — Task 5
- ✅ Formulário `/checkin` com 3 blocos colapsáveis — Task 6
- ✅ Tabela de histórico `/checkin/history` com deltas — Task 7
- ✅ NavBar: tab DNA → Check-in; rota `/dna` mantida — Task 8

**Consistência de tipos:**
- `BodyCheckin` definido em Task 1, consumido por Tasks 2, 3, 4, 5, 7 com mesmo nome
- `getCheckins` retorna `BodyCheckin[]` (not `{ checkins: BodyCheckin[] }`) — o service já faz o unwrap
- `useWorkoutPlan` ordena check-ins por `month` ascending antes de passar à API — garantido em Task 5 Step 6
- `CheckinCard` recebe `checkins[0]` como mais recente (API retorna desc) — correto
- `CheckinHistoryTable` recebe `checkins[i+1]` como "anterior" (desc = índice maior é mais antigo) — correto
