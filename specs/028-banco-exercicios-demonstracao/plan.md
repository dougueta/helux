# Implementation Plan: Banco de exercícios coerente com demonstração de execução para todos

**Branch**: `028-banco-exercicios-demonstracao` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/028-banco-exercicios-demonstracao/spec.md`

## Summary

Hoje a demonstração é deduzida por regras a partir do nome e do padrão de movimento, e os itens livres de aquecimento, volta à calma e mobilidade não têm catálogo. Nos planos salvos, 31 nomes distintos de aquecimento, volta à calma, mobilidade e cardio não têm demonstração.

A entrega muda a origem dos dados: **todo item passa a ter uma entrada de catálogo com demonstração e orientação próprias**, e a tela lê essa entrada na hora de exibir. Variantes são exercícios do catálogo, então herdam tudo sem trabalho extra.

1. **Catálogo único**: novo pacote `@helux/exercises` reúne os 122 exercícios de força, as 11 modalidades de cardio e cerca de 45 itens de preparação e mobilidade, totalizando cerca de 178 demonstrações. Web e API leem da mesma fonte.
2. **Mesmo visual, movimento melhor**: a figura e os tokens atuais continuam. O motor passa a aceitar várias fases, interpola por ângulo de articulação (os membros deixam de encolher no meio do movimento) e mantém os apoios fixos.
3. **Variantes coerentes**: mesmo padrão e mesmo músculo principal, com a pré-visualização antes de trocar. Um script único atualiza as variantes dos planos ativos.
4. **Geração de planos**: a IA só escolhe itens do catálogo, e o que muda de plano para plano é a dose.
5. **Trava e revisão por PR**: o CI falha se faltar demonstração, orientação ou aprovação. Cada PR recebe um comentário com quadros e GIF na resolução de celular, e o dono aprova ali, em lotes.

Decisões em [research.md](./research.md) (R1–R12), entidades em [data-model.md](./data-model.md) e contratos em [contracts/](./contracts/).

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict), React 18 / Next.js 14 App Router, Fastify na API, Node 22 no CI
**Primary Dependencies**: `@helux/types`, `@helux/ai`, `@helux/workouts`; novas dependências de desenvolvimento em `apps/web`: `playwright` (Apache-2.0), `gifenc` e `pngjs` (MIT)
**Storage**: Dados versionados no repositório (catálogo, `pending.json`, `approvals.json`). Sem migração de esquema. `mesocycle_plans.sessions` recebe uma atualização única das variantes dos planos ativos (R8). Evidências ficam em branch órfã, fora do histórico do código (R11)
**Testing**: Vitest + Testing Library, com TDD estrito; invariantes de catálogo como testes; modo mock da 021 para a galeria e o roteiro manual
**Target Platform**: Web responsiva, uso principal no celular; captura em 390 × 844
**Project Type**: Monorepo; novo `packages/exercises`; toca `packages/ai`, `packages/types`, `apps/web`, `apps/api` e `.github/workflows`
**Performance Goals**: A demonstração aparece em até 1 s (SC-007), sem chamada de rede depois de carregado o código da tela de treino
**Constraints**: Nenhum nome de exercício é removido ou alterado (R3). `equipment` e `muscleGroup` mantêm o significado usado nas restrições e no volume por grupo (R4). Regras de segurança e progressão inalteradas (FR-017). Nada em produção depende de GIF. O repositório é público, então nenhum dado pessoal entra em commit, backup ou evidência
**Scale/Scope**: Cerca de 178 itens e cerca de 45 novos; estimativa revista depois do piloto (T043): 110 a 130 movimentos base, cerca de 75 de força

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|:---|:---|:---|
| **I. Monorepo-First** | ✅ PASS | O novo pacote fica em `packages/`, com `package.json`, testes e README próprios. |
| **II. Test-First (TDD)** | ✅ PASS | Primeiro os invariantes do catálogo, a física do motor (comprimento dos ossos, apoios fixos), a coerência das variantes, o resolvedor, o esquema da IA e os componentes. Para o conteúdo, tirar um item de `pending.json` faz o invariante falhar até a demonstração, a orientação e a aprovação existirem. |
| **III. Independent Deployability** | ✅ PASS | Web e API continuam independentes: a web lê o catálogo do próprio bundle, e os novos campos do plano são opcionais. O script de variantes só roda depois do deploy da API. |
| **IV. Shared Code via Packages** | ✅ PASS | O banco sai de `@helux/ai`, que a web não pode importar, e vai para um pacote compartilhado. `@helux/ai` reexporta o que os consumidores já usam. |
| **V. Simplicity (YAGNI)** | ✅ PASS com ressalva | Sem tela administrativa nem tabela de aprovação: arquivos versionados bastam. Sem aliases para renomeação, porque nada é renomeado. O pacote novo está justificado em Complexity Tracking. |

**Re-check pós-design (Phase 1)**: ✅ continua PASS. O único estado novo fora do código é a branch de evidências, descartável e apagada ao fechar o PR.

## Project Structure

### Documentation (this feature)

```text
specs/028-banco-exercicios-demonstracao/
├── plan.md              # Este arquivo
├── research.md          # R1–R12
├── data-model.md        # Catálogo, demonstração, orientação, aprovação e campos do plano
├── quickstart.md        # Rodar, testar, incluir exercício, revisar
├── bank-review.md       # Registro das correções do banco (FR-016); criado na implementação
├── contracts/
│   ├── catalog.md       # API do pacote e invariantes
│   ├── ui.md            # Tela de treino, folha, pré-visualização, mapa, galeria
│   └── review-flow.md   # Scripts, CI, comentário no PR e aprovação
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
packages/exercises/                     # NOVO: @helux/exercises
├── README.md                           # Inclui o caminho para adicionar um item (FR-021)
└── src/
    ├── strength.ts                     # 122 exercícios (movidos de packages/ai/src/exercise-bank.ts)
    ├── preparation.ts                  # Catálogo de preparação e mobilidade (~45)
    ├── cardio-guidance.ts              # Orientação das 11 modalidades (CARDIO_BANK segue em @helux/types)
    ├── variants-rule.ts                # Coerência: padrão + músculo principal + afinidades
    ├── resolve.ts                      # resolveItem, resolveLegacyName, isDemoReady
    ├── engine/                         # Puro: tipos, poseAt, cinemática, loops
    ├── demos/                          # Movimentos base e demonstração por item
    ├── review/pending.json             # Itens ainda não aprovados; só pode diminuir
    ├── review/approvals.json           # id → hash aprovado
    ├── review/hash.ts                  # Hash canônico de demonstração + orientação
    └── __tests__/                      # Invariantes, motor, variantes, resolvedor

