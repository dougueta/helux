# Design: Banco de Exercícios Curado + Geração Restrita com Instruções de Execução

**Data**: 2026-07-02
**Status**: Aprovado
**Área**: `packages/ai` · `packages/types` · `apps/web`

---

## Resumo

Hoje a IA gera exercícios como texto livre (só `name`, `sets`, `reps`, `weight`, `notes?`), sem nenhum catálogo por trás. Isso causa dois problemas: (1) os exercícios sugeridos tendem a ser repetitivos/genéricos entre sessões, e (2) não há instruções confiáveis de execução — qualquer dica viria improvisada pela LLM no campo `notes`, sem garantia de correção biomecânica.

Este design adiciona um catálogo estático de exercícios (com dicas de execução curadas) versionado no repositório. A IA passa a escolher exercícios exclusivamente desse catálogo e recebe o histórico recente de sessões para evitar repetição. Cada exercício do plano gerado ganha um campo opcional `cues` (dicas de execução) preenchido via lookup no catálogo, exibido na tela de treino ativo.

---

## Contexto

O plano de treino já é personalizado por perfil genético, HRV/recuperação, histórico de sessões, check-in mensal (feature em andamento) e objetivo/nível do usuário. Falta a camada de **qualidade da execução e variedade dos exercícios em si** — hoje a lista de exercícios é 100% "criatividade" da LLM a cada chamada, sem nenhum vínculo com um banco real.

---

## Catálogo de Exercícios (`packages/ai/src/exercise-bank.ts`)

Array estático em TypeScript, não é dado de usuário — fica versionado no repo (não no Supabase).

```ts
export interface ExerciseBankEntry {
  id: string // slug único, ex: "agachamento-livre-barra"
  name: string // nome exibido, ex: "Agachamento Livre (Barra)"
  muscleGroup: string // ex: "quadríceps", "posterior", "peito", "costas", "ombro", "core"
  equipment: 'barra' | 'halteres' | 'maquina-cabo' | 'peso-corporal'
  pattern: string // padrão de movimento: "agachar", "dobrar-quadril", "empurrar-horizontal",
                   // "empurrar-vertical", "puxar-horizontal", "puxar-vertical", "core", "isolamento"
  cues: string[] // 3-5 dicas curtas: setup, execução, erro comum a evitar
}

export const EXERCISE_BANK: ExerciseBankEntry[] = [ /* ~100-120 entradas */ ]
```

**Cobertura inicial**: ~100-120 exercícios cobrindo os padrões de movimento principais (agachar, dobrar quadril, empurrar horizontal/vertical, puxar horizontal/vertical, core, isolamento) nos três tipos de equipamento: barra/halteres, máquinas/cabos, peso corporal.

**Autoria do conteúdo**: as `cues` de cada exercício são redigidas com base em técnica já estabelecida. Antes de considerar o catálogo pronto para uso real, o usuário revisa o conteúdo gerado — isso é uma tarefa explícita do plano de implementação, não uma suposição implícita de correção.

---

## Tipo Compartilhado (`packages/types/src/workout.ts`)

Extensão aditiva de `PlannedExercise` — não quebra nada existente:

```ts
export interface PlannedExercise {
  name: string
  sets: number
  reps: string
  weight: string
  notes?: string
  cues?: string[] // NOVO — preenchido via lookup no banco após a IA responder; ausente se sem match
}
```

---

## Integração com a IA (`packages/ai`)

### `buildSystemPrompt`

Nova regra obrigatória, adicionada após as regras de restrição genética existentes:

```
## Catálogo de Exercícios — OBRIGATÓRIO

Escolha os exercícios EXCLUSIVAMENTE da lista de catálogo abaixo, usando o campo
`name` exatamente como aparece (não invente variações de nome). Respeite também
as categorias proibidas pelo perfil genético do atleta listadas na seção de
restrições — exclua do catálogo qualquer exercício que se enquadre nelas.

[catálogo completo injetado, agrupado por padrão de movimento]
```

A exclusão por `WorkoutConstraints.forbiddenExerciseTypes` continua sendo feita pela própria LLM via instrução textual — igual ao mecanismo já existente hoje. O catálogo não tenta mapear estruturalmente essas categorias livres (ex: "pliometria de alto impacto") para `pattern`/`muscleGroup`, porque não há uma taxonomia comum confiável entre os dois; isso ficaria como uma melhoria futura, não neste MVP.

### `buildUserPrompt`

`buildUserPrompt` já recebe `workoutHistory: WorkoutSession[]` como parâmetro — nenhum dado novo precisa ser buscado. Extrai os nomes de exercícios (`ExerciseSet.name`) das últimas 1-2 sessões e injeta:

```
### Exercícios das sessões recentes (evitar repetir sem motivo)

Evite repetir estes exercícios da(s) sessão(ões) anterior(es), exceto se fizer
sentido por progressão direta de carga: [lista de nomes].
Priorize variação dentro do mesmo grupo muscular/padrão de movimento.
```

Quando `workoutHistory` está vazio (primeira sessão), a seção é omitida.

---

## Fluxo de Geração (`packages/ai/src/planner.ts`)

Após parsear a resposta da IA (`parseJsonResponse`), para cada `PlannedExercise` do plano:

1. Faz lookup por `name` (match exato) em `EXERCISE_BANK`.
2. Se encontrar: anexa `cues` do registro correspondente.
3. Se não encontrar (a IA pode "alucinar" um nome fora do catálogo apesar da instrução): o exercício segue sem `cues` — degrada graciosamente, não lança erro nem bloqueia a geração do plano.

---

## Web App (`apps/web`)

### `ActiveExercise.tsx`

Quando `PlannedExercise.cues` existe e não é vazio, exibe um bloco colapsável **"Como executar"** com a lista de dicas, posicionado abaixo do nome do exercício e acima do set logger. Colapsado por padrão (evita poluir a tela durante a série). Quando `cues` está ausente, o componente se comporta exatamente como hoje — sem alteração visual.

---

## Testes

### `packages/ai`
- `buildSystemPrompt`: catálogo completo é injetado, agrupado por padrão de movimento.
- `buildUserPrompt`: com `workoutHistory` não vazio, injeta seção "evitar repetir" com os nomes corretos; com `workoutHistory` vazio, omite a seção.
- `planner.ts`: resposta da IA com nome que bate no catálogo → `cues` anexado; nome que não bate → exercício sem `cues`, sem lançar erro.

### `apps/web`
- `ActiveExercise`: renderiza bloco "Como executar" quando `cues` presente; não renderiza quando ausente; bloco inicia colapsado.

---

## Fora de Escopo (MVP)

- Substituição de exercício pelo usuário (trocar por um equivalente do catálogo)
- Fotos ou vídeos de execução
- Filtragem automática por equipamento disponível no momento do treino (todo o catálogo fica elegível independentemente de equipamento)
- Match "genético" por exercício individual (o conceito mockado no app mobile não é reaproveitado)
- Expansão do catálogo além da cobertura inicial (~100-120 exercícios)
- Filtro estrutural do catálogo por `forbiddenExerciseTypes` (a exclusão continua sendo feita pela LLM via instrução textual, como hoje)
