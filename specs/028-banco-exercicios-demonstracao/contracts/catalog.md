# Contrato: `@helux/exercises`

Pacote puro, sem React, sem SDK de IA e sem rede. Depende só de `@helux/types`.

## Exportações

```ts
// Catálogos
export const STRENGTH_EXERCISES: StrengthExercise[]
export const PREPARATION_ITEMS: PreparationItem[]
export const CARDIO_GUIDANCE: Record<string, CardioContent>

// Resolução
export function resolvePlannedItem(exercise: PlannedExercise, variantId?: string): ResolvedItem
export function isDemoReady(id: string): boolean          // fora de pending.json

// Variantes
export function isCoherentVariant(base: StrengthExercise, candidate: StrengthExercise): boolean

// Motor (carregado sob demanda pela web)
export function loadDemo(id: string): Promise<ResolvedDemo | null>
export function poseAt(demo: ResolvedDemo, phase: number): Pose
```

```ts
interface ResolvedItem {
  id: string | null                     // null = sem correspondência
  name: string
  kind: CatalogKind | null
  demoState: 'nova' | 'legada' | 'indisponivel'
  guidance: Guidance | null
  muscles: { primary: MuscleKey[]; secondary: MuscleKey[] } | null
  tempo: string | null
  gearLabel: string | null
  isApproach: boolean
}
```

`resolvePlannedItem` segue a ordem de [data-model.md](../data-model.md). Durante a transição, `legada` indica que a tela usa a animação salva no plano. Ao final, esse estado é removido.

## Compatibilidade de `@helux/ai`

Continuam exportados, com o mesmo formato: `EXERCISE_BANK`, `MUSCLE_GROUP_LABEL`, `STRESS_OVERRIDES`, `findBankExercise`, `CARDIO_BANK` e `findCardio`. Consumidores existentes não mudam na etapa 1.

## Esquema da geração

`buildExerciseItemSchema(allowed)` passa a aceitar:

| Item | Mudança |
|:---|:---|
| `principal` | Sem mudança |
| `aquecimento`, `volta-calma`, `mobilidade` | `name` vira enum do catálogo, filtrado por fase. `region` passa a vir do catálogo |
| `aproximacao` (novo) | `exercise` (enum de força permitido), `sets`, `reps`, `weight`, `notes`. Vira `phase: 'aquecimento'` e `approachOf` no plano |
| `cardio` | Sem mudança |

`AllowedChoices` ganha `preparation: string[]`. Um item fora do catálogo vindo de qualquer caminho é trocado por `repairPreparationItem` e registrado na regra `item-fora-do-catalogo`.

## Invariantes (testes)

Para todo item dos catálogos:

1. `id` e `name` são únicos entre todos os catálogos.
2. Fora de `pending.json`: tem `demo`, `guidance` válida, dados obrigatórios do tipo e hash igual ao aprovado.
3. Mensagem de falha: `"<id>: falta <item>"`.
4. Os 122 nomes atuais continuam presentes.
5. `demo.base` existe e passa nas regras físicas de [data-model.md](../data-model.md).
6. Cada região de `REGIONS` tem pelo menos 2 itens de preparação, ao menos 1 sem equipamento.
7. Nenhum exercício de isolamento recebe variante de outra função muscular (SC-003).
8. Todo nome dos planos salvos usados como referência resolve ou é um caso ambíguo documentado.

Cobertura informada no log do teste: `aprovados/total` por catálogo.
