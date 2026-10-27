# Contrato do Agente de Treino — 024

## `generateMesocyclePlan(input)` (`@helux/ai`, evolui a da 022)

```ts
interface GenerateMesocycleInput {
  profile: IntegratedProfile          // snapshot (bloco 2, cache)
  constraints: HardConstraints        // inclui limites articulares, impacto e RIR mínimo
  method: MethodPrescription          // moldura obrigatória (R5)
  conditions: Array<{ label: string; rules: ConditionRules }>
  cycle?: CycleSummary                // achados do ciclo anterior (F5)
  checkinTrend?: CheckinTrend         // (F5)
  loadProgression?: LoadProgression[]
  geneticProfile?: GeneticProfile | null
}

interface GenerateMesocycleResult {
  weekTemplate: Array<{ letter: string; kind: SessionKind; focus: string; exercises: PlannedExercise[] }>
  rationale: string
  decisions: PlanDecision[]           // tópicos: + 'condicao' | 'cardio' | 'mobilidade' | 'ciclo'
  usages: UsageRecord[]
}
```

A expansão para semanas (`expandWeeks(template, method)` em `@helux/workouts`) e a progressão de carga acontecem na API, depois da validação.

### Pedido à Anthropic

```ts
client.beta.messages.stream({
  model: 'claude-opus-5-5',
  max_tokens: 64000,
  betas: ['server-side-fallback-2026-07-01'],
  fallbacks: 'default',
  output_config: { effort: 'xhigh', format: { type: 'json_schema', schema: WEEK_TEMPLATE_SCHEMA } },
  system: [
    { type: 'text', text: buildTrainingMethod(), cache_control: { type: 'ephemeral', ttl: '1h' } },
    { type: 'text', text: renderProfile(profile), cache_control: { type: 'ephemeral' } },
  ],
  messages: [{ role: 'user', content: buildMesocycleRequest({ method, constraints, conditions, cycle, checkinTrend, loadProgression, violations }) }],
}).finalMessage()
```

Tratamento do resultado, nesta ordem:
1. `stop_reason === 'refusal'` → `AgentRefusalError` (sem retry; o fallback já rodou no servidor).
2. `stop_reason === 'max_tokens'` → `IncompleteResponseError` (conta como tentativa).
3. `JSON.parse` + `validatePlanAgainstConstraints(sessions, constraints)` + `validateAgainstMethod(template, method)`.
4. Violações → nova tentativa com `violations` no pedido (máximo 2 tentativas no total, como hoje). Persistindo → `ConstraintsUnsatisfiableError`.

### Schema da semana-modelo

Item de exercício é um de:
- **principal**: `name` ∈ banco de exercícios, `sets`, `reps`, `weight`, `rirTarget`, `notes` (para o usuário) | null, `supersetGroup` | null
- **cardio**: `modality` ∈ `CARDIO_BANK`, `minutes`, `zone`, `notes` | null
- **aquecimento / volta-calma / mobilidade**: `name` livre, `region`, `sets: 1`, `reps` descritivo, `notes` | null

Cada sessão: `letter`, `kind`, `focus`, `exercises`. Raiz: `weekTemplate`, `rationale`, `decisions`.

### Bloco 1 — método (estável, cache 1 h): conteúdo obrigatório

- Papel: treinador do time Helux; usa o Perfil Integrado e a prescrição de método do pedido.
- A prescrição de método e as regras das condições são limites verificados por código; a IA escolhe exercícios, ordem, distribuição dos dias e explica.
- Genética: ajuste fino com traços de evidência forte/moderada; nunca motivo único de divisão, faixa ou exercício.
- Notas para o usuário: instrução de execução e o motivo voltado a ele; não citar datas de uso anterior, regras do sistema, nem o que foi evitado.
- Cardio e mobilidade: posicionar nos dias certos (cardio fora dos dias de perna pesada quando possível; mobilidade das regiões com condição após treinos de membros inferiores).
- Ciclo anterior: tratar cada achado (dor recorrente, estagnação, baixa aderência) e dizer nas decisões o que mudou.

## Avaliação (`treino.eval.ts`)

```ts
interface EvalResult { profile: string; scores: Record<Criterion, number>; violations: ConstraintViolation[]; costUsd: number }
type Criterion = 'seguranca' | 'objetivo' | 'frequencia-volume' | 'cardio-mobilidade' | 'justificativas' | 'genetica-proporcional' | 'notas-honestas' | 'ciclo'
```

Juiz: Opus 5.5, `effort: 'low'`, saída estruturada `{ scores, comments }`. Segurança = 0 se houver qualquer violação determinística.
