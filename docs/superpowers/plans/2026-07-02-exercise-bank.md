# Banco de Exercícios + Instruções de Execução Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a geração 100% livre de exercícios por um catálogo curado versionado, para reduzir repetição/genericidade e exibir instruções de execução confiáveis na tela de treino ativo.

**Architecture:** Um array estático `EXERCISE_BANK` (packages/ai) vira a única fonte de exercícios que a IA pode escolher — injetado no system prompt junto com uma instrução de variedade que reaproveita o histórico já enviado. Depois que a IA responde, o planner faz lookup por nome exato no catálogo e anexa `cues` (dicas de execução) a cada exercício do plano antes de retornar. A UI web exibe essas `cues` num bloco colapsável.

**Tech Stack:** TypeScript, Vitest, React (Next.js App Router), Anthropic SDK — nenhuma dependência nova.

## Global Constraints

- TDD é inegociável neste monorepo (constituição): toda mudança de comportamento começa com um teste que falha.
- Extensões de tipo devem ser aditivas — `PlannedExercise.cues` é opcional, nada existente pode quebrar.
- O catálogo (`EXERCISE_BANK`) é dado do sistema, não de usuário — fica versionado em `packages/ai/src`, não no Supabase.
- Sem fotos/vídeos, sem substituição de exercício, sem filtro estrutural por `forbiddenExerciseTypes` neste MVP (ver spec, seção "Fora de Escopo").
- Commits frequentes, um por task concluída (ou por passo relevante), seguindo o padrão semântico já usado no repo (`feat(ai): ...`, `feat(types): ...`, `feat(web): ...`).

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `packages/types/src/workout.ts` | Modificar | Adiciona `cues?: string[]` a `PlannedExercise` |
| `packages/ai/src/exercise-bank.ts` | Criar | Catálogo estático `EXERCISE_BANK` + tipo `ExerciseBankEntry` |
| `packages/ai/src/__tests__/exercise-bank.test.ts` | Criar | Valida integridade estrutural do catálogo |
| `packages/ai/src/prompts.ts` | Modificar | `buildSystemPrompt` injeta catálogo + instrução de escolha restrita/variedade |
| `packages/ai/src/__tests__/planner.test.ts` | Modificar | Cobre injeção do catálogo e anexação de `cues` |
| `packages/ai/src/planner.ts` | Modificar | Após parsear resposta da IA, anexa `cues` via lookup no catálogo |
| `apps/web/src/components/workout/ActiveExercise.tsx` | Modificar | Bloco colapsável "Como executar" quando `cues` presente |
| `apps/web/src/__tests__/components/workout/ActiveExercise.test.tsx` | Criar | Cobre renderização condicional do bloco de cues |

---

### Task 1: Tipo compartilhado — `PlannedExercise.cues`

**Files:**
- Modify: `packages/types/src/workout.ts`

**Interfaces:**
- Produces: `PlannedExercise` com campo opcional `cues?: string[]`, usado pelas Tasks 3, 4 e 5.

- [ ] **Step 1: Adicionar o campo ao tipo**

Editar `packages/types/src/workout.ts` (arquivo completo após a mudança):

```ts
export interface ExerciseSet {
  name: string
  sets: Array<{ reps: number; weight: number; effort: number }>
}

export interface WorkoutSession {
  id: string
  date: string
  exercises: ExerciseSet[]
}

export interface PlannedExercise {
  name: string
  sets: number
  reps: string
  weight: string
  notes?: string
  cues?: string[]
}
```

- [ ] **Step 2: Rodar typecheck do pacote de tipos**

Run: `pnpm --filter @helux/types typecheck`
Expected: sem erros (campo opcional não quebra nenhum uso existente).

- [ ] **Step 3: Commit**

```bash
git add packages/types/src/workout.ts
git commit -m "feat(types): add optional cues field to PlannedExercise"
```

---

### Task 2: Catálogo de exercícios (`EXERCISE_BANK`)

**Files:**
- Create: `packages/ai/src/exercise-bank.ts`
- Test: `packages/ai/src/__tests__/exercise-bank.test.ts`

**Interfaces:**
- Produces: `ExerciseBankEntry` (interface) e `EXERCISE_BANK: ExerciseBankEntry[]`, consumidos pelas Tasks 3 e 4.

```ts
export interface ExerciseBankEntry {
  id: string
  name: string
  muscleGroup: string
  equipment: 'barra' | 'halteres' | 'maquina-cabo' | 'peso-corporal'
  pattern: string
  cues: string[]
}
```

- [ ] **Step 1: Escrever o teste que falha**

Criar `packages/ai/src/__tests__/exercise-bank.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { EXERCISE_BANK } from '../exercise-bank'

describe('EXERCISE_BANK', () => {
  it('tem pelo menos 100 exercícios', () => {
    expect(EXERCISE_BANK.length).toBeGreaterThanOrEqual(100)
  })

  it('todos os ids são únicos', () => {
    const ids = EXERCISE_BANK.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todos os names são únicos', () => {
    const names = EXERCISE_BANK.map((e) => e.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('toda entrada tem entre 3 e 5 cues não vazias', () => {
    for (const entry of EXERCISE_BANK) {
      expect(entry.cues.length).toBeGreaterThanOrEqual(3)
      expect(entry.cues.length).toBeLessThanOrEqual(5)
      for (const cue of entry.cues) {
        expect(cue.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('equipment é sempre um dos valores válidos', () => {
    const valid = ['barra', 'halteres', 'maquina-cabo', 'peso-corporal']
    for (const entry of EXERCISE_BANK) {
      expect(valid).toContain(entry.equipment)
    }
  })

  it('cobre todos os padrões de movimento principais', () => {
    const patterns = new Set(EXERCISE_BANK.map((e) => e.pattern))
    for (const p of ['agachar', 'dobrar-quadril', 'empurrar-horizontal', 'empurrar-vertical', 'puxar-horizontal', 'puxar-vertical', 'core', 'isolamento']) {
      expect(patterns).toContain(p)
    }
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `pnpm --filter @helux/ai test exercise-bank`
Expected: FAIL — `Cannot find module '../exercise-bank'`.

- [ ] **Step 3: Criar o catálogo**

Criar `packages/ai/src/exercise-bank.ts` com o conteúdo completo abaixo (103 exercícios):

```ts
export interface ExerciseBankEntry {
  id: string
  name: string
  muscleGroup: string
  equipment: 'barra' | 'halteres' | 'maquina-cabo' | 'peso-corporal'
  pattern: string
  cues: string[]
}

