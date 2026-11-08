# Research: Banco de exercícios coerente com demonstração

**Feature**: 028 | **Date**: 2026-11-04

## Situação medida

- **Banco**: 122 exercícios e 30 animações; só 6 exercícios têm animação exclusiva.
- **Variantes**: 60 de 122 exercícios têm variante de outro grupo muscular principal, porque `buildVariants` filtra só por padrão.
- **Planos salvos** (consulta somente leitura em `mesocycle_plans`, sem dados pessoais): todo exercício de força tem variantes e, portanto, demonstração. Os 31 nomes distintos de aquecimento (14), volta à calma (12), mobilidade (4) e cardio (1) não têm.
- **Avaliações da IA**: 85 nomes livres distintos em planos sintéticos. Muitos são a mesma coisa escrita de outro jeito ("Alongamento de peitoral na parede", "no batente", "no batente da porta").

## R1. Modelo visual

**Decision**: Manter a figura articulada em SVG, com os tokens atuais do Design System.
**Rationale**: Decisão do dono do produto na clarificação. Acompanha os temas, não tem licença nem custo recorrente e não depende de fornecedor para exercícios novos.
**Alternatives considered**: Bibliotecas de GIF ou vídeo e geração por IA: recusadas.

## R2. Vínculo da demonstração

**Decision**: Cada item tem um `id` estável e uma entrada de demonstração própria. A escolha por regras (`motions.ts`) é removida no final.
**Rationale**: O erro atual vem de deduzir a demonstração da categoria. Com o vínculo direto, a cobertura passa a ser verificável item a item (FR-004, FR-023).
**Alternatives considered**: Mais regras e mais chaves: mantêm o problema e crescem sem controle.

## R3. Identidade e nomes

**Decision**: O `id` identifica o item no catálogo, mas os planos e o histórico continuam ligados pelo nome. Nenhum nome é removido ou alterado nesta entrega, e um teste congela a lista dos 122.
**Rationale**: `progression.ts`, `cycle-analysis.ts`, `session-edit.service.ts` e o histórico comparam `name`, e `PlannedExercise` não guarda id. Renomear quebraria a progressão (FR-017). A spec permite unificar duplicados, mas não exige, e fica para outra entrega.
**Alternatives considered**: Migrar todo o histórico para ids: grande, arriscado e sem ganho para o usuário agora. Tabela de aliases: só faz sentido quando houver renomeação.

## R4. Novos dados sem mudar restrições nem volume

**Decision**: `equipment` continua sendo o filtro de equipamento disponível, e `muscleGroup` continua sendo o grupo de volume semanal. Os novos campos `gear` (implemento real) e `muscles` (músculos reais) atendem a etiqueta, a demonstração, o mapa e as variantes.
**Rationale**: `constraints.ts` filtra por `equipment`, e `method-validation.ts` conta séries por `muscleGroup`. Alterar esses valores mudaria os planos gerados. Exemplo: Cadeira Adutora segue contando para `quadriceps`, mas mostra `adutores`.
**Alternatives considered**: Dividir o enum `maquina-cabo`: mudaria o onboarding, as restrições e a pontuação genética.

Mudanças pontuais de `pattern` ou `muscleGroup`, se a revisão encontrar erro real, entram em `bank-review.md` com justificativa e teste de regressão. A carga articular só muda com justificativa (FR-017).

## R5. Motor de animação

**Decision**: Mesmo desenho, com três evoluções:

1. **Várias fases**: lista de poses em vez de início e fim, com modos `reps`, `hold`, `alternate` e `cycle`.
2. **Interpolação por ângulo**: cada osso gira em torno da articulação anterior. Isso produz arcos reais e mantém o comprimento dos membros, que hoje encolhem na interpolação em linha reta.
3. **Apoio fixo**: a cadeia parte do ponto que não se move (`foot`, `hand`, `hip`, `seat`), então os pés não escorregam em um agachamento.

Novas partes: braço e perna do lado oposto (unilaterais, alternados), novas cenas (banco reto e inclinado, máquina, barra, parede, degrau, solo) e novos implementos (kettlebell, cabo, máquina, Smith, corda, elástico, roda).
**Rationale**: Atende ao pedido de um movimento mais completo sem mudar o que o dono gosta. Testes objetivos cobrem a física: variação do comprimento dos ossos abaixo de 3% e apoio sem deslocar mais de 1 unidade.
**Alternatives considered**: Biblioteca de animação ou modelo 3D: dependência e mudança de visual sem necessidade.

## R6. Movimento base com particularidades

**Decision**: `DemoSpec` aponta para um movimento base e define implemento, cena, ajustes de pose e legenda. Diferenças que a figura não mostra bem, como a pegada, vão para a legenda (FR-003).
**Rationale**: Reduz o trabalho de 122 movimentos para uma estimativa de 60 a 80 bases, a confirmar depois do piloto, e correções na base beneficiam toda a família.
**Consequência**: Alterar uma base muda o hash de todos os itens que a usam e exige nova aprovação deles (FR-025). É o comportamento correto, mas pede lotes bem definidos.

## R7. Onde a web lê os dados