packages/types/src/workout.ts           # PlannedExercise: catalogId?, approachOf?
packages/ai/src/
├── exercise-bank.ts                    # Reexporta @helux/exercises
├── variants.ts                         # Usa a regra de coerência
├── mesocycle-planner.ts                # Enriquecimento por catálogo
├── mesocycle-prompts.ts                # Instruções de preparação e aproximação
├── motions.ts                          # REMOVIDO ao esvaziar a lista de pendências
└── agents/
    ├── mesocycle-schema.ts             # Preparação por enum; item de aproximação
    └── constraints.ts                  # Regra 'item-fora-do-catalogo' e correção

apps/api/scripts/refresh-plan-variants.ts  # NOVO: execução única, simulação por padrão (R8)

apps/web/
├── scripts/demo-evidence.ts            # NOVO: quadros, GIF e cartão de cada item
├── scripts/demos-approve.ts            # NOVO: registra aprovações e tira de pending
├── scripts/demos-check-pending.ts      # NOVO: compara pending.json com a branch base
└── src/
    ├── app/dev/demos/page.tsx          # NOVO: galeria; notFound() em produção
    ├── app/workout/page.tsx            # Acesso à execução em todo item
    ├── lib/exerciseDisplay.ts          # Lê do catálogo
    └── components/workout/
        ├── ExerciseDemo.tsx            # Motor novo; recebe phase? para captura; caminho antigo até zerar pendências
        ├── ExerciseSheet.tsx           # Orientações do item ativo; pré-visualização; item sem variantes
        ├── DemoUnavailable.tsx         # NOVO: aviso de indisponibilidade
        └── MuscleMap.tsx               # Vista de costas e novas regiões

