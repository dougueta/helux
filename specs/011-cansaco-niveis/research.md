# Research: Cansaço Percebido com Níveis (011)

## R1 — Onde calcular a prévia "o que muda"

- **Decision**: função pura `previewTirednessChoice` em `@helux/workouts`, executada no cliente com os `plannedExercises` que `GET /workout/latest-plan` passa a devolver.
- **Rationale**: a prévia precisa ser instantânea e idêntica ao que a API vai aplicar; uma única implementação compartilhada garante isso.
- **Alternatives**: endpoint `POST /preview` (latência extra e duplicação); calcular diff só depois de salvar (viola FR-010 — seria alerta *depois* da mudança).

## R2 — Pacote para a lógica de domínio

- **Decision**: `@helux/workouts` (TS puro, depende só de `@helux/types`).
- **Rationale**: `@helux/ai` depende do SDK da Anthropic e não deve entrar no bundle da web; `@helux/types` só tem tipos.
- **Alternatives**: novo pacote `@helux/tiredness` (overhead de workspace para um módulo); copiar para a web (duplicação).

## R3 — Persistência do nível

- **Decision**: reaproveitar `daily_tiredness_signals` (única por usuário+dia) e adicionar `level text` (check nos 4 valores) e `override_automatic boolean default false`. A coluna `level` é adicionada com default `'exausto'` (para converter as linhas legadas — FR-015) e o default é removido em seguida.
- **Rationale**: mesma granularidade (1 por dia), RLS já existente, upsert já usado.
- **Alternatives**: nova tabela (migração de dados e RLS duplicada sem ganho).

## R4 — Mapeamento HRV → nível e ajuste

- **Decision**: HRV ≥ 60 → normal; 40–59 → cansado; < 40 → exausto. Ajuste por "tier": ótimo/normal → nenhum; cansado → −1 série (mín. 2); exausto → −1 série (mín. 2) e −10% de carga em pesos `NNkg` (arredondado a 0,5 kg; outros formatos intactos).
- **Rationale**: preserva os limiares da spec 006/008; discordância definida pelo tier (resultado), não pelo rótulo.
- **Alternatives**: redução de carga para "cansado" também (mais agressivo que o comportamento atual sem pedido do usuário).

## R5 — Cache do plano no cliente

- **Decision**: após salvar, `refetch()` (limpa o cache local e busca de novo). Adicionalmente, `useWorkoutPlan` descarta o cache local se `today.tiredness.date` for diferente da data de hoje (UTC, mesma convenção da API), evitando exibir o nível de ontem.
- **Rationale**: FR-012 / SC-004 e não reintroduzir TD-006.

## R6 — Contrato da API de cansaço

- **Decision**: `GET /api/tiredness-today` → `TirednessAssessment`; `PUT /api/tiredness-today` `{ level, overrideAutomatic }` → `TirednessAssessment`. POST/DELETE (binários) removidos — a web é o único cliente.
- **Rationale**: o GET é o ponto de consumo reaproveitável pela spec 015 (FR-014).


## R7 — Correções da verificação manual (2026-09-22)

- **CORS**: `@fastify/cors` em `apps/api/src/app.ts` lista os métodos permitidos explicitamente (`GET, HEAD, POST, DELETE`); o `PUT` introduzido em R6 não passava no preflight. **Decision**: incluir `PUT` na lista (mantendo a lista explícita). Teste via `buildApp()` + `app.inject` com `OPTIONS` e `access-control-request-method: PUT`, pois os testes de rota isolados não registram o CORS. **Alternativa rejeitada**: trocar `PUT` por `POST` no contrato — contornaria o sintoma e deixaria a armadilha para o próximo método.
- **Diálogo coberto pelo menu**: o `NavBar` é `fixed` com `z-50` e vem depois no DOM; o diálogo também usava `zIndex: 50`, então o menu ficava por cima. **Decision**: renderizar o `TirednessDialog` via portal em `document.body` com camada dedicada `zIndex: 60` (constante exportada `TIREDNESS_DIALOG_Z_INDEX`), acima do menu, e com padding inferior que respeita a safe area. Verificável em teste: o backdrop é filho direto de `document.body` e seu `z-index` é maior que 50. **Alternativa rejeitada**: esconder o `NavBar` enquanto o diálogo está aberto (acoplaria o layout ao estado da Home).
- **Cache de formato antigo**: **Decision**: `useWorkoutPlan` descarta o cache de um plano de mesociclo (`mesocycleId` preenchido) cujo `today` não tem `tiredness` (formato anterior à 011), além do caso de outro dia (R5). Planos sem `today` (ex.: `status: 'generating'`) e o plano legado do botão "gerar" (`mesocycleId: null`, que nunca traz avaliação) continuam aproveitando o cache.

## R8 — Correções do code-review do PR #7 (2026-09-22)

- **Dockerfile da API sem `@helux/workouts`**: o `apps/api/Dockerfile` (usado pelo Render) copia manualmente `package.json` e fontes de cada pacote do workspace; a 011 adicionou `@helux/workouts` à API sem atualizar o Dockerfile, o que quebraria o `pnpm install --frozen-lockfile` ou a inicialização. **Decision**: adicionar as duas linhas `COPY` de `packages/workouts` (o pacote só depende de `@helux/types`, já copiado) e um teste de regressão em `apps/api/src/__tests__/dockerfile.test.ts` que percorre as dependências `@helux/*` da API **transitivamente** (lendo os `package.json` do workspace) e exige, para cada uma, `COPY packages/<nome>/package.json` e `COPY packages/<nome>/`. Verificação extra: `docker build -f apps/api/Dockerfile .`. **Alternativa rejeitada**: copiar `packages/` inteiro — mais simples, mas muda o cache de camadas e o escopo da imagem sem necessidade.
- **Toque duplo na etapa de discordância**: os botões "Manter o relógio"/"Sim, ajustar" não eram desabilitados durante `saving`; no modo início, quando não há mudanças a mostrar, "Sim, ajustar" salva e inicia direto, e um toque duplo disparava dois PUTs, dois `refetch` e dois `startWorkout`. **Decision**: (a) desabilitar os botões da etapa de discordância durante `saving`, como nas outras etapas; (b) proteger o `useTirednessFlow` contra reentrada com uma trava síncrona (`useRef`) em torno da gravação, já que `saving` (estado React) só é visível após o re-render e não bloqueia dois cliques no mesmo tick.

## Compatibilidade da migration com a API em produção (2026-09-22)

**Decisão**: a coluna `level` mantém o default `'exausto'` (a versão inicial da migration o removia com `drop default`).

**Rationale**: a migration é aplicada no banco compartilhado antes do deploy da API nova. A API de produção anterior (spec 008) grava o sinal binário "muito cansado" inserindo em `daily_tiredness_signals` sem `level`; com a coluna `not null` e sem default, esse insert falharia e o botão de cansaço da produção quebraria até o deploy. Com o default, o insert antigo vira `exausto`, que é exatamente o significado do sinal binário (mesma regra usada para as linhas legadas). A API nova sempre envia `level` explicitamente, então o default não afeta o comportamento novo.

**Alternativa rejeitada**: exigir deploy da API antes da migration — inviável, a API nova lê as colunas novas e quebraria sem elas.
