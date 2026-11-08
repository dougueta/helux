# Data Model: Banco de exercícios coerente com demonstração

Tudo é dado versionado em `@helux/exercises`, salvo os campos opcionais do plano. Não há migração de esquema.

## Base comum

```ts
type CatalogKind = 'forca' | 'preparacao' | 'cardio'

interface CatalogItem {
  id: string                 // estável, nunca reutilizado
  name: string               // único em todos os catálogos
  kind: CatalogKind
  guidance?: Guidance        // obrigatório fora de pending.json; vira obrigatório no tipo no encerramento
  demo?: DemoSpec            // obrigatório fora de pending.json; vira obrigatório no tipo no encerramento
}
```

## Exercício de força

Estende `ExerciseBankEntry`. Os campos atuais continuam, com o mesmo significado.

```ts
interface StrengthExercise extends CatalogItem {
  kind: 'forca'
  muscleGroup: string        // volume semanal (inalterado)
  equipment: Equipment       // filtro de equipamento disponível (inalterado)
  pattern: string
  stress: JointStress        // inalterado, salvo correção justificada
  tempo: string
  gear: Gear                 // NOVO: implemento real, para etiqueta e desenho
  muscles: { primary: MuscleKey[]; secondary: MuscleKey[] }   // agora explícito
  cues: string[]             // derivado de guidance, para compatibilidade
}

type Gear = 'barra' | 'halteres' | 'kettlebell' | 'maquina' | 'smith' | 'cabo'
  | 'corda' | 'peso-corporal' | 'elastico' | 'roda' | 'banco' | 'barra-fixa' | 'nenhum'

type MuscleKey = 'peito' | 'ombro' | 'triceps' | 'biceps' | 'antebraco' | 'dorsal'
  | 'trapezio' | 'lombar' | 'core' | 'quadriceps' | 'posterior' | 'gluteo'
  | 'adutores' | 'abdutores' | 'panturrilha'
```

**Regras**: Depois de migrado, `cues` vem de `guidance` e `muscles` é explícito; enquanto o item está pendente, ambos continuam com os valores atuais. Os 122 nomes atuais ficam congelados por teste (R3). Toda alteração de classificação entra em `bank-review.md`.

## Item de preparação e mobilidade

```ts
interface PreparationItem extends CatalogItem {
  kind: 'preparacao'
  phases: ('aquecimento' | 'volta-calma' | 'mobilidade')[]
  regions: Region[]          // pelo menos uma
  mode: 'reps' | 'por-lado' | 'sustentacao' | 'continuo'
  needs: Gear[]              // vazio = sem equipamento
  knownNames: string[]       // nomes antigos exatos, para planos existentes
}
```

**Regras**: Pelo menos 2 itens por região, com ao menos 1 sem equipamento. O plano define só a dose (`sets`, `reps`) e a ordem.

### Catálogo inicial (cerca de 45)

Consolidado a partir dos planos salvos e das avaliações da IA. A lista final é definida ao produzir a etapa 7.

| Grupo | Itens |
|:---|:---|
| Aquecimento geral | Bike leve, Remo leve, Marcha no lugar, Polichinelo leve, Balanço de perna |
| Ativação | Círculos de braço, Deslizamento na parede, Rotação externa com elástico, Rotação e passagem de ombro com elástico, Puxada de elástico para o rosto, Suspensão ativa na barra, Ponte de glúteo, Flexão inclinada leve, Afundo sem carga, Agachamento no banco sem carga, Dobradiça de quadril com bastão |
| Mobilidade | Quadril 90/90, Abertura de quadril (sapo), Agachamento profundo com pausa, Agachamento cossaco, Tornozelo com joelho à parede, Dorsiflexão do hálux, Rotação torácica em quatro apoios, Rotação torácica deitado de lado, Mobilidade torácica no rolo, Gato-camelo, Báscula pélvica, Balanço para trás em quatro apoios, Deslizamento de calcanhar, Extensão de joelho com toalha, Extensão terminal de joelho com elástico |
| Alongamento | Peitoral na parede, Dorsal no banco, Dorsal no apoio, Posterior de ombro, Bíceps na parede, Tríceps acima da cabeça, Antebraço, Flexor de quadril semiajoelhado, Quadríceps deitado de lado, Quadríceps em pé, Posterior de coxa com faixa, Posterior de coxa em pé, Glúteo em figura 4, Panturrilha na parede, Postura da criança, Joelhos ao peito |
| Relaxamento | Respiração diafragmática |

