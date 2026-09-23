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