**Decision**: A tela lê o catálogo no próprio bundle e resolve pelo `id` da variante ou pelo nome do exercício. Os campos salvos no plano (`cues`, `muscles`, `tempo`, `motion`) ficam como fallback de compatibilidade.
**Rationale**: Atende planos antigos sem migração (FR-005), sessões ativas em `localStorage` e conexão instável. `notes` continua vindo do plano, porque é personalizado (FR-020).
**Alternatives considered**: Enriquecer na API: não cobre a sessão salva no navegador e exige rede. Novo endpoint: adiciona falha de rede no meio do treino.

As demonstrações entram em um chunk sob demanda, para não pesar nas demais telas.

## R8. Variantes de planos existentes

**Decision**: Script único `refresh-plan-variants`, que recalcula `variants` e `match` nas sessões **não concluídas** dos planos ativos, usando a genética de cada pessoa ou o perfil neutro.
**Rationale**: A pontuação depende da genética, disponível só na API, e a tela de leitura não a carrega hoje. Uma execução resolve o caso (FR-035) sem custo permanente em cada leitura.
**Segurança**: Simula por padrão e mostra o que mudaria. Com `--apply`, grava um backup fora do repositório, que é público. Sessões concluídas e o histórico não são alterados. A aplicação depende da confirmação do dono do produto.
**Limite aceito**: Um treino em andamento mantém a lista salva no navegador até terminar, o que também preserva a variante ativa.
**Alternatives considered**: Recalcular em toda leitura: consulta extra e mais código para um caso que só ocorre uma vez.

## R9. Regra de variantes

**Decision**: Candidato válido quando tem o mesmo `pattern` e ao menos um músculo principal em comum, ou um par da tabela explícita de afinidades (`gluteo` ↔ `posterior`, só em `dobrar-quadril`). O restante da seleção não muda: um por equipamento, sem preencher quando não houver opção coerente. Os equivalentes da spec 013 seguem como estão, com a etiqueta.
**Rationale**: Corrige o erro medido, em especial nos isolamentos, sem mexer na pontuação (FR-012, FR-013).

## R10. Catálogo de preparação e geração pela IA

**Decision**: Cerca de 45 itens, consolidados a partir dos planos reais e das avaliações (ver [data-model.md](./data-model.md)). O esquema da IA troca `name` livre por um enum desse catálogo. Séries de aproximação viram um item próprio que aponta para o exercício de força (`approachOf`, FR-030). Um item fora do catálogo é tratado pela nova regra `item-fora-do-catalogo`, com troca determinística pelo item da mesma fase e região.
**Rationale**: Sem catálogo não há o que vincular. O enum impede o erro na origem, como já acontece com os exercícios de força (024 R17).
**Cobertura**: Teste exige ao menos 2 itens por região em `REGIONS`, com ao menos 1 sem equipamento, para não perder a capacidade de prescrever para uma condição de saúde (FR-028). Itens livres já ficam fora das regras de carga (`constraints.ts`), e isso não muda.
**Planos antigos (FR-031)**: Correspondência só por nome normalizado exato ou por lista curada de nomes conhecidos. Nomes com mais de um exercício ou ambíguos ("Séries de aproximação no agachamento e no supino") mostram o aviso. Busca aproximada foi recusada, porque poderia mostrar o exercício errado.

## R11. Evidência no PR

**Decision**: Workflow `demo-evidence.yml`, em cada PR que altere o catálogo:

1. Sobe a web em modo mock (021) e abre a galeria com Playwright em 390 × 844.
2. Para cada item cujo hash difere do aprovado, captura início, meio e fim, além de um GIF, com `gifenc` e `pngjs`.
3. Publica na branch órfã `demo-evidence/pr-<n>`, sem entrar no histórico do código, e atualiza um único comentário no PR, com link fixado por commit (`blob/<sha>/...?raw=true`).
4. Apaga a branch quando o PR é fechado.

**Rationale**: Segue o fluxo pedido pelo dono do produto. Um print não mostra movimento, então a evidência inclui GIF e quadros. O GitHub não oferece API para anexar imagens a um comentário, por isso os arquivos precisam estar no repositório. O link por `blob` continua funcionando se o repositório virar privado, para quem estiver autenticado.
**Determinismo**: A captura usa `phase` fixo em vez de relógio, o que evita testes instáveis e GIFs diferentes a cada execução.
**Alternatives considered**: Artefatos do Actions: exigem baixar um zip e não aparecem no PR. Commitar imagens na branch da feature: faz o histórico crescer para sempre.

## R12. Aprovação e trava

**Decision**: `pending.json` lista os itens não aprovados, e `approvals.json` guarda `id → hash`. O hash cobre a demonstração resolvida, incluindo a base, e a orientação. A tela só consulta `pending`: o item fora da lista usa a demonstração nova.

- **Teste do catálogo**: todo item fora de `pending` precisa ter demonstração, orientação e hash igual ao aprovado.
- **`demos:check-pending` no CI**: compara com a branch base; adicionar um id à lista falha, e isso também barra item novo pendente (FR-032).
- **Aprovar**: o dono aprova no PR, indicando todos ou alguns itens, e `demos:approve` grava o hash e tira o item da lista. O merge é feito pelo dono.

**Rationale**: Tudo fica versionado com o código, sem banco nem tela administrativa, e funciona no CI sem credenciais.
**Limite aceito**: O script não comprova quem aprovou. Em um projeto de um dono, o merge é o controle final; autenticar a aprovação seria complexidade sem necessidade atual.
**Alternatives considered**: Tabela no banco: faria o CI depender de produção. Comando em comentário de PR: conveniente, mas pode ser acrescentado depois sem mudar o formato.
