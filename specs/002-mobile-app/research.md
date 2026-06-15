# Research: App Mobile Helux (Phase 4)

**Branch**: `002-workouts-mobile` | **Date**: 2026-06-14 | **Spec**: [spec.md](spec.md)

## Decisão 1: Framework de Navegação

**Decision**: Expo Router (file-based routing) com estrutura Stack + Tabs

**Rationale**: Expo Router é o padrão recomendado pelo Expo SDK 52+. File-based routing elimina boilerplate de navigators manuais. A hierarquia `Stack > (tabs)/ > [telas de aba]` + `treino-ativo` como modal/Stack screen é a estrutura canônica para apps com fluxo tab + modal.

**Structure**:
```
app/
  _layout.tsx          # Root Stack (Stack.Navigator)
  (tabs)/
    _layout.tsx        # Bottom Tab navigator (4 abas)
    index.tsx          # Hoje
    treinos.tsx        # Treinos
    dna.tsx            # DNA
    progresso.tsx      # Progresso
  treino-ativo.tsx     # Modal stack screen (fora das abas)
```

**Alternatives considered**: React Navigation (manual config) — rejeitado por verbosidade com Expo SDK 52; React Navigation v7 é o que o Expo Router usa internamente de qualquer forma.

---

## Decisão 2: Animação do Exercise Sheet

**Decision**: `@gorhom/bottom-sheet` v5 (construído sobre React Native Reanimated 3)

**Rationale**: O design exige bottom sheet com 94% de altura, cantos 26px, animação suave (translateY 100%→0, 0.34s cubic-bezier) e backdrop com fade. Implementar manualmente com Reanimated 3 é possível mas arriscado em termos de consistência cross-platform. `@gorhom/bottom-sheet` é a solução padrão da comunidade Expo, suporta todos esses requisitos out-of-the-box, e é estável no Expo SDK 52.

**Alternatives considered**:
- Reanimated manual: mais controle, mais código, mais bugs de gesto — rejeitado pela complexidade desnecessária
- React Native Modal com translateY animado: não suporta snap points nem gesture-to-dismiss — rejeitado

---

## Decisão 3: Gerenciamento de Estado do Treino Ativo

**Decision**: `useReducer` local no componente `TreinoAtivoScreen`, com funções puras em `packages/workouts`

**Rationale**: O estado do treino ativo é local à tela e não precisa ser compartilhado com outras abas durante a sessão. `useReducer` + funções puras em `packages/workouts` é a combinação mais testável (funções puras) e mais simples (sem biblioteca externa de estado). A constituição exige Simplicity (V) — nenhum caso de uso atual justifica Zustand ou Redux.

**State shape**:
```ts
type ActiveSessionState = {
  exercises: ActiveExercise[]   // do mock/plano
  idx: number                   // exercício atual
  sets: Record<string, SetState[]>   // [exId][setIdx]
  variantById: Record<string, string> // variante ativa por exercício
  rest: { active: boolean; left: number; total: number }
  sheet: boolean                // sheet aberto
  finished: boolean
  startedAt: number             // timestamp ms
}
```

**Alternatives considered**: Zustand — rejeitado por YAGNI (constituição V); Context API — rejeitado por re-render desnecessário em steppers de alta frequência.

---

## Decisão 4: Estilização

**Decision**: `StyleSheet.create()` com arquivo de constantes de tema (`constants/theme.ts`)

**Rationale**: O projeto usa TypeScript sem NativeWind/Tailwind. Manter consistência com o padrão existente é mais importante que adotar uma solução nova. `StyleSheet.create()` tem otimização nativa (styles são serializados e enviados ao bridge uma vez). O arquivo `theme.ts` centraliza todos os design tokens do handoff.

**Alternatives considered**: NativeWind — rejeitado por inconsistência com o projeto e overhead de configuração; Styled Components — rejeitado por performance e YAGNI.

---

## Decisão 5: Fontes

**Decision**: `expo-font` + `@expo-google-fonts/space-grotesk` + `@expo-google-fonts/jetbrains-mono`

**Rationale**: Expo Font é a forma padrão de carregar fontes customizadas no Expo SDK 52. Os pacotes `@expo-google-fonts/*` encapsulam as fontes do Google sem necessidade de download manual. `useFonts` no `_layout.tsx` raiz bloqueia a renderização até as fontes carregarem (via `SplashScreen.preventAutoHideAsync()`).

**Alternatives considered**: Fontes locais (ttf bundled) — válido mas mais trabalho de manutenção.

---

## Decisão 6: Persistência de Sessão

**Decision**: `@react-native-async-storage/async-storage` com chave `helux:active-session`

**Rationale**: É a solução padrão para storage key-value no React Native/Expo. A sessão de treino é um objeto JSON serializável. `packages/workouts` expõe um adaptador de persistência (`saveSession`, `loadSession`) que abstrai o AsyncStorage, tornando a lógica de negócio independente da plataforma (e testável sem mock de AsyncStorage).

**Alternatives considered**: MMKV — mais rápido mas requer native module; para 1 usuário com objetos pequenos, AsyncStorage é suficiente.

---

## Decisão 7: TDD para `packages/workouts`

**Decision**: Vitest (consistente com o monorepo) + funções puras sem side effects

**Rationale**: A constituição exige TDD obrigatório (Princípio II). Vitest já é usado em `packages/types`, `packages/genetics`, `packages/ai` e `apps/api`. As funções de `packages/workouts` são puras (entrada → nova sessão imutável) e não dependem de plataforma, portanto testáveis diretamente com Vitest sem mocks de React Native.

**Persistence adapter**: separado das funções puras — testado com mock de AsyncStorage.

---

## Decisão 8: Dados Mock

**Decision**: Arquivo `apps/mobile/src/data/mock.ts` com dados traduzidos de `helux-data.jsx`

**Rationale**: Phase 4 usa dados locais. A integração com `apps/api` é Phase 5. Centralizar os mocks em um único arquivo facilita a troca por chamadas de API na Phase 5. Os dados seguem os tipos de `packages/workouts` (que estendem `packages/types`).

---

## Decisão 9: Tipos Novos vs. Existentes

**Decision**: Novos tipos de UI em `packages/workouts/src/types.ts`; tipos de sessão ativa são extensões dos tipos existentes em `packages/types`

**Rationale**: Os tipos existentes em `packages/types` (`WorkoutSession`, `PlannedExercise`, `GeneticProfile`) são adequados para o fluxo AI→Plan. A Phase 4 precisa de tipos mais ricos para UI interativa (`ActiveExercise` com variants, cues, muscles; `SetState` com done/prev; etc.). Esses tipos são específicos do pacote `workouts` e não devem ser expostos como tipos globais ainda.

**Existing types reused**: `GeneticProfile` (para a tela DNA, adaptado do mock), `WorkoutSession` (para histórico na tela Progresso).