export const EXERCISE_BANK: ExerciseBankEntry[] = [
  // ---- agachar ----
  {
    id: 'agachamento-livre-barra',
    name: 'Agachamento Livre (Barra)',
    muscleGroup: 'quadriceps',
    equipment: 'barra',
    pattern: 'agachar',
    cues: [
      'Barra apoiada no trapézio, pés na largura dos ombros, ponta dos pés levemente para fora',
      'Desça controlando o quadril para trás e para baixo até o quadríceps ficar paralelo ao chão',
      'Mantenha o peito erguido e os joelhos alinhados com a direção dos pés',
      'Erro comum: deixar os joelhos colapsarem para dentro na subida',
    ],
  },
  {
    id: 'agachamento-frontal-barra',
    name: 'Agachamento Frontal (Barra)',
    muscleGroup: 'quadriceps',
    equipment: 'barra',
    pattern: 'agachar',
    cues: [
      'Barra apoiada nos deltoides anteriores, cotovelos altos e apontados para frente',
      'Tronco mais ereto que no agachamento tradicional, core bem contraído',
      'Desça mantendo os cotovelos para cima o tempo todo',
      'Erro comum: deixar os cotovelos caírem, o que derruba a barra para frente',
    ],
  },
  {
    id: 'agachamento-bulgaro-halteres',
    name: 'Agachamento Búlgaro (Halteres)',
    muscleGroup: 'quadriceps',
    equipment: 'halteres',
    pattern: 'agachar',
    cues: [
      'Pé de trás apoiado em um banco, tronco levemente inclinado à frente',
      'Desça na perna da frente até o joelho de trás quase tocar o chão',
      'Mantenha o peso majoritariamente na perna da frente, não na de trás',
      'Erro comum: dar um passo curto demais, sobrecarregando o joelho da frente',
    ],
  },
  {
    id: 'afundo-halteres',
    name: 'Afundo (Halteres)',
    muscleGroup: 'quadriceps',
    equipment: 'halteres',
    pattern: 'agachar',
    cues: [
      'Passo à frente controlado, tronco ereto, halteres ao lado do corpo',
      'Desça até os dois joelhos formarem aproximadamente 90 graus',
      'Empurre pelo calcanhar da frente para voltar à posição inicial',
      'Erro comum: deixar o joelho da frente ultrapassar muito a ponta do pé',
    ],
  },
  {
    id: 'agachamento-goblet-halteres',
    name: 'Agachamento Goblet (Halteres)',
    muscleGroup: 'quadriceps',
    equipment: 'halteres',
    pattern: 'agachar',
    cues: [
      'Segure um halter verticalmente junto ao peito, cotovelos apontando para baixo',
      'Pés um pouco mais abertos que a largura dos ombros',
      'Desça entre as pernas mantendo o tronco ereto',
      'Bom para aprender o padrão de agachamento antes de cargas maiores',
    ],
  },
  {
    id: 'leg-press-45',
    name: 'Leg Press 45°',
    muscleGroup: 'quadriceps',
    equipment: 'maquina-cabo',
    pattern: 'agachar',
    cues: [
      'Pés na plataforma na largura dos ombros, região lombar apoiada no encosto',
      'Desça até formar cerca de 90 graus no joelho, sem tirar a lombar do encosto',
      'Empurre sem travar os joelhos completamente no topo',
      'Erro comum: descer demais e arredondar a lombar para ganhar amplitude',
    ],
  },
  {
    id: 'cadeira-extensora',
    name: 'Cadeira Extensora',
    muscleGroup: 'quadriceps',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Costas apoiadas no encosto, joelhos alinhados com o eixo da máquina',
      'Estenda os joelhos até quase a extensão total, sem travar com força',
      'Desça controlando a fase excêntrica, sem soltar o peso',
      'Erro comum: usar impulso do tronco para ajudar o movimento',
    ],
  },
  {
    id: 'agachamento-sumo-halteres',
    name: 'Agachamento Sumô (Halteres)',
    muscleGroup: 'quadriceps',
    equipment: 'halteres',
    pattern: 'agachar',
    cues: [
      'Pés bem afastados, pontas viradas para fora, halter segurado entre as pernas',
      'Desça mantendo o tronco ereto e os joelhos na direção dos pés',
      'Foco em empurrar os joelhos para fora durante toda a descida',
      'Recruta mais adutores e glúteo que o agachamento tradicional',
    ],
  },
  {
    id: 'agachamento-livre-corporal',
    name: 'Agachamento Livre (Peso Corporal)',
    muscleGroup: 'quadriceps',
    equipment: 'peso-corporal',
    pattern: 'agachar',
    cues: [
      'Braços à frente para equilíbrio, pés na largura dos ombros',
      'Desça o mais fundo possível mantendo a lombar neutra',
      'Suba controlando a velocidade, sem usar embalo',
      'Bom para aquecimento ou treino sem equipamento',
    ],
  },
  {
    id: 'afundo-reverso-corporal',
    name: 'Afundo Reverso (Peso Corporal)',
    muscleGroup: 'quadriceps',
    equipment: 'peso-corporal',
    pattern: 'agachar',
    cues: [
      'Dê um passo para trás em vez de para frente, tronco ereto',
      'Desça até o joelho de trás quase tocar o chão',
      'Mais amigável ao joelho da frente do que o afundo tradicional',
      'Erro comum: perder o equilíbrio por dar um passo muito curto',
    ],
  },
  {
    id: 'agachamento-overhead-barra',
    name: 'Agachamento Overhead (Barra)',
    muscleGroup: 'quadriceps',
    equipment: 'barra',
    pattern: 'agachar',
    cues: [
      'Barra travada acima da cabeça com os braços estendidos antes de iniciar',
      'Desça mantendo a barra alinhada acima do meio do pé',
      'Exige mobilidade de ombro e tornozelo — use carga leve para dominar a técnica',
      'Erro comum: deixar a barra derivar para frente durante a descida',
    ],
  },
  {
    id: 'step-up-halteres',
    name: 'Step-up (Halteres)',
    muscleGroup: 'quadriceps',
    equipment: 'halteres',
    pattern: 'agachar',
    cues: [
      'Suba em um banco ou caixa com uma perna, halteres ao lado do corpo',
      'Empurre pelo calcanhar da perna de cima, evite impulsionar com a perna de baixo',
      'Desça controlado, sem deixar o pé de baixo bater no chão',
      'Erro comum: usar impulso da perna de trás para "ajudar" a subida',
    ],
  },
  {
    id: 'agachamento-hack-maquina',
    name: 'Agachamento Hack (Máquina)',
    muscleGroup: 'quadriceps',
    equipment: 'maquina-cabo',
    pattern: 'agachar',
    cues: [
      'Costas e ombros apoiados na máquina, pés à frente do corpo na plataforma',
      'Desça controlado até o quadríceps ficar paralelo, sem tirar as costas do apoio',
      'Empurre de forma uniforme com os dois pés',
      'Erro comum: posicionar os pés baixos demais na plataforma, sobrecarregando o joelho',
    ],
  },
  {
    id: 'pistol-squat-assistido',
    name: 'Pistol Squat Assistido',
    muscleGroup: 'quadriceps',
    equipment: 'peso-corporal',
    pattern: 'agachar',
    cues: [
      'Apoie-se em um suporte (TRX, batente de porta) para ajudar o equilíbrio',
      'Uma perna estendida à frente, desça na outra perna o mais fundo possível',
      'Mantenha o tronco ereto e o calcanhar da perna de apoio no chão',
      'Progressão avançada — usar o apoio para reduzir a carga conforme necessário',
    ],
  },
  {
    id: 'cadeira-adutora',
    name: 'Cadeira Adutora',
    muscleGroup: 'quadriceps',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Sente-se com as pernas apoiadas nas almofadas da máquina, afastadas',
      'Feche as pernas controladamente contra a resistência',
      'Evite usar impulso do quadril para completar o movimento',
      'Bom exercício acessório de estabilidade do quadril',
    ],
  },

  // ---- dobrar-quadril ----
  {
    id: 'levantamento-terra-barra',
    name: 'Levantamento Terra (Barra)',
    muscleGroup: 'posterior',
    equipment: 'barra',
    pattern: 'dobrar-quadril',
    cues: [
      'Barra próxima às canelas, pegada na largura dos ombros, costas retas',
      'Empurre o chão com os pés e estenda quadril e joelhos ao mesmo tempo',
      'Mantenha a barra colada ao corpo durante toda a subida',
      'Erro comum: arredondar a lombar para tirar a barra do chão',
    ],
  },
  {
    id: 'levantamento-terra-romeno-barra',
    name: 'Levantamento Terra Romeno (Barra)',
    muscleGroup: 'posterior',
    equipment: 'barra',
    pattern: 'dobrar-quadril',
    cues: [
      'Comece em pé, barra à frente das coxas, joelhos levemente flexionados',
      'Empurre o quadril para trás mantendo a barra colada às pernas',
      'Desça até sentir alongamento no posterior de coxa, sem arredondar as costas',
      'Erro comum: dobrar demais os joelhos, transformando em agachamento',
    ],
  },
  {
    id: 'levantamento-terra-romeno-halteres',
    name: 'Levantamento Terra Romeno (Halteres)',
    muscleGroup: 'posterior',
    equipment: 'halteres',
    pattern: 'dobrar-quadril',
    cues: [
      'Halteres à frente das coxas, joelhos levemente flexionados, tronco ereto',
      'Empurre o quadril para trás, descendo os halteres rente às pernas',
      'Sinta o alongamento no posterior de coxa antes de voltar à posição inicial',
      'Boa opção para quem não tem barra disponível',
    ],
  },
  {
    id: 'levantamento-terra-sumo-barra',
    name: 'Levantamento Terra Sumô (Barra)',
    muscleGroup: 'posterior',
    equipment: 'barra',
    pattern: 'dobrar-quadril',
    cues: [
      'Pés bem afastados, pontas para fora, pegada entre as pernas',
      'Tronco mais ereto que no terra convencional devido à postura das pernas',
      'Empurre os joelhos para fora enquanto estende o quadril',
      'Recruta mais quadríceps e adutores que a variação convencional',
    ],
  },
  {
    id: 'stiff-barra',
    name: 'Stiff (Barra)',
    muscleGroup: 'posterior',
    equipment: 'barra',
    pattern: 'dobrar-quadril',
    cues: [
      'Joelhos quase estendidos (não travados), barra rente às pernas',
      'Desça flexionando o quadril, mantendo a coluna neutra',
      'Pare quando sentir o limite de alongamento do posterior de coxa',
      'Erro comum: perder a curvatura natural da lombar na descida',
    ],
  },
  {
    id: 'stiff-halteres',
    name: 'Stiff (Halteres)',
    muscleGroup: 'posterior',
    equipment: 'halteres',
    pattern: 'dobrar-quadril',
    cues: [
      'Halteres à frente do corpo, joelhos quase estendidos',
      'Desça flexionando o quadril, mantendo a coluna neutra',
      'Suba estendendo o quadril, sem hiperextender no topo',
      'Alternativa útil quando a barra não está disponível',
    ],
  },
  {
    id: 'elevacao-pelvica-barra',
    name: 'Elevação Pélvica (Barra)',
    muscleGroup: 'gluteo',
    equipment: 'barra',
    pattern: 'dobrar-quadril',
    cues: [
      'Costas superiores apoiadas em um banco, barra sobre o quadril com almofada',
      'Empurre o quadril para cima contraindo o glúteo no topo',
      'Queixo levemente recolhido, evite hiperestender a lombar no topo',
      'Erro comum: usar impulso das pernas em vez de contração do glúteo',
    ],
  },
  {
    id: 'elevacao-pelvica-corporal',
    name: 'Elevação Pélvica (Peso Corporal)',
    muscleGroup: 'gluteo',
    equipment: 'peso-corporal',
    pattern: 'dobrar-quadril',
    cues: [
      'Deitado, joelhos flexionados, pés apoiados no chão',
      'Suba o quadril contraindo o glúteo, formando uma linha reta dos ombros aos joelhos',
      'Segure 1-2 segundos no topo antes de descer',
      'Boa opção de ativação de glúteo antes do treino de pernas',
    ],
  },
  {
    id: 'elevacao-pelvica-unilateral',
    name: 'Elevação Pélvica Unilateral (Peso Corporal)',
    muscleGroup: 'gluteo',
    equipment: 'peso-corporal',
    pattern: 'dobrar-quadril',
    cues: [
      'Mesma posição da elevação pélvica, mas uma perna estendida no ar',
      'Suba o quadril apoiando o peso em apenas uma perna',
      'Mantenha o quadril nivelado, sem deixar o lado livre cair',
      'Progressão mais exigente para quem já domina a versão bilateral',
    ],
  },
  {
    id: 'mesa-flexora',
    name: 'Mesa Flexora',
    muscleGroup: 'posterior',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Deitado de bruços, joelhos alinhados com o eixo da máquina',
      'Flexione os joelhos trazendo o rolo em direção ao glúteo',
      'Controle a descida, sem deixar o peso cair rápido',
      'Erro comum: elevar o quadril da mesa para "ajudar" o movimento',
    ],
  },
  {
    id: 'cadeira-flexora',
    name: 'Cadeira Flexora',
    muscleGroup: 'posterior',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Sentado, encosto ajustado para apoiar as coxas, joelhos alinhados ao eixo',
      'Flexione os joelhos puxando o rolo para baixo',
      'Retorne controlado até a extensão quase completa',
      'Boa opção para quem sente desconforto na versão deitada',
    ],
  },
  {
    id: 'good-morning-barra',
    name: 'Good Morning (Barra)',
    muscleGroup: 'posterior',
    equipment: 'barra',
    pattern: 'dobrar-quadril',
    cues: [
      'Barra apoiada no trapézio como no agachamento, joelhos levemente flexionados',
      'Incline o tronco à frente flexionando o quadril, mantendo a coluna neutra',
      'Desça até o limite confortável de alongamento do posterior',
      'Use carga bem mais leve que no agachamento — exercício técnico e exigente',
    ],
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    muscleGroup: 'gluteo',
    equipment: 'halteres',
    pattern: 'dobrar-quadril',
    cues: [
      'Pés na largura dos ombros, kettlebell à frente do corpo com os dois braços',
      'Gere a força pela extensão explosiva do quadril, não pelos braços',
      'O kettlebell sobe até a altura do peito por inércia do movimento do quadril',
      'Erro comum: agachar em vez de dobrar o quadril, tirando a ênfase do posterior/glúteo',
    ],
  },
  {
    id: 'hiperextensao-lombar-banco',
    name: 'Hiperextensão Lombar (Banco)',
    muscleGroup: 'posterior',
    equipment: 'peso-corporal',
    pattern: 'dobrar-quadril',
    cues: [
      'Quadril apoiado no banco romano, tornozelos travados no suporte',
      'Desça o tronco flexionando o quadril, mantendo a coluna neutra',
      'Suba até o corpo formar uma linha reta, sem hiperestender no topo',
      'Pode segurar peso no peito para progredir a dificuldade',
    ],
  },
  {
    id: 'terra-halteres-unilateral',
    name: 'Levantamento Terra com Halter Unilateral',
    muscleGroup: 'posterior',
    equipment: 'halteres',
    pattern: 'dobrar-quadril',
    cues: [
      'Apoiado em uma perna, halter na mão oposta à perna de apoio',
      'Incline o tronco à frente enquanto a perna livre se estende para trás',
      'Mantenha o quadril nivelado durante todo o movimento',
      'Ótimo para trabalhar equilíbrio e estabilidade unilateral do quadril',
    ],
  },

  // ---- empurrar-horizontal ----
  {
    id: 'supino-reto-barra',
    name: 'Supino Reto (Barra)',
    muscleGroup: 'peito',
    equipment: 'barra',
    pattern: 'empurrar-horizontal',
    cues: [
      'Escápulas retraídas e apoiadas no banco, pés firmes no chão',
      'Desça a barra controlada até tocar levemente o peito',
      'Empurre em linha reta para cima, sem "quicar" a barra no peito',
      'Erro comum: perder a retração escapular e deixar os ombros subirem',
    ],
  },
  {
    id: 'supino-reto-halteres',
    name: 'Supino Reto (Halteres)',
    muscleGroup: 'peito',
    equipment: 'halteres',
    pattern: 'empurrar-horizontal',
    cues: [
      'Halteres alinhados ao peito, cotovelos a cerca de 45-75° do tronco',
      'Desça controlado até sentir alongamento confortável no peito',
      'Empurre para cima sem bater os halteres um no outro',
      'Permite maior amplitude de movimento que a barra',
    ],
  },
  {
    id: 'supino-inclinado-barra',
    name: 'Supino Inclinado (Barra)',
    muscleGroup: 'peito',
    equipment: 'barra',
    pattern: 'empurrar-horizontal',
    cues: [
      'Banco inclinado 30-45°, barra desce em direção à parte superior do peito',
      'Escápulas retraídas, pés firmes no chão',
      'Ênfase maior na porção superior/clavicular do peitoral',
      'Erro comum: inclinar o banco além de 45°, transferindo carga para o ombro',
    ],
  },
  {
    id: 'supino-inclinado-halteres',
    name: 'Supino Inclinado (Halteres)',
    muscleGroup: 'peito',
    equipment: 'halteres',
    pattern: 'empurrar-horizontal',
    cues: [
      'Banco inclinado 30-45°, halteres alinhados à parte superior do peito',
      'Desça controlado sentindo alongamento no peitoral superior',
      'Empurre para cima em leve convergência no topo',
      'Boa alternativa quando a barra inclinada não está disponível',
    ],
  },
  {
    id: 'supino-declinado-barra',
    name: 'Supino Declinado (Barra)',
    muscleGroup: 'peito',
    equipment: 'barra',
    pattern: 'empurrar-horizontal',
    cues: [
      'Banco declinado, pernas travadas no suporte para estabilidade',
      'Barra desce em direção à porção inferior do peito',
      'Ênfase maior na porção inferior do peitoral',
      'Use trava de segurança ou auxílio de um parceiro por precaução',
    ],
  },
  {
    id: 'crucifixo-halteres',
    name: 'Crucifixo (Halteres)',
    muscleGroup: 'peito',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Deitado no banco reto, halteres acima do peito com cotovelos levemente flexionados',
      'Abra os braços em arco até sentir alongamento no peito',
      'Feche o movimento contraindo o peitoral, sem "juntar" os halteres com força excessiva',
      'Erro comum: estender totalmente os cotovelos, sobrecarregando a articulação',
    ],
  },
  {
    id: 'crucifixo-inclinado-halteres',
    name: 'Crucifixo Inclinado (Halteres)',
    muscleGroup: 'peito',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Banco inclinado 30°, halteres acima do peito com cotovelos levemente flexionados',
      'Abra os braços em arco controlado até o limite de alongamento confortável',
      'Ênfase na porção superior do peitoral',
      'Mantenha a mesma flexão de cotovelo do início ao fim do movimento',
    ],
  },
  {
    id: 'crossover-cabo',
    name: 'Crossover no Cabo',
    muscleGroup: 'peito',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Polias ajustadas acima da altura da cabeça, um pé à frente para estabilidade',
      'Traga as mãos para baixo e para o centro do corpo em arco',
      'Contraia o peitoral no ponto final do movimento',
      'Boa opção para finalizar o treino de peito com tensão constante',
    ],
  },
  {
    id: 'peck-deck-maquina',
    name: 'Peck Deck (Máquina)',
    muscleGroup: 'peito',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Costas apoiadas no encosto, cotovelos na altura dos ombros',
      'Feche os braços à frente do corpo contraindo o peitoral',
      'Controle a abertura de volta, sem deixar o peso cair',
      'Boa opção para isolar o peitoral com risco baixo de lesão no ombro',
    ],
  },
  {
    id: 'flexao-braco-corporal',
    name: 'Flexão de Braço (Peso Corporal)',
    muscleGroup: 'peito',
    equipment: 'peso-corporal',
    pattern: 'empurrar-horizontal',
    cues: [
      'Mãos um pouco mais abertas que os ombros, corpo alinhado da cabeça aos pés',
      'Desça até o peito quase tocar o chão, cotovelos a cerca de 45° do tronco',
      'Empurre de volta sem deixar o quadril cair ou subir',
      'Regule a dificuldade apoiando os joelhos, se necessário',
    ],
  },
  {
    id: 'flexao-declinada-corporal',
    name: 'Flexão Declinada (Peso Corporal)',
    muscleGroup: 'peito',
    equipment: 'peso-corporal',
    pattern: 'empurrar-horizontal',
    cues: [
      'Pés elevados em um banco ou caixa, mãos no chão na largura dos ombros',
      'Desça controlado mantendo o corpo alinhado',
      'Maior ênfase na porção superior do peitoral e ombro',
      'Mais exigente que a flexão tradicional — progrida gradualmente a altura dos pés',
    ],
  },
  {
    id: 'supino-maquina',
    name: 'Supino Máquina',
    muscleGroup: 'peito',
    equipment: 'maquina-cabo',
    pattern: 'empurrar-horizontal',
    cues: [
      'Ajuste o banco para que os apoios fiquem na altura do meio do peito',
      'Empurre à frente sem travar os cotovelos completamente',
      'Controle o retorno até sentir alongamento confortável',
      'Boa opção para treinar perto da falha com segurança',
    ],
  },
  {
    id: 'flexao-diamante-corporal',
    name: 'Flexão Diamante (Peso Corporal)',
    muscleGroup: 'triceps',
    equipment: 'peso-corporal',
    pattern: 'empurrar-horizontal',
    cues: [
      'Mãos próximas formando um "diamante" com os dedos abaixo do peito',
      'Cotovelos próximos ao tronco durante toda a descida',
      'Maior ênfase no tríceps que a flexão tradicional',
      'Erro comum: abrir os cotovelos, transferindo o esforço para o peito',
    ],
  },

  // ---- empurrar-vertical ----
  {
    id: 'desenvolvimento-militar-barra',
    name: 'Desenvolvimento Militar (Barra)',
    muscleGroup: 'ombro',
    equipment: 'barra',
    pattern: 'empurrar-vertical',
    cues: [
      'Barra na altura da clavícula, pés na largura dos ombros, core contraído',
      'Empurre a barra para cima em linha reta, cabeça se afasta levemente no caminho',
      'Trave os cotovelos no topo sem hiperestender a lombar',
      'Erro comum: arquear excessivamente a lombar para completar o movimento',
    ],
  },
  {
    id: 'desenvolvimento-halteres',
    name: 'Desenvolvimento com Halteres',
    muscleGroup: 'ombro',
    equipment: 'halteres',
    pattern: 'empurrar-vertical',
    cues: [
      'Halteres na altura dos ombros, cotovelos levemente à frente do corpo',
      'Empurre para cima até quase estender os cotovelos',
      'Desça controlado sem deixar os halteres caírem rápido demais',
      'Pode ser feito sentado para maior estabilidade lombar',
    ],
  },
  {
    id: 'desenvolvimento-arnold',
    name: 'Desenvolvimento Arnold',
    muscleGroup: 'ombro',
    equipment: 'halteres',
    pattern: 'empurrar-vertical',
    cues: [
      'Inicie com halteres à frente do corpo, palmas voltadas para você',
      'Rotacione os punhos enquanto empurra para cima, terminando com palmas para frente',
      'Movimento mais lento que o desenvolvimento tradicional devido à rotação',
      'Recruta as três porções do deltoide de forma mais completa',
    ],
  },
  {
    id: 'elevacao-lateral-halteres',
    name: 'Elevação Lateral (Halteres)',
    muscleGroup: 'ombro',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Halteres ao lado do corpo, leve flexão de cotovelo mantida fixa',
      'Eleve os braços lateralmente até a altura dos ombros',
      'Controle a descida, sem usar embalo do tronco',
      'Erro comum: elevar acima da linha dos ombros, sobrecarregando a articulação',
    ],
  },
  {
    id: 'elevacao-frontal-halteres',
    name: 'Elevação Frontal (Halteres)',
    muscleGroup: 'ombro',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Halteres à frente das coxas, pegada pronada',
      'Eleve um ou os dois braços à frente até a altura dos ombros',
      'Evite balançar o tronco para gerar impulso',
      'Foco na porção anterior do deltoide',
    ],
  },
  {
    id: 'elevacao-posterior-halteres',
    name: 'Elevação Posterior (Halteres)',
    muscleGroup: 'ombro',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Tronco inclinado à frente, halteres pendendo abaixo dos ombros',
      'Eleve os braços lateralmente contraindo a porção posterior do ombro',
      'Mantenha leve flexão de cotovelo durante todo o movimento',
      'Importante para equilibrar o desenvolvimento do ombro e a postura',
    ],
  },
  {
    id: 'desenvolvimento-maquina',
    name: 'Desenvolvimento Máquina',
    muscleGroup: 'ombro',
    equipment: 'maquina-cabo',
    pattern: 'empurrar-vertical',
    cues: [
      'Ajuste o banco para que os apoios fiquem na altura dos ombros',
      'Empurre para cima sem travar os cotovelos com força',
      'Controle o retorno até a posição inicial',
      'Boa opção para treinar ombro com trajetória guiada e mais segurança',
    ],
  },
  {
    id: 'elevacao-lateral-cabo',
    name: 'Elevação Lateral no Cabo',
    muscleGroup: 'ombro',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Polia baixa, cabo passando por trás do corpo até a mão oposta',
      'Eleve o braço lateralmente mantendo tensão constante do cabo',
      'A tensão constante do cabo é uma vantagem sobre o halter no início do movimento',
      'Controle a descida sem deixar o peso puxar o braço rápido demais',
    ],
  },
  {
    id: 'face-pull-cabo',
    name: 'Face Pull (Cabo)',
    muscleGroup: 'ombro',
    equipment: 'maquina-cabo',
    pattern: 'puxar-horizontal',
    cues: [
      'Polia alta com corda, puxe em direção ao rosto separando as mãos',
      'Cotovelos altos, foco em rotação externa do ombro no final do movimento',
      'Excelente para saúde do ombro e postura — pode ser usado como aquecimento',
      'Controle o retorno, sem deixar o peso puxar os braços de volta rápido',
    ],
  },
  {
    id: 'flexao-pike-corporal',
    name: 'Flexão Pike (Peso Corporal)',
    muscleGroup: 'ombro',
    equipment: 'peso-corporal',
    pattern: 'empurrar-vertical',
    cues: [
      'Quadril elevado formando um "V" invertido, mãos no chão na largura dos ombros',
      'Desça a cabeça em direção ao chão flexionando os cotovelos',
      'Empurre de volta mantendo o quadril elevado',
      'Boa progressão para o desenvolvimento vertical sem equipamento',
    ],
  },
  {
    id: 'encolhimento-ombros-halteres',
    name: 'Encolhimento de Ombros (Halteres)',
    muscleGroup: 'costas',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Halteres ao lado do corpo, braços estendidos e relaxados',
      'Eleve os ombros em direção às orelhas, sem rotacioná-los',
      'Segure brevemente no topo antes de descer controlado',
      'Foco no trapézio superior — evite usar os braços para "ajudar"',
    ],
  },
  {
    id: 'handstand-pushup-assistido',
    name: 'Handstand Push-up Assistido',
    muscleGroup: 'ombro',
    equipment: 'peso-corporal',
    pattern: 'empurrar-vertical',
    cues: [
      'Pés apoiados na parede, corpo em posição invertida, mãos no chão',
      'Desça a cabeça em direção ao chão controlando o movimento',
      'Empurre de volta até quase estender os cotovelos',
      'Exercício avançado — dominar a flexão pike antes de progredir para este',
    ],
  },
  {
    id: 'encolhimento-barra',
    name: 'Encolhimento com Barra',
    muscleGroup: 'costas',
    equipment: 'barra',
    pattern: 'isolamento',
    cues: [
      'Barra à frente do corpo, pegada na largura dos ombros',
      'Eleve os ombros verticalmente em direção às orelhas',
      'Evite girar os ombros para trás no topo do movimento',
      'Segure a contração por 1 segundo antes de descer controlado',
    ],
  },

  // ---- puxar-horizontal ----
  {
    id: 'remada-curvada-barra',
    name: 'Remada Curvada (Barra)',
    muscleGroup: 'costas',
    equipment: 'barra',
    pattern: 'puxar-horizontal',
    cues: [
      'Tronco inclinado cerca de 45°, joelhos levemente flexionados, coluna neutra',
      'Puxe a barra em direção ao abdômen, cotovelos próximos ao corpo',
      'Contraia as escápulas no topo do movimento',
      'Erro comum: usar embalo do tronco para puxar a barra (efeito pêndulo)',
    ],
  },
  {
    id: 'remada-curvada-halteres',
    name: 'Remada Curvada (Halteres)',
    muscleGroup: 'costas',
    equipment: 'halteres',
    pattern: 'puxar-horizontal',
    cues: [
      'Tronco inclinado à frente, halteres pendendo abaixo dos ombros',
      'Puxe os halteres em direção à cintura, cotovelos próximos ao tronco',
      'Contraia as escápulas no topo antes de descer controlado',
      'Permite maior amplitude que a versão com barra',
    ],
  },
  {
    id: 'remada-unilateral-halteres',
    name: 'Remada Unilateral (Halteres)',
    muscleGroup: 'costas',
    equipment: 'halteres',
    pattern: 'puxar-horizontal',
    cues: [
      'Um joelho e uma mão apoiados no banco, tronco paralelo ao chão',
      'Puxe o halter em direção à cintura mantendo o tronco estável',
      'Evite rotacionar o tronco para ajudar o movimento',
      'Boa opção para corrigir desequilíbrios entre os lados',
    ],
  },
  {
    id: 'remada-cavalinho-barra',
    name: 'Remada Cavalinho (Barra)',
    muscleGroup: 'costas',
    equipment: 'barra',
    pattern: 'puxar-horizontal',
    cues: [
      'Barra T ou barra apoiada entre as pernas, tronco inclinado à frente',
      'Puxe a barra em direção ao abdômen mantendo a coluna neutra',
      'Contraia as escápulas no topo do movimento',
      'Boa opção para sobrecarregar a espessura das costas',
    ],
  },
  {
    id: 'remada-baixa-cabo',
    name: 'Remada Baixa (Cabo)',
    muscleGroup: 'costas',
    equipment: 'maquina-cabo',
    pattern: 'puxar-horizontal',
    cues: [
      'Sentado, pés apoiados na plataforma, tronco ereto',
      'Puxe o triângulo ou barra em direção ao abdômen, cotovelos próximos ao corpo',
      'Contraia as escápulas antes de estender os braços de volta controlado',
      'Erro comum: balançar o tronco para trás para ajudar a puxada',
    ],
  },
  {
    id: 'remada-maquina',
    name: 'Remada Máquina',
    muscleGroup: 'costas',
    equipment: 'maquina-cabo',
    pattern: 'puxar-horizontal',
    cues: [
      'Peito apoiado no encosto (se disponível), pegada nas alças',
      'Puxe em direção ao corpo contraindo as escápulas',
      'Controle o retorno até sentir alongamento nas costas',
      'Boa opção para isolar as costas sem exigir estabilização lombar',
    ],
  },
  {
    id: 'remada-invertida-corporal',
    name: 'Remada Invertida (Peso Corporal)',
    muscleGroup: 'costas',
    equipment: 'peso-corporal',
    pattern: 'puxar-horizontal',
    cues: [
      'Barra fixa numa altura baixa, corpo suspenso por baixo com os calcanhares no chão',
      'Puxe o peito em direção à barra mantendo o corpo reto',
      'Ajuste a dificuldade elevando ou abaixando os pés',
      'Boa alternativa de puxada horizontal sem equipamento de academia',
    ],
  },
  {
    id: 'remada-t-barra',
    name: 'Remada em T (Barra)',
    muscleGroup: 'costas',
    equipment: 'barra',
    pattern: 'puxar-horizontal',
    cues: [
      'Uma ponta da barra fixada no chão ou canto, tronco inclinado à frente',
      'Puxe a outra ponta em direção ao peito/abdômen com as duas mãos',
      'Mantenha a coluna neutra durante todo o movimento',
      'Boa opção quando não há acesso a máquina de remada dedicada',
    ],
  },
  {
    id: 'remada-alta-barra',
    name: 'Remada Alta (Barra)',
    muscleGroup: 'ombro',
    equipment: 'barra',
    pattern: 'puxar-horizontal',
    cues: [
      'Barra à frente do corpo, pegada um pouco mais estreita que os ombros',
      'Puxe a barra verticalmente até a altura do peito, cotovelos guiando o movimento',
      'Mantenha a barra próxima ao corpo durante toda a subida',
      'Reduza a amplitude se sentir desconforto no ombro',
    ],
  },

  // ---- puxar-vertical ----
  {
    id: 'barra-fixa-corporal',
    name: 'Barra Fixa (Peso Corporal)',
    muscleGroup: 'costas',
    equipment: 'peso-corporal',
    pattern: 'puxar-vertical',
    cues: [
      'Pegada pronada, um pouco mais aberta que a largura dos ombros',
      'Puxe o corpo até o queixo passar da barra, sem balançar as pernas',
      'Desça controlado até os braços quase estenderem totalmente',
      'Use elástico de assistência ou máquina assistida se necessário',
    ],
  },
  {
    id: 'barra-fixa-supinada-corporal',
    name: 'Barra Fixa Supinada (Peso Corporal)',
    muscleGroup: 'costas',
    equipment: 'peso-corporal',
    pattern: 'puxar-vertical',
    cues: [
      'Pegada supinada (palmas voltadas para você), mãos na largura dos ombros',
      'Puxe o corpo para cima levando o peito em direção à barra',
      'Maior participação do bíceps que a pegada pronada',
      'Desça controlado até a extensão quase completa dos braços',
    ],
  },
  {
    id: 'puxada-alta-cabo',
    name: 'Puxada Alta (Cabo)',
    muscleGroup: 'costas',
    equipment: 'maquina-cabo',
    pattern: 'puxar-vertical',
    cues: [
      'Sentado, coxas travadas sob o apoio, pegada pronada mais aberta que os ombros',
      'Puxe a barra em direção à parte superior do peito, cotovelos para baixo e para trás',
      'Evite jogar o tronco para trás para ajudar a puxada',
      'Controle o retorno até os braços quase estenderem totalmente',
    ],
  },
  {
    id: 'puxada-alta-fechada-cabo',
    name: 'Puxada Alta Pegada Fechada (Cabo)',
    muscleGroup: 'costas',
    equipment: 'maquina-cabo',
    pattern: 'puxar-vertical',
    cues: [
      'Pegada triângulo ou mãos próximas, palmas voltadas uma para a outra',
      'Puxe em direção à parte superior do peito, cotovelos próximos ao corpo',
      'Maior amplitude de movimento que a pegada aberta',
      'Boa opção para quem sente desconforto no ombro na pegada aberta',
    ],
  },
  {
    id: 'puxada-alta-neutra-cabo',
    name: 'Puxada Alta Neutra (Cabo)',
    muscleGroup: 'costas',
    equipment: 'maquina-cabo',
    pattern: 'puxar-vertical',
    cues: [
      'Barra com pegadas neutras (paralelas), mãos na largura dos ombros',
      'Puxe em direção ao peito superior mantendo os punhos neutros',
      'Reduz o estresse no punho e cotovelo comparado à pegada pronada',
      'Contraia as escápulas antes de puxar com os braços',
    ],
  },
  {
    id: 'pulldown-assistido-maquina',
    name: 'Pulldown Assistido (Máquina)',
    muscleGroup: 'costas',
    equipment: 'maquina-cabo',
    pattern: 'puxar-vertical',
    cues: [
      'Ajuste a máquina para o nível de assistência adequado ao seu nível',
      'Puxe o corpo para cima simulando o movimento da barra fixa',
      'Foco em levar o peito à barra em vez de só dobrar os braços',
      'Boa progressão até conseguir fazer barra fixa sem assistência',
    ],
  },

  // ---- core ----
  {
    id: 'prancha-abdominal-corporal',
    name: 'Prancha Abdominal (Peso Corporal)',
    muscleGroup: 'core',
    equipment: 'peso-corporal',
    pattern: 'core',
    cues: [
      'Antebraços e pontas dos pés no chão, corpo formando uma linha reta',
      'Contraia o abdômen e o glúteo para evitar que o quadril caia',
      'Respire normalmente durante toda a sustentação',
      'Erro comum: deixar o quadril subir demais ou cair, perdendo o alinhamento',
    ],
  },
  {
    id: 'prancha-lateral-corporal',
    name: 'Prancha Lateral (Peso Corporal)',
    muscleGroup: 'core',
    equipment: 'peso-corporal',
    pattern: 'core',
    cues: [
      'Apoio em um antebraço e na lateral dos pés, corpo alinhado',
      'Eleve o quadril até formar uma linha reta da cabeça aos pés',
      'Mantenha o quadril estável, sem rotacionar para frente ou para trás',
      'Trabalha principalmente os oblíquos e estabilizadores laterais',
    ],
  },
  {
    id: 'abdominal-supra-corporal',
    name: 'Abdominal Supra (Peso Corporal)',
    muscleGroup: 'core',
    equipment: 'peso-corporal',
    pattern: 'core',
    cues: [
      'Deitado, joelhos flexionados, mãos leves atrás da cabeça ou cruzadas no peito',
      'Eleve a parte superior do tronco contraindo o abdômen, sem puxar o pescoço',
      'Desça controlado sem relaxar completamente entre repetições',
      'Foco em curvar a coluna, não apenas levantar os ombros',
    ],
  },
  {
    id: 'abdominal-infra-corporal',
    name: 'Abdominal Infra (Peso Corporal)',
    muscleGroup: 'core',
    equipment: 'peso-corporal',
    pattern: 'core',
    cues: [
      'Deitado, mãos ao lado do corpo ou sob a lombar para apoio',
      'Eleve as pernas contraindo a porção inferior do abdômen',
      'Evite usar embalo das pernas para gerar o movimento',
      'Controle a descida sem deixar as pernas caírem livremente',
    ],
  },
  {
    id: 'elevacao-pernas-barra',
    name: 'Elevação de Pernas na Barra',
    muscleGroup: 'core',
    equipment: 'peso-corporal',
    pattern: 'core',
    cues: [
      'Suspenso na barra fixa, braços estendidos e core ativado',
      'Eleve as pernas (estendidas ou flexionadas) até a altura do quadril ou mais',
      'Evite balançar o corpo para gerar impulso',
      'Reduza a amplitude (joelhos flexionados) se a versão com pernas estendidas for muito difícil',
    ],
  },
  {
    id: 'roda-abdominal',
    name: 'Roda Abdominal (Ab Wheel)',
    muscleGroup: 'core',
    equipment: 'peso-corporal',
    pattern: 'core',
    cues: [
      'Ajoelhado, mãos na roda à frente do corpo',
      'Role a roda para frente mantendo o core contraído e a lombar neutra',
      'Vá até onde conseguir manter o controle, sem deixar a lombar ceder',
      'Exercício avançado — comece com amplitude reduzida',
    ],
  },
  {
    id: 'prancha-rotacao',
    name: 'Prancha com Rotação',
    muscleGroup: 'core',
    equipment: 'peso-corporal',
    pattern: 'core',
    cues: [
      'Comece na posição de prancha alta (mãos estendidas)',
      'Rotacione o tronco elevando um braço em direção ao teto',
      'Mantenha o quadril estável durante a rotação',
      'Alterne os lados mantendo o ritmo controlado',
    ],
  },
  {
    id: 'abdominal-polia-cabo',
    name: 'Abdominal na Polia (Cabo)',
    muscleGroup: 'core',
    equipment: 'maquina-cabo',
    pattern: 'core',
    cues: [
      'Ajoelhado de frente para a polia alta, corda segura próxima à cabeça',
      'Flexione o tronco contraindo o abdômen, levando os cotovelos em direção aos joelhos',
      'Evite puxar apenas com os braços — o movimento vem da flexão do tronco',
      'Controle o retorno sem deixar o peso puxar o tronco de volta',
    ],
  },
  {
    id: 'rotacao-tronco-cabo',
    name: 'Rotação de Tronco no Cabo',
    muscleGroup: 'core',
    equipment: 'maquina-cabo',
    pattern: 'core',
    cues: [
      'Polia na altura do peito, braços estendidos segurando a alça',
      'Rotacione o tronco de um lado para o outro mantendo o quadril fixo',
      'O movimento vem da rotação do tronco, não dos braços',
      'Controle a volta à posição inicial de forma constante',
    ],
  },
  {
    id: 'dead-bug-corporal',
    name: 'Dead Bug (Peso Corporal)',
    muscleGroup: 'core',
    equipment: 'peso-corporal',
    pattern: 'core',
    cues: [
      'Deitado, braços estendidos para cima, joelhos flexionados a 90°',
      'Estenda um braço e a perna oposta simultaneamente, sem deixar a lombar arquear',
      'Retorne à posição inicial e alterne o lado',
      'Excelente para ensinar estabilidade de core sem sobrecarregar a lombar',
    ],
  },
  {
    id: 'pallof-press-cabo',
    name: 'Pallof Press (Cabo)',
    muscleGroup: 'core',
    equipment: 'maquina-cabo',
    pattern: 'core',
    cues: [
      'De lado para a polia, cabo segurado com as duas mãos à altura do peito',
      'Estenda os braços à frente resistindo à rotação que o cabo tenta causar',
      'Mantenha o quadril e os ombros alinhados, sem girar o tronco',
      'Excelente para estabilidade anti-rotação do core',
    ],
  },
  {
    id: 'prancha-toque-ombro-corporal',
    name: 'Prancha Alta com Toque no Ombro',
    muscleGroup: 'core',
    equipment: 'peso-corporal',
    pattern: 'core',
    cues: [
      'Posição de prancha alta, mãos abaixo dos ombros',
      'Toque o ombro oposto com uma mão, alternando os lados',
      'Mantenha o quadril o mais estável possível, evitando balançar',
      'Reduza a velocidade se notar rotação excessiva do quadril',
    ],
  },

  // ---- isolamento (braços, panturrilha, glúteo acessório) ----
  {
    id: 'rosca-direta-barra',
    name: 'Rosca Direta (Barra)',
    muscleGroup: 'biceps',
    equipment: 'barra',
    pattern: 'isolamento',
    cues: [
      'Pegada supinada, cotovelos fixos ao lado do tronco',
      'Flexione os cotovelos elevando a barra até a altura do ombro',
      'Desça controlado sem balançar o tronco para gerar impulso',
      'Erro comum: usar o quadril para "arremessar" a barra para cima',
    ],
  },
  {
    id: 'rosca-direta-halteres',
    name: 'Rosca Direta (Halteres)',
    muscleGroup: 'biceps',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Halteres ao lado do corpo, palmas voltadas para frente',
      'Flexione os cotovelos elevando os halteres simultaneamente ou alternado',
      'Mantenha os cotovelos fixos próximos ao tronco',
      'Controle a descida até a extensão quase completa',
    ],
  },
  {
    id: 'rosca-alternada-halteres',
    name: 'Rosca Alternada (Halteres)',
    muscleGroup: 'biceps',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Halteres ao lado do corpo, alterne a flexão de um braço por vez',
      'Gire levemente o punho para supinação conforme sobe',
      'Mantenha o cotovelo fixo durante toda a repetição',
      'Permite focar mais atenção em cada braço individualmente',
    ],
  },
  {
    id: 'rosca-martelo-halteres',
    name: 'Rosca Martelo (Halteres)',
    muscleGroup: 'biceps',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Halteres com pegada neutra (palmas uma de frente para a outra)',
      'Flexione os cotovelos mantendo a pegada neutra durante todo o movimento',
      'Recruta também o braquial e o antebraço além do bíceps',
      'Mantenha os cotovelos fixos ao lado do tronco',
    ],
  },
  {
    id: 'rosca-scott-barra',
    name: 'Rosca Scott (Barra)',
    muscleGroup: 'biceps',
    equipment: 'barra',
    pattern: 'isolamento',
    cues: [
      'Braços apoiados no banco Scott, axilas próximas à borda superior',
      'Flexione os cotovelos sem levantar os braços do apoio',
      'Desça até quase a extensão completa, controlando a fase excêntrica',
      'Elimina o balanço do tronco, isolando bem o bíceps',
    ],
  },
  {
    id: 'rosca-cabo',
    name: 'Rosca no Cabo',
    muscleGroup: 'biceps',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Polia baixa, pegada supinada na barra ou corda',
      'Flexione os cotovelos mantendo tensão constante do cabo',
      'A tensão constante do cabo diferencia do halter/barra livre',
      'Controle o retorno sem deixar o peso puxar os braços de volta rápido',
    ],
  },
  {
    id: 'rosca-21-barra',
    name: 'Rosca 21 (Barra)',
    muscleGroup: 'biceps',
    equipment: 'barra',
    pattern: 'isolamento',
    cues: [
      '7 repetições na metade inferior do movimento, 7 na metade superior, 7 na amplitude completa',
      'Mantenha os cotovelos fixos ao lado do tronco durante toda a série',
      'Use carga mais leve que na rosca tradicional devido ao volume acumulado',
      'Boa técnica de intensificação para finalizar o treino de bíceps',
    ],
  },
  {
    id: 'triceps-testa-barra',
    name: 'Tríceps Testa (Barra)',
    muscleGroup: 'triceps',
    equipment: 'barra',
    pattern: 'isolamento',
    cues: [
      'Deitado, barra acima do peito com os braços estendidos',
      'Flexione apenas os cotovelos, descendo a barra em direção à testa',
      'Mantenha os cotovelos apontando para cima, sem abrir para os lados',
      'Erro comum: mover os ombros durante o exercício em vez de isolar o cotovelo',
    ],
  },
  {
    id: 'triceps-testa-halteres',
    name: 'Tríceps Testa (Halteres)',
    muscleGroup: 'triceps',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Deitado, halteres acima do peito com os braços estendidos',
      'Flexione os cotovelos descendo os halteres ao lado da cabeça',
      'Mantenha os cotovelos fixos apontando para cima',
      'Permite trajetória levemente mais natural que a barra reta',
    ],
  },
  {
    id: 'triceps-corda-cabo',
    name: 'Tríceps Corda (Cabo)',
    muscleGroup: 'triceps',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Polia alta, corda segurada com as duas mãos, cotovelos fixos ao lado do tronco',
      'Estenda os cotovelos empurrando a corda para baixo',
      'Separe as pontas da corda no final do movimento para maior contração',
      'Evite mover os cotovelos para frente durante a extensão',
    ],
  },
  {
    id: 'triceps-frances-halteres',
    name: 'Tríceps Francês (Halteres)',
    muscleGroup: 'triceps',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Em pé ou sentado, halter segurado acima da cabeça com as duas mãos',
      'Desça o halter atrás da cabeça flexionando apenas os cotovelos',
      'Mantenha os cotovelos apontando para frente, próximos à cabeça',
      'Erro comum: abrir os cotovelos para os lados durante a descida',
    ],
  },
  {
    id: 'mergulho-banco-corporal',
    name: 'Mergulho no Banco (Peso Corporal)',
    muscleGroup: 'triceps',
    equipment: 'peso-corporal',
    pattern: 'isolamento',
    cues: [
      'Mãos apoiadas na borda de um banco atrás do corpo, pernas estendidas à frente',
      'Desça flexionando os cotovelos até cerca de 90°',
      'Empurre de volta usando o tríceps, sem afastar os ombros das orelhas',
      'Aumente a dificuldade elevando os pés em outro banco',
    ],
  },
  {
    id: 'paralelas-corporal',
    name: 'Paralelas (Peso Corporal)',
    muscleGroup: 'triceps',
    equipment: 'peso-corporal',
    pattern: 'isolamento',
    cues: [
      'Corpo suspenso entre as barras paralelas, braços estendidos',
      'Desça flexionando os cotovelos, tronco levemente inclinado à frente',
      'Empurre de volta até quase estender totalmente os cotovelos',
      'Incline mais o tronco para envolver mais o peito, mais ereto para focar tríceps',
    ],
  },
  {
    id: 'elevacao-panturrilha-pe-maquina',
    name: 'Elevação de Panturrilha em Pé (Máquina)',
    muscleGroup: 'panturrilha',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Ombros sob o apoio, ponta dos pés na plataforma, calcanhares livres',
      'Eleve os calcanhares o máximo possível, contraindo a panturrilha',
      'Desça até sentir alongamento completo antes da próxima repetição',
      'Controle o movimento — evitar "quicar" no fundo da amplitude',
    ],
  },
  {
    id: 'elevacao-panturrilha-sentado-maquina',
    name: 'Elevação de Panturrilha Sentado (Máquina)',
    muscleGroup: 'panturrilha',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Sentado, joelhos sob o apoio, ponta dos pés na plataforma',
      'Eleve os calcanhares contraindo a panturrilha',
      'Com o joelho flexionado, a ênfase recai mais sobre o sóleo',
      'Desça controlado até o alongamento completo',
    ],
  },
  {
    id: 'elevacao-panturrilha-corporal',
    name: 'Elevação de Panturrilha (Peso Corporal)',
    muscleGroup: 'panturrilha',
    equipment: 'peso-corporal',
    pattern: 'isolamento',
    cues: [
      'Em pé, ponta dos pés em uma superfície elevada (degrau), calcanhares livres',
      'Eleve os calcanhares o máximo possível',
      'Desça até sentir alongamento completo da panturrilha',
      'Pode ser feito unilateral para aumentar a dificuldade',
    ],
  },
  {
    id: 'elevacao-panturrilha-halteres',
    name: 'Elevação de Panturrilha (Halteres)',
    muscleGroup: 'panturrilha',
    equipment: 'halteres',
    pattern: 'isolamento',
    cues: [
      'Halteres ao lado do corpo, ponta dos pés em uma superfície elevada',
      'Eleve os calcanhares contraindo a panturrilha',
      'Desça controlado até o alongamento completo',
      'Boa opção quando não há máquina de panturrilha disponível',
    ],
  },
  {
    id: 'panturrilha-leg-press',
    name: 'Panturrilha no Leg Press',
    muscleGroup: 'panturrilha',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Sentado no leg press, apenas a ponta dos pés apoiada na plataforma',
      'Empurre a plataforma estendendo o tornozelo',
      'Desça controlado até sentir alongamento completo',
      'Não trave os joelhos — a extensão vem do tornozelo, não do joelho',
    ],
  },
  {
    id: 'cadeira-abdutora',
    name: 'Cadeira Abdutora',
    muscleGroup: 'gluteo',
    equipment: 'maquina-cabo',
    pattern: 'isolamento',
    cues: [
      'Sentado, pernas apoiadas nas almofadas, joelhos juntos no início',
      'Abra as pernas contra a resistência, contraindo o glúteo médio',
      'Controle o retorno, sem deixar o peso "bater" as pernas de volta',
      'Bom exercício acessório para estabilidade do quadril e joelho',
    ],
  },
]
```

- [ ] **Step 4: Rodar para confirmar que passam**

Run: `pnpm --filter @helux/ai test exercise-bank`
Expected: PASS — todos os `it` do describe `EXERCISE_BANK`.

- [ ] **Step 5: Commit**

```bash
git add packages/ai/src/exercise-bank.ts packages/ai/src/__tests__/exercise-bank.test.ts
git commit -m "feat(ai): add curated exercise bank catalog with execution cues"
```

---

### Task 3: Prompt do sistema — catálogo + instrução de variedade

**Files:**
- Modify: `packages/ai/src/prompts.ts`
- Modify: `packages/ai/src/__tests__/planner.test.ts`

**Interfaces:**
- Consumes: `EXERCISE_BANK` (Task 2)
- Produces: `buildSystemPrompt` continua com a mesma assinatura `(profile, constraints) => string`, mas o texto retornado agora contém a seção de catálogo — consumido pela Task 4 (nenhuma mudança de assinatura, então nenhuma outra chamada precisa mudar).

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao final de `packages/ai/src/__tests__/planner.test.ts` (mantendo tudo que já existe no arquivo):

```ts
describe('buildSystemPrompt — catálogo de exercícios', () => {
  it('inclui o catálogo de exercícios agrupado por padrão de movimento', () => {
    const profile = { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'baixo', predisposicao: 'misto', alertas: [] } as any
    const constraints = {} as any
    const prompt = buildSystemPrompt(profile, constraints)

    expect(prompt).toContain('Catálogo de Exercícios')
    expect(prompt).toContain('Agachamento Livre (Barra)')
    expect(prompt).toContain('Levantamento Terra (Barra)')
    expect(prompt).toContain('Supino Reto (Barra)')
  })

  it('inclui a instrução de escolha restrita e de variedade', () => {
    const profile = { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'baixo', predisposicao: 'misto', alertas: [] } as any
    const constraints = {} as any
    const prompt = buildSystemPrompt(profile, constraints)

    expect(prompt).toContain('EXCLUSIVAMENTE da lista de catálogo')
    expect(prompt).toContain('Priorize variedade em relação aos exercícios recentes')
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falham**

Run: `pnpm --filter @helux/ai test planner`
Expected: FAIL — as duas asserções novas não encontram o texto (seção ainda não existe).

- [ ] **Step 3: Atualizar `prompts.ts`**

No topo do arquivo, adicionar o import (junto ao import existente):

```ts
import type { GeneticProfile, WorkoutConstraints, WorkoutSession, RecoveryData, BodyCheckin } from '@helux/types'
import { EXERCISE_BANK, type ExerciseBankEntry } from './exercise-bank'
```

Adicionar esta função auxiliar antes de `buildSystemPrompt` (após `buildCheckinSection`):

```ts
function buildExerciseCatalogSection(): string {
  const byPattern = new Map<string, ExerciseBankEntry[]>()
  for (const entry of EXERCISE_BANK) {
    const list = byPattern.get(entry.pattern) ?? []
    list.push(entry)
    byPattern.set(entry.pattern, list)
  }

  const sections = Array.from(byPattern.entries())
    .map(([pattern, entries]) => `**${pattern}**: ${entries.map((e) => e.name).join(', ')}`)
    .join('\n')

  return `## Catálogo de Exercícios — OBRIGATÓRIO

Escolha os exercícios EXCLUSIVAMENTE da lista de catálogo abaixo, usando o nome exatamente como aparece (não invente variações de nome). Respeite as categorias proibidas listadas nas restrições do atleta, excluindo do catálogo qualquer exercício que se enquadre nelas.

Priorize variedade em relação aos exercícios recentes listados no histórico de sessões — evite repetir a mesma escolha em múltiplas sessões seguidas quando houver alternativa adequada no catálogo para o mesmo padrão de movimento.

${sections}`
}
```

Dentro de `buildSystemPrompt`, inserir a chamada da nova seção logo antes do `## Formato de Resposta` (que é o final da string retornada). Trecho relevante do `return` **antes** da mudança:

```ts
Quando não há dados de check-in, ignore esta seção e use apenas o perfil genético e HRV.
Mencione na justificativa como os dados de check-in influenciaram o plano (quando disponíveis).

## Formato de Resposta
```

Trecho **depois** da mudança:

```ts
Quando não há dados de check-in, ignore esta seção e use apenas o perfil genético e HRV.
Mencione na justificativa como os dados de check-in influenciaram o plano (quando disponíveis).

${buildExerciseCatalogSection()}

## Formato de Resposta
```

- [ ] **Step 4: Rodar para confirmar que passam**

Run: `pnpm --filter @helux/ai test planner`
Expected: PASS — todos os testes do arquivo, incluindo os dois novos.

- [ ] **Step 5: Commit**

```bash
git add packages/ai/src/prompts.ts packages/ai/src/__tests__/planner.test.ts
git commit -m "feat(ai): inject exercise catalog and variety instruction into system prompt"
```

---

### Task 4: Planner — anexar `cues` via lookup no catálogo

**Files:**
- Modify: `packages/ai/src/planner.ts`
- Modify: `packages/ai/src/__tests__/planner.test.ts`

**Interfaces:**
- Consumes: `EXERCISE_BANK` (Task 2), `PlannedExercise.cues?` (Task 1)
- Produces: `generateWorkoutPlan` continua retornando `Promise<NextWorkoutPlan>`, mas cada `PlannedExercise` do array `exercises` ganha `cues` quando há correspondência exata de `name` no catálogo.

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao final de `packages/ai/src/__tests__/planner.test.ts`:

```ts
describe('generateWorkoutPlan — anexação de cues do catálogo', () => {
  it('anexa cues quando o nome do exercício bate com o catálogo', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        generatedAt: '2026-07-02T10:00:00.000Z',
        exercises: [{ name: 'Agachamento Livre (Barra)', sets: 4, reps: '8-10', weight: '100kg' }],
        rationale: 'Teste',
      }) }],
      usage: { input_tokens: 100, output_tokens: 200, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    })

    const result = await generateWorkoutPlan(MOCK_INPUT)

    expect(result.exercises[0].cues).toBeDefined()
    expect(result.exercises[0].cues!.length).toBeGreaterThan(0)
  })

  it('não anexa cues quando o nome não bate com nenhuma entrada do catálogo', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        generatedAt: '2026-07-02T10:00:00.000Z',
        exercises: [{ name: 'Exercício Inventado Pela IA', sets: 3, reps: '10', weight: '20kg' }],
        rationale: 'Teste',
      }) }],
      usage: { input_tokens: 100, output_tokens: 200, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    })

    const result = await generateWorkoutPlan(MOCK_INPUT)

    expect(result.exercises[0].cues).toBeUndefined()
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falham**

Run: `pnpm --filter @helux/ai test planner`
Expected: FAIL — `cues` sempre `undefined` ainda (lookup não implementado).

- [ ] **Step 3: Atualizar `planner.ts`**

Conteúdo completo do arquivo após a mudança:

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { PlanInput, NextWorkoutPlan, PlannedExercise } from '@helux/types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'
import { EXERCISE_BANK } from './exercise-bank'

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
  plan.exercises = plan.exercises.map(attachCues)

  return plan
}

function attachCues(exercise: PlannedExercise): PlannedExercise {
  const bankEntry = EXERCISE_BANK.find((entry) => entry.name === exercise.name)
  if (!bankEntry) return exercise
  return { ...exercise, cues: bankEntry.cues }
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

- [ ] **Step 4: Rodar para confirmar que passam**

Run: `pnpm --filter @helux/ai test`
Expected: PASS — todos os testes do pacote `@helux/ai` (prompts, planner, exercise-bank).

- [ ] **Step 5: Commit**

```bash
git add packages/ai/src/planner.ts packages/ai/src/__tests__/planner.test.ts
git commit -m "feat(ai): attach exercise bank cues to generated plan by name lookup"
```

---

### Task 5: Web — bloco "Como executar" em `ActiveExercise`

**Files:**
- Modify: `apps/web/src/components/workout/ActiveExercise.tsx`
- Create: `apps/web/src/__tests__/components/workout/ActiveExercise.test.tsx`

**Interfaces:**
- Consumes: `PlannedExercise.cues?: string[]` (Task 1)

- [ ] **Step 1: Escrever o teste que falha**

Criar `apps/web/src/__tests__/components/workout/ActiveExercise.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveExercise } from '@/components/workout/ActiveExercise'
import type { PlannedExercise } from '@helux/types'

const BASE_EXERCISE: PlannedExercise = {
  name: 'Agachamento Livre (Barra)',
  sets: 4,
  reps: '8-10',
  weight: '100kg',
}

describe('ActiveExercise — bloco de cues', () => {
  it('não renderiza o bloco "Como executar" quando cues está ausente', () => {
    render(<ActiveExercise exercise={BASE_EXERCISE} setNumber={1} onLog={vi.fn()} />)
    expect(screen.queryByText(/como executar/i)).not.toBeInTheDocument()
  })

  it('renderiza o bloco colapsado por padrão quando cues está presente', () => {
    const exercise: PlannedExercise = { ...BASE_EXERCISE, cues: ['Dica 1', 'Dica 2', 'Dica 3'] }
    render(<ActiveExercise exercise={exercise} setNumber={1} onLog={vi.fn()} />)

    expect(screen.getByText(/como executar/i)).toBeInTheDocument()
    expect(screen.queryByText('Dica 1')).not.toBeInTheDocument()
  })

  it('expande e mostra as cues ao clicar no bloco', async () => {
    const user = userEvent.setup()
    const exercise: PlannedExercise = { ...BASE_EXERCISE, cues: ['Dica 1', 'Dica 2', 'Dica 3'] }
    render(<ActiveExercise exercise={exercise} setNumber={1} onLog={vi.fn()} />)

    await user.click(screen.getByText(/como executar/i))

    expect(screen.getByText('Dica 1')).toBeInTheDocument()
    expect(screen.getByText('Dica 2')).toBeInTheDocument()
    expect(screen.getByText('Dica 3')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `pnpm --filter @helux/web test ActiveExercise`
Expected: FAIL — o texto "Como executar" ainda não existe no componente.

- [ ] **Step 3: Atualizar `ActiveExercise.tsx`**

Conteúdo completo do arquivo após a mudança:

```tsx
'use client'

import { useState } from 'react'
import { useRestTimer } from '@/hooks/useRestTimer'
import { SetLogger } from './SetLogger'
import { RestTimer } from './RestTimer'
import type { PlannedExercise } from '@helux/types'

interface ActiveExerciseProps {
  exercise: PlannedExercise
  setNumber: number
  onLog: (set: { reps: number; weight: number; effort: number }) => void
}

const REST_SECONDS = 90

export function ActiveExercise({ exercise, setNumber, onLog }: ActiveExerciseProps) {
  const { secondsLeft, isActive, start, reset } = useRestTimer()
  const [cuesExpanded, setCuesExpanded] = useState(false)

  function handleLog(set: { reps: number; weight: number; effort: number }) {
    onLog(set)
    start(REST_SECONDS)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-sans font-semibold text-xl text-white">{exercise.name}</h2>
        {exercise.notes && (
          <p className="text-helux-muted text-sm mt-1">{exercise.notes}</p>
        )}
      </div>

      {exercise.cues && exercise.cues.length > 0 && (
        <div className="border border-helux-muted/30 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setCuesExpanded((prev) => !prev)}
            className="w-full text-left px-3 py-2 text-sm font-medium text-white bg-helux-muted/10"
          >
            Como executar {cuesExpanded ? '▲' : '▼'}
          </button>
          {cuesExpanded && (
            <ul className="px-3 py-2 space-y-1 text-sm text-helux-muted list-disc list-inside">
              {exercise.cues.map((cue, i) => (
                <li key={i}>{cue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isActive ? (
        <RestTimer secondsLeft={secondsLeft} isActive={isActive} onSkip={reset} />
      ) : (
        <SetLogger
          setNumber={setNumber}
          targetReps={exercise.reps}
          targetWeight={exercise.weight}
          onLog={handleLog}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rodar para confirmar que passam**

Run: `pnpm --filter @helux/web test ActiveExercise`
Expected: PASS — os três testes novos.

- [ ] **Step 5: Rodar toda a suíte do web para checar regressão**

Run: `pnpm --filter @helux/web test`
Expected: PASS — nenhum teste existente quebrado pela mudança.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/workout/ActiveExercise.tsx apps/web/src/__tests__/components/workout/ActiveExercise.test.tsx
git commit -m "feat(web): show collapsible execution cues in ActiveExercise"
```

---

### Task 6: Verificação final e revisão de conteúdo pendente

**Files:** nenhum arquivo novo — apenas verificação.

- [ ] **Step 1: Rodar a suíte completa do monorepo**

Run: `pnpm turbo run test`
Expected: PASS em todos os workspaces (`@helux/types`, `@helux/ai`, `@helux/api`, `@helux/web`).

- [ ] **Step 2: Rodar typecheck completo**

Run: `pnpm turbo run typecheck`
Expected: PASS sem erros.

- [ ] **Step 3: Registrar pendência de revisão de conteúdo**

O catálogo em `packages/ai/src/exercise-bank.ts` foi redigido com base em técnica de execução já estabelecida, mas **precisa de revisão humana** antes de considerar o conteúdo definitivo (conforme combinado no spec). Nenhuma ação de código aqui — apenas confirmar com o usuário quais entradas ele já revisou/ajustou, se houver.

- [ ] **Step 4: Commit final (se houver ajustes da revisão)**

```bash
git add packages/ai/src/exercise-bank.ts
git commit -m "fix(ai): adjust exercise bank cues after manual review"
```