## Modalidade de cardio

`CardioBankEntry` continua em `@helux/types` (impacto, carga, local). `@helux/exercises` acrescenta `guidance` e `demo` por `id`, com modo `cycle`. A orientação inclui como manter cada zona (`leve`, `moderada`, `intervalado-leve`). O circuito mostra a sequência dos movimentos.

## Orientação

```ts
interface Guidance {
  setup: string[]        // posição inicial; pelo menos 1
  steps: string[]        // execução; pelo menos 1
  commonError?: string   // obrigatório para força e preparação com técnica
  context?: string       // "boa opção quando…"; fora dos passos
  zones?: Record<string, string>   // só cardio
}
```

**Regras** (testadas): frases com até 110 caracteres; passos sem as aberturas "Boa opção", "Bom para", "Excelente", "Ótimo" e "Alternativa". Clareza e correção técnica dependem da revisão.

## Demonstração

```ts
type Point = [number, number]

interface Pose {                       // viewBox atual: 220 × 250
  head: Point; sh: Point; el: Point; ha: Point; hip: Point; kn: Point; an: Point; toe: Point
  el2?: Point; ha2?: Point             // braço oposto
  kn2?: Point; an2?: Point; toe2?: Point   // perna oposta
}

interface MovementBase {
  key: string
  view: 'side' | 'front'
  mirror?: boolean
  loop: 'reps' | 'hold' | 'alternate' | 'cycle'
  durationMs: number
  root: 'foot' | 'hand' | 'hip' | 'seat'   // apoio fixo da cadeia
  fixed: (keyof Pose)[]                    // pontos que não podem se mover
  keyframes: { at: number; pose: Pose }[]  // at de 0 a 1, ao menos 2
}

interface DemoSpec {
  base: string              // MovementBase.key
  gear: Gear
  scene: Scene
  implementAt: keyof Pose
  poseOverrides?: Partial<Pose>[]   // por keyframe
  caption?: string          // obrigatória quando o item compartilha base e a diferença não é visível
}
```

**Regras** (testadas): `base` existe; `at` é crescente; variação do comprimento dos ossos abaixo de 3% ao longo do ciclo; pontos em `fixed` deslocam no máximo 1 unidade; `gear` da demonstração igual ao do item; acento só no implemento; com `gear` sem carga, nada é desenhado; em movimento reduzido, fica na pose central.

## Revisão

```ts
// review/pending.json
{ "ids": ["..."] }       // só pode diminuir

// review/approvals.json
{ "<id>": "<sha256 de { demo resolvida + guidance }>" }
```

| Estado | `pending` | Hash | Na tela | CI |
|:---|:---|:---|:---|:---|
| Pendente | Sim | Qualquer | Mostra o que existe hoje (animação antiga ou aviso) | Passa |
| Aprovado | Não | Igual | Demonstração e orientação novas | Passa |
| Alterado sem aprovação | Não | Diferente | — | **Falha** |
| Novo sem demonstração | Não | Ausente | — | **Falha** |
| Novo marcado como pendente | Sim, adicionado | — | — | **Falha** (`demos:check-pending`) |

Editar um item já aprovado exige nova aprovação no mesmo PR. Ele não pode voltar para a lista de pendências.

## Campos do plano

Só acréscimos opcionais em `PlannedExercise`. Planos antigos continuam válidos.

```ts
catalogId?: string    // preparação em planos novos
approachOf?: string   // id do exercício de força, em séries de aproximação
```

`Variant.motion` e `Variant.implement` continuam no tipo, usados até a lista de pendências esvaziar e ignorados depois, porque planos salvos os contêm.

## Resolução de um item na tela

1. `approachOf` → exercício de força, com a indicação de série leve de preparação.
2. Variante ativa → `variant.id`.
3. `catalogId`.
4. `cardio.modality`.
5. Nome exato em força.
6. Nome normalizado em `name` ou `knownNames` da preparação; aproximação pela lista curada.
7. Sem correspondência → aviso de indisponibilidade, sem exibir outra animação.

## Mudanças de estado do plano

| Quando | O que muda |
|:---|:---|
| Geração de novos planos | Preparação via catálogo; variantes pela regra nova |
| `refresh-plan-variants --apply` (uma vez) | `variants` e `match` das sessões não concluídas dos planos ativos |
| Sessões concluídas e histórico | Nunca |