.github/workflows/
├── ci.yml                              # Passo demos:check-pending
└── demo-evidence.yml                   # NOVO: comentário no PR; limpa ao fechar
```

**Structure Decision**: A regra e os dados ficam em um pacote puro, sem React nem SDK de IA, e a renderização fica em `apps/web`. A web lê o catálogo no próprio bundle, o que cobre planos antigos, a sessão ativa em `localStorage` e conexão instável durante o treino.

## Ordem de entrega

Cada etapa pode ir para produção sozinha (FR-032, FR-034).

| Etapa | Conteúdo | Ponto de controle |
|:---|:---|:---|
| 1. Fundação | Mover o banco sem mudar comportamento; invariantes; `pending.json` com todos os itens | Suíte atual verde, nenhuma mudança visível |
| 2. Motor e revisão | Motor novo, galeria, evidências, workflows | Evidência de teste aparece em um PR |
| 3. **Piloto** | Pullover (Halteres), Russian Twist, Cadeira Adutora, Flexão Pike, Mesa Flexora | **O dono aprova o novo movimento antes de produzir o resto** |
| 4. Telas | Acesso em todo item, orientações da variante ativa, pré-visualização, aviso, mapa muscular | Comportamento testado com os itens já aprovados |
| 5. Força | Lotes por família, com orientações e dados revisados | Cada lote aprovado no próprio PR |
| 6. Variantes | Regra nova; script único nos planos ativos | Simulação revisada; aplicação só com confirmação |
| 7. Preparação e cardio | Catálogo novo, 11 modalidades, geração da IA, correspondência de nomes antigos | Avaliação da IA sem regressão |
| 8. Encerramento | Lista de pendências vazia; remoção de `motions.ts`, do caminho antigo e do supino como último recurso | SC-001 a SC-010 |

### Aprendizados do piloto (T043, 2026-11-08)

O dono aprovou os 5 itens no PR #23. O que muda no plano:

- **Base por item incomum**: os 5 itens precisaram de 5 bases próprias, e a abdução saiu de graça com `reverseBase`. Itens fora do padrão quase não reaproveitam base; o reaproveitamento vem de variantes de carga da mesma família (barra, halteres, máquina), que mudam só `gear` e `scene`.
- **Mudança de ângulo é base nova**: inclinação do banco, pés elevados ou tronco inclinado mudam a geometria e pedem base própria. Só equipamento e cena não.
- **Estimativa de bases por lote de força** (contando reaproveitamento dentro do lote): Agachar ~9, Dobrar o quadril ~8, Empurrar na horizontal ~6, Empurrar na vertical ~5, Puxar na vertical ~4 (`pullover-barra` usa a base do piloto), Puxar na horizontal ~6, Core ~12, Bíceps e tríceps ~8, Ombro, trapézio e peito ~8, Isolamento de pernas ~5 (`cadeira-abdutora` usa a base do piloto). Total ~71, mais as 6 do piloto. Preparação (48 itens) tende a ~40 bases e cardio (11) a ~8. Por isso a faixa subiu de 60–80 para 110–130.
- **Divisão dos lotes**: o limite de 15 itens por PR continua. O Lote 7 (Core) tem 15 itens e ~12 bases novas, então é dividido em 7a (pranchas e anti-rotação) e 7b (flexão e rotação de tronco), cada um com seu PR. Os demais lotes ficam como estão em `tasks.md`.
- **Vista frontal**: serve para adução, abdução e rotação, mas encurta a coxa e não mostra a rotação dos ombros. Usar só quando o movimento é lateral; nos demais, perfil.
- **Evidência**: cerca de 40 s por item na captura local e GIFs de 450 a 580 KB, bem abaixo do limite de 2 MB. Um lote de 15 leva cerca de 10 min no workflow.

## Riscos

- **Qualidade visual depende de revisão humana**: testes garantem física e cobertura, não se o movimento é reconhecível. O piloto valida o método antes do volume, e o SC-006 mede o resultado.
- **Volume de revisão**: são cerca de 178 itens. Muitos reaproveitam um movimento base, então os lotes por família tendem a ser revisados rapidamente, com limite de 15 itens por PR.
- **Geração de planos**: restringir itens altera o esquema enviado à IA. As avaliações usam a API paga, então só rodam com a autorização do dono. Até lá, a validação usa a IA simulada e o teste de esquema.
- **Dados de produção**: o script de variantes grava em `mesocycle_plans`. Ele simula por padrão, guarda o backup fora do repositório, ignora sessões concluídas e só é aplicado com confirmação.
- **Bundle da web**: o catálogo pode pesar. As demonstrações entram em um chunk carregado sob demanda, com o tamanho medido na etapa 2.
  - **Medição da etapa 2 (T021, 2026-11-08, `pnpm --filter @helux/web build`)**: First Load JS de `/workout` foi de 179 kB para 182 kB, e o de `/treinos` de 191 kB para 195 kB (motor + partes do desenho). Sem `"sideEffects": false` em `@helux/exercises`, o banco de força inteiro (~97 kB brutos) entrava no bundle pelo `index.ts` e elevava os números para 195 kB e 208 kB. O chunk do registro de demonstrações ainda não aparece porque nada chama `loadDemo` antes da etapa 4; medir de novo em T057.
  - **Medição da etapa 4 (T057, 2026-11-08)**: `/workout` foi de 182 kB para 199 kB, `/treinos` de 195 kB para 211 kB e `/treinos/proximo` ficou em 194 kB. O aumento vem do catálogo de força (~90 kB brutos, ~24 kB gzip, num chunk compartilhado), que a tela agora lê para resolver orientação, músculos e equipamento. O registro de demonstrações continua num chunk sob demanda (~4 kB, carregado por `loadDemo`). Se o peso incomodar, o próximo passo é carregar também o catálogo sob demanda, ao abrir a folha.
- **Fidelidade em cenas complexas**: itens como natação e o circuito são difíceis de representar. Se a revisão recusar um deles, o caminho é melhorar a cena ou usar legenda; a lista só fecha quando o item for aprovado.
- **Comentários no PR**: o workflow precisa de permissão de escrita, então não roda em PRs de fork. Hoje o repositório só recebe PRs internos.

## Complexity Tracking

| Violação | Por que é necessária | Alternativa simples rejeitada |
|:---|:---|:---|
| Novo pacote `@helux/exercises` (Princípio V) | A web precisa do catálogo e não pode depender de `@helux/ai`, que leva o SDK de IA | `@helux/types`, como o cardio: o volume de dados e o motor não cabem em um pacote só de tipos, consumido por todos |
| Dois caminhos de renderização durante a transição | Publicação por etapas (FR-032): item pendente mantém a animação atual | Publicar tudo de uma vez: recusada pelo dono do produto. O caminho antigo é removido na etapa 8 |
