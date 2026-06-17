# Data Model: Geração de Plano de Treino por IA

**Nota**: Todas as entidades já estão definidas em `packages/types/src/`. Nenhum novo tipo precisa ser criado.

---

## Entidades Existentes (sem alteração)

### PlanInput — `packages/types/src/plan.ts`
Entrada para a geração do plano. Agrega todos os dados necessários para a IA.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `geneticProfile` | `GeneticProfile` | Perfil parseado da Genera |
| `constraints` | `WorkoutConstraints` | Restrições derivadas do perfil genético |
| `workoutHistory` | `WorkoutSession[]` | Últimas N sessões de treino |
| `recoveryData` | `RecoveryData[]` | Dados de recuperação dos últimos N dias |
| `userGoals` | `string` | Objetivos em linguagem livre |
| `userLevel` | `'iniciante' \| 'intermediario' \| 'avancado'` | Nível de experiência |
| `availableDaysPerWeek` | `number` | Dias disponíveis por semana |

### NextWorkoutPlan — `packages/types/src/plan.ts`
Saída gerada pela IA. Persistida em `data/workouts/latest-plan.json`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `generatedAt` | `string` | ISO 8601 timestamp da geração |
| `exercises` | `PlannedExercise[]` | Lista de exercícios prescritos |
| `rationale` | `string` | Justificativa em linguagem natural (PT-BR) |

### PlannedExercise — `packages/types/src/workout.ts`
Exercício individual dentro do plano gerado.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | `string` | Nome do exercício |
| `sets` | `number` | Número de séries |
| `reps` | `string` | Faixa de repetições (ex: "8-12") |
| `weight` | `string` | Carga sugerida (ex: "70kg" ou "+2.5kg") |
| `notes` | `string?` | Notas opcionais |

---

## Fluxo de Dados

```
PlanInput
  │
  ├─→ buildSystemPrompt(geneticProfile, constraints)
  │     → string (cacheado pela API)
  │
  └─→ buildUserPrompt(workoutHistory, recoveryData, userGoals, userLevel, availableDaysPerWeek)
        → string (variável por chamada)
  
Claude API (claude-sonnet-4-6)
  → response.content[0].text  (JSON string)
  → JSON.parse() → NextWorkoutPlan
  
  ├─→ writeFileSync(data/workouts/latest-plan.json)
  └─→ return NextWorkoutPlan
```

---

## Persistência

| Arquivo | Conteúdo | Gitignored |
|---------|----------|-----------|
| `data/workouts/latest-plan.json` | `NextWorkoutPlan` serializado | ✅ |

O arquivo é sobrescrito a cada geração. Não há histórico de planos no MVP.
