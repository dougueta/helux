# Data Model: App Mobile Helux (Phase 4)

**Branch**: `002-workouts-mobile` | **Date**: 2026-06-14

---

## Entidades de `packages/workouts`

Estas entidades residem em `packages/workouts/src/types.ts`. Estendem ou complementam os tipos existentes em `packages/types`.

### `Variant`

Variante de um exercício, ordenável por fit genético.

```ts
export interface Variant {
  id: string
  name: string
  equip: string                  // equipamento ex.: "Barra", "Halteres", "Polia"
  level: 'Iniciante' | 'Intermediário' | 'Avançado'
  match: number                  // fit genético 0..100
  rec?: boolean                  // true = recomendação do plano
  betterFit?: boolean            // true = fit maior que a recomendada
  motion: string                 // preset de animação (placeholder)
  implement: string              // tipo de implemento (placeholder)
  why: string                    // motivo em 1 linha
}
```

### `MuscleMap`

Grupos musculares usados no exercício para o mapa visual.

```ts
export interface MuscleMap {
  primary: string[]              // músculos primários (acento sólido no mapa)
  secondary: string[]            // músculos secundários (acento suave)
}
```

### `ActiveExercise`

Exercício com todos os dados necessários para o Treino Ativo e o Exercise Sheet.

```ts
export interface ActiveExercise {
  id: string
  name: string
  muscle: string                 // grupo muscular alvo ex.: "Peito"
  scheme: string                 // ex.: "4 × 6-8"
  rest: number                   // descanso em segundos
  match: number                  // fit genético 0..100
  tempo?: string                 // cadência ex.: "2 · 0 · 1"
  gene?: string                  // nota genética (opcional)
  muscles: MuscleMap
  cues: string[]                 // passos de execução numerados
  variants: Variant[]            // [0] = rec:true (recomendada do plano)
  suggestedSets: SuggestedSet[]  // sugestões do plano (peso, reps)
}
```

### `SuggestedSet`

Sugestão de carga/reps para uma série, vinda do plano ou da sessão anterior.

```ts
export interface SuggestedSet {
  prev: string    // valor anterior ex.: "60 kg × 8" (vazio se não há histórico)
  w: number       // peso sugerido em kg
  r: number       // reps sugeridas
}
```

### `SetState`

Estado mutável de uma série durante o treino ativo.

```ts
export interface SetState {
  w: number       // peso atual (pode ser editado pelo usuário)
  r: number       // reps atuais
  prev: string    // referência da sessão anterior (read-only)
  done: boolean   // série concluída
}
```

### `ActiveSession`

Estado completo de uma sessão de treino em andamento.

```ts
export interface ActiveSession {
  workoutId: string
  workoutName: string
  exercises: ActiveExercise[]
  sets: Record<string, SetState[]>      // keyed by exercise.id
  variantById: Record<string, string>   // exerciseId → variantId (vazio = recomendada)
  startedAt: number                     // timestamp Unix ms
}
```

**Invariantes**:
- `sets[exId].length >= exercises[i].suggestedSets.length` (pode ter séries extras)
- `variantById` não contém exercício cujo variant rec está ativo (omissão = recomendada)

### `WorkoutSummary`

Resultado de uma sessão concluída.

```ts
export interface WorkoutSummary {
  workoutId: string
  workoutName: string
  startedAt: number
  finishedAt: number
  durationMinutes: number
  totalSets: number
  totalVolumeKg: number          // soma de (w × r) de todas as séries concluídas
  newRecords: PersonalRecord[]
}

export interface PersonalRecord {
  exerciseName: string
  value: string                  // ex.: "62.5 kg × 8"
  delta: string                  // ex.: "+2.5"
}
```

---

## API de `packages/workouts`

Funções puras exportadas de `packages/workouts/src/index.ts`:

```ts
// Inicializa uma sessão a partir dos exercícios do dia
export function startSession(
  workoutId: string,
  workoutName: string,
  exercises: ActiveExercise[]
): ActiveSession

// Atualiza peso ou reps de uma série (sem marcar como concluída)
export function logSet(
  session: ActiveSession,
  exerciseId: string,
  setIndex: number,
  w: number,
  r: number
): ActiveSession

// Marca uma série como concluída
export function completeSet(
  session: ActiveSession,
  exerciseId: string,
  setIndex: number
): ActiveSession

// Troca a variante ativa de um exercício (preserva sets)
export function swapVariant(
  session: ActiveSession,
  exerciseId: string,
  variantId: string       // passar id da rec para reverter à recomendada
): ActiveSession

// Adiciona uma série extra ao exercício (clona a última)
export function addSet(
  session: ActiveSession,
  exerciseId: string
): ActiveSession

// Finaliza a sessão e calcula o resumo
export function finishSession(
  session: ActiveSession
): WorkoutSummary
```

**Contratos de imutabilidade**: Todas as funções retornam um novo objeto `ActiveSession` sem mutar o argumento. O app usa `useReducer` com essas funções como reducers.

---

## Entidades de UI (mock data shape)

Usadas em `apps/mobile/src/data/mock.ts` para as telas estáticas (Hoje, DNA, Treinos, Progresso).

### `UserProfile` (mock)

```ts
interface UserProfile {
  name: string
  firstName: string
  goal: string
  geneticScore: number    // índice Helux 0..100
  recovery: number        // % de recuperação do dia
  streak: number          // semanas consecutivas
  week: { done: number; target: number }
}
```

### `GeneticTrait` (mock)

```ts
interface GeneticTrait {
  key: string
  label: string
  value: string
  level: number           // 0..1 para barra de progresso
  gene: string            // marcador ex.: "ACTN3 (R/R)"
  tag?: string
  note: string
  warn?: boolean          // exibe cor de atenção
}
```

### `WorkoutListItem` (mock)

```ts
interface WorkoutListItem {
  id: string
  name: string
  focus: string
  duration: number        // minutos
  exercises: number
  match: number
  last: string            // ex.: "há 3 dias"
  today?: boolean         // destaque na lista
}
```

### `Program` (mock)

```ts
interface Program {
  name: string
  phase: string
  week: number
  weeks: number
  split: string
  match: number
}
```

### `ProgressData` (mock)

```ts
interface VolumePoint { w: string; v: number }
interface PersonalRecordItem { lift: string; value: string; delta: string; when: string; up: boolean }
interface SessionHistoryItem { name: string; date: string; volume: string; sets: number; dur: number }
interface StatItem { label: string; value: string; sub: string }

interface ProgressData {
  stats: StatItem[]
  volume: VolumePoint[]
  records: PersonalRecordItem[]
  history: SessionHistoryItem[]
}
```

---

## Fluxo de Estado — Treino Ativo

```
startSession(exercises) → ActiveSession (inicial)
    ↓ [useReducer actions]
logSet(session, exId, idx, w, r) → ActiveSession
completeSet(session, exId, idx) → ActiveSession
    ↓ [side effect: timer de descanso inicia]
swapVariant(session, exId, variantId) → ActiveSession
addSet(session, exId) → ActiveSession
    ↓
finishSession(session) → WorkoutSummary
    ↓ [side effect: salva no histórico]
```

---

## Persistência

| Chave AsyncStorage         | Tipo            | Propósito                              |
|----------------------------|-----------------|----------------------------------------|
| `helux:active-session`     | `ActiveSession` | Sessão em andamento (restaurar ao abrir)|
| `helux:workout-history`    | `WorkoutSummary[]` | Histórico de sessões concluídas     |

**Adapter em `packages/workouts/src/storage.ts`** (separado das funções puras):
```ts
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

export async function saveSession(session: ActiveSession, adapter: StorageAdapter): Promise<void>
export async function loadSession(adapter: StorageAdapter): Promise<ActiveSession | null>
export async function clearSession(adapter: StorageAdapter): Promise<void>
```

O adapter é injetado pelo app (`AsyncStorage`) e pode ser mockado nos testes.
