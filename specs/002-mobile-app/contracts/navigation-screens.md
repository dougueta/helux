# Navigation & Screen Contracts

**Feature**: App Mobile Helux (Phase 4)
**Date**: 2026-06-14

---

## Estrutura de Navegação

```
Root Stack (apps/mobile/app/_layout.tsx)
├── (tabs)/ — Bottom Tab Navigator (4 abas)
│   ├── index         → Tela Hoje
│   ├── treinos       → Tela Treinos
│   ├── dna           → Tela DNA
│   └── progresso     → Tela Progresso
└── treino-ativo      → Tela Treino Ativo (modal/stack, sem bottom tab)
```

---

## Contratos de Tela

### Tela: Hoje (`index`)

**Props de navegação**: nenhuma  
**Dados**: `UserProfile`, `WorkoutListItem` (hoje), `GeneticDriver[0]`  
**Ações**:
- Tocar no hero card ou CTA → navegar para `treino-ativo` (sem params, usa workout do dia)
- Tocar no card DNA → navegar para aba `dna`
- Tocar no streak → navegar para `progresso`

**Componentes principais**:
- `HeroCard` — treino do dia com MatchBadge e CTA
- `Ring` — recuperação do dia
- `WeekDots` — progresso semanal
- `GeneticInsightCard` — driver genético do dia

---

### Tela: Treinos (`treinos`)

**Props de navegação**: nenhuma  
**Dados**: `Program`, `WorkoutListItem[]`  
**Ações**:
- Tocar em play de qualquer treino → navegar para `treino-ativo` com `workoutId`

**Componentes principais**:
- `ProgramCard` — nome, fase, barra de progresso
- `WorkoutListItem` — linha de treino com MatchBadge, highlight "Hoje"

**Parâmetros de navegação saída**:
```ts
// para treino-ativo:
{ workoutId: string }
```

---

### Tela: DNA (`dna`)

**Props de navegação**: nenhuma  
**Dados**: `GeneticProfile` (mock: score, summary, traits[], drivers[])`  
**Ações**: nenhuma (tela informativa)

**Componentes principais**:
- `Ring` — índice Helux animado
- `GeneticTraitRow` — marcador com barra de nível e gene-fonte
- `DriverCard` — driver 2×2 grid

---

### Tela: Progresso (`progresso`)

**Props de navegação**: nenhuma  
**Dados**: `ProgressData` (mock)  
**Ações**: nenhuma (tela informativa)

**Componentes principais**:
- `StatGrid` — 2×2 de métricas
- `BarChart` — volume semanal
- `PersonalRecordRow` — recorde com delta
- `SessionHistoryRow` — linha de histórico

---

### Tela: Treino Ativo (`treino-ativo`)

**Props de navegação** (params):
```ts
// Parâmetro opcional — se ausente, usa workout do dia (mock)
{ workoutId?: string }
```

**Dados**: `ActiveSession` (inicializado por `startSession()`)  
**Estado local**: `ActiveSessionState` via `useReducer`  
**Ações**:
- Fechar → voltar para origem (tabs)
- Concluir série → `completeSet()` + iniciar timer de descanso
- Ajustar peso/reps → `logSet()`
- Adicionar série → `addSet()`
- Trocar exercício → navegar por `idx`
- Abrir sheet → abrir `ExerciseSheet` (bottom sheet)
- Finalizar → `finishSession()` → exibir `WorkoutCompletionOverlay`

**Sub-componentes**:
- `ExerciseProgressSegments` — barra de navegação no topo
- `ExerciseHeader` — músculo, MatchBadge, nome, esquema, nota genética
- `SetTable` — tabela de séries com `SetRow`
- `SetRow` — stepper kg + stepper reps + check
- `RestTimerBanner` — timer de descanso sobreposto
- `ExerciseSheet` — bottom sheet (ver abaixo)
- `WorkoutCompletionOverlay` — tela de conclusão

---

### Bottom Sheet: Exercise Sheet

**Trigger**: botão "Ver execução" no `ExerciseHeader`  
**Não é uma tela de navegação** — é um componente `BottomSheet` renderizado dentro de `treino-ativo`

**Props**:
```ts
interface ExerciseSheetProps {
  exercise: ActiveExercise
  activeVariantId: string | undefined  // undefined = recomendada
  onSelectVariant: (variantId: string) => void
  onClose: () => void
}
```

**Tabs internas**:

#### Aba "Execução"
- `ExerciseDemo` — player placeholder com animação SVG
- Lista numerada de cues
- `MuscleMapSVG` — silhueta com primários em accent e secundários em accent-soft
- Nota genética (se `exercise.gene` definida)

#### Aba "Variantes (n)"
- Lista de `VariantRow` ordenada por `match` decrescente
- Cada `VariantRow`: rádio + nome + flags + chips + motivo + número fit
- CTA "Usar esta variante" (só quando seleção ≠ ativa)
- CTA "Voltar à recomendada" (só quando variante não-rec está ativa)

---

## Design Tokens (fonte da verdade)

Centralizados em `apps/mobile/src/constants/theme.ts`:

```ts
export const colors = {
  bg: '#0A0C0A',
  surface1: '#161916',
  surface2: '#1E221D',
  surface3: '#272C25',
  hairline: 'rgba(255,255,255,0.07)',
  hairline2: 'rgba(255,255,255,0.11)',
  text: '#F0F3EA',
  textDim: '#A4AB9C',
  textFaint: '#6A7164',
  accent: '#C8FA4B',
  accentInk: '#0C1003',
  accentSoft: 'rgba(200,250,75,0.14)',
  accentLine: 'rgba(200,250,75,0.34)',
  accentGlow: 'rgba(200,250,75,0.30)',
  warn: '#F5B73E',
  danger: '#FF6F5E',
}

export const radii = {
  card: 20,
  sheet: 26,
  sm: 12,
  pill: 999,
}

export const fonts = {
  ui: 'SpaceGrotesk',
  mono: 'JetBrainsMono',
}
```

---

## Contrato de `packages/workouts`

API pública (ver data-model.md para tipos completos):

| Função | Entrada | Saída | Efeito |
|--------|---------|-------|--------|
| `startSession` | `workoutId, workoutName, exercises[]` | `ActiveSession` | Nenhum |
| `logSet` | `session, exId, idx, w, r` | `ActiveSession` | Nenhum |
| `completeSet` | `session, exId, idx` | `ActiveSession` | Nenhum |
| `swapVariant` | `session, exId, variantId` | `ActiveSession` | Nenhum |
| `addSet` | `session, exId` | `ActiveSession` | Nenhum |
| `finishSession` | `session` | `WorkoutSummary` | Nenhum |
| `saveSession` | `session, adapter` | `Promise<void>` | Escrita AsyncStorage |
| `loadSession` | `adapter` | `Promise<ActiveSession \| null>` | Leitura AsyncStorage |
| `clearSession` | `adapter` | `Promise<void>` | Delete AsyncStorage |
