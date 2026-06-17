# API Contracts: Workout Plan Generation

**Base URL**: `http://localhost:3001`  
**Content-Type**: `application/json`

---

## POST /workout/generate

Gera o próximo plano de treino usando IA com base no perfil genético, histórico e recuperação.

### Request Body

```typescript
// Body: PlanInput (de @helux/types)
{
  "geneticProfile": {
    "metabolismo": "moderado",
    "recuperacaoMuscular": "media",
    "riscoCardiovascular": "medio",
    "predisposicao": "misto",
    "alertas": ["string", ...]
  },
  "constraints": {
    "maxWeeklyFrequency": 4,
    "preferredVolume": "medio",
    "restBetweenSets": "90-120s",
    "forbiddenExerciseTypes": ["pliometria de alto impacto"],
    "cardioIntensityLimit": "moderado"
  },
  "workoutHistory": [...],     // WorkoutSession[] — últimas N sessões
  "recoveryData": [...],       // RecoveryData[] — últimos N dias
  "userGoals": "string",
  "userLevel": "intermediario",
  "availableDaysPerWeek": 4
}
```

### Response 200 — Sucesso

```typescript
// Body: NextWorkoutPlan (de @helux/types)
{
  "generatedAt": "2026-06-13T10:00:00.000Z",
  "exercises": [
    {
      "name": "Supino Reto",
      "sets": 4,
      "reps": "8-10",
      "weight": "82.5kg",
      "notes": "Foco na contração; pausa de 1s no topo"
    }
  ],
  "rationale": "Com base no seu HRV de 45ms e recuperação cardíaca mais lenta (CHRM2), optei por volume moderado..."
}
```

### Response 500 — Erro de API

```json
{
  "error": "ANTHROPIC_API_KEY não configurada. Adicione a variável de ambiente antes de gerar planos."
}
```

```json
{
  "error": "Erro ao gerar plano: <mensagem da API>"
}
```

---

## GET /workout/latest-plan

Retorna o último plano de treino gerado, sem nova chamada à IA.

### Response 200 — Sucesso

```typescript
// Body: NextWorkoutPlan (mesmo formato do POST /workout/generate)
{
  "generatedAt": "2026-06-13T10:00:00.000Z",
  "exercises": [...],
  "rationale": "..."
}
```

### Response 404 — Nenhum plano gerado

```json
{
  "error": "Nenhum plano gerado ainda. Use POST /workout/generate para criar o primeiro plano."
}
```
