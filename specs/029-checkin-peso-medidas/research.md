# Research: Check-in de peso e medidas (029)

Decisões técnicas tomadas a partir da spec e do código atual. Nenhum item ficou como NEEDS CLARIFICATION.

## R1 — Pesagens numa tabela própria; `body_checkins` vira o registro de medidas

**Decision**: Nova tabela `body_weights` (uma linha por usuário por dia, `unique (user_id, date)`). A tabela `body_checkins` continua existindo e passa a ser o **registro de medidas**: ganha `measured_on`, perde `month` (e o `unique (user_id, month)`) e perde `weight_kg`, que migra para `body_weights`.

**Rationale**: Pesagem e medidas têm frequências e regras de unicidade diferentes (FR-002 vs. vários registros de medidas). Manter o nome `body_checkins` evita mexer nas FKs de `diet_phases.start_checkin_id` e `diet_phase_calibrations.checkin_id`, que continuam apontando para o registro de medidas.

**Alternatives considered**: (a) Uma tabela só com linhas "tipo peso" e "tipo medidas": colunas quase todas nulas e unicidade condicional. (b) Renomear `body_checkins` para `body_measurements`: mais limpo no nome, mas obriga a recriar FKs, policies e índices sem ganho funcional.

## R2 — Dois campos de % de gordura no próprio registro de medidas

**Decision**: `body_checkins` ganha `body_fat_navy_pct` (calculado no servidor) e renomeia `body_fat_pct` → `body_fat_device_pct`, com `body_fat_device_source` (`bioimpedancia` | `adipometro` | `dexa` | `outro`). Um registro tem no máximo uma estimativa pela fita e um valor de aparelho (spec, Key Entities).

**Rationale**: A spec limita a dois valores por registro com origens fixas; uma tabela separada de leituras seria abstração sem segundo caso de uso (Princípio V).

**Alternatives considered**: Tabela `body_fat_readings` (N leituras por registro): flexível demais para a regra atual.

## R3 — Estimativa pela Marinha calculada no servidor ao salvar

**Decision**: `POST/PUT /api/measurements` lê altura e sexo do perfil e grava `body_fat_navy_pct` com `navyBodyFat` (`@helux/nutrition/biometrics`). Resultado fora de 3–60% ou entrada incompatível → `null`, e a resposta traz `navy_status` explicando o motivo (FR-009). O formulário continua mostrando a prévia ao vivo com a mesma função.

**Rationale**: O valor salvo precisa refletir o perfil no momento do registro (Edge Case de perfil alterado) e não pode depender do cliente. A função já é compartilhada.

## R4 — Peso de tendência: média simples de 7 dias com ≥3 pesagens

**Decision**: Função pura `trendAt(weights, date)` em `packages/nutrition/src/weight-trend.ts`: média das pesagens em `[date − 6, date]`; com menos de 3 pesagens → `null`. Arredondamento a 0,1 kg na exibição. Derivadas:
- `trendSeries(weights)` → um ponto por dia com pesagem (`null` onde não há tendência), usado no gráfico; segmentos não são ligados através de `null` (Edge Case do gap).
- `weeklyChange(weights, today)` → `trendAt(today) − trendAt(today − 7)` em kg e % (FR-004); `null` se faltar um dos dois.
- `referenceWeight(weights, date)` → `trendAt(date)` ou, sem tendência, a pesagem mais próxima em até 3 dias (FR-016).

**Rationale**: Decidido no clarify (Q2). Mesma função usada pela web (histórico, Home, confirmação de >3 kg) e pela API (dieta, perfil integrado, análise de ciclo) → Princípio IV.

## R5 — Recalibração sob demanda: preview + apply

**Decision**: Duas rotas: `POST /api/nutrition/phase/recalibration/preview` (só calcula, não grava) e `POST /api/nutrition/phase/recalibration` (recalcula no servidor e aplica). O apply não recebe metas do cliente; se os dados mudaram entre o preview e o apply, vale o recálculo, e a resposta traz o que foi aplicado. A recalibração automática no `POST /api/checkins` é removida (FR-021).

Avaliação (`evaluateRecalibration` no `diet-phase.service`):
1. Sem fase ativa ou perfil incompleto → `indisponivel`.
2. Base = data da última calibração efetiva (ou `started_on` da fase). Menos de 14 dias → `intervalo-curto` com `availableOn` (US3-4).
3. `trendAt(base)` ou `trendAt(hoje)` nulo → `faltam-pesagens` (FR-020).
4. Senão → `recalibrate()` (`@helux/nutrition/phase`) com `from/to` = pesos de tendência e cintura do registro de medidas mais recente até cada data; `bodyFatPct` pela regra de R7. Resultado `proposta`.

Aplicar grava `diet_phase_calibrations` (inclusive `manter`, que reinicia a janela de 2 semanas) com `metrics.trendFrom/trendTo` e atualiza `base_targets` se mudou. Descartar não chama a API. As mensagens de `recalibrate()` passam a dizer "Peso de tendência".

**Rationale**: O cliente nunca envia metas (não dá para aplicar valores adulterados). Um token de preview seria complexidade sem ganho para uso pessoal.

**Alternatives considered**: Apply com `expectedAfter` e 409 se divergir: protege contra uma corrida que, num app de um usuário, praticamente não acontece.

## R6 — Linhas `intervalo-curto` deixam de ser criadas

**Decision**: Com o preview, o intervalo curto vira só uma resposta, sem gravação. O enum `intervalo-curto` continua aceito no banco (linhas antigas), e `lastCalibration` continua ignorando essas linhas.

## R7 — % de gordura "efetivo" (dieta, perfil integrado, Home)

**Decision**: `effectiveBodyFat(measurements)` em `weight-trend.ts` (ou `body-composition.ts`): percorre os registros do mais recente para o mais antigo e devolve o primeiro valor existente, preferindo `navy` ao `device` dentro do mesmo registro (empate na data → fita). Retorna `{ pct, source, measuredOn }`.

**Rationale**: Clarify Q5 (opção A). Consumidores que comparam dois registros (análise de ciclo da 024) só calculam variação de % quando a origem é a mesma (FR-012).

## R8 — Consumidores existentes

| Consumidor | Hoje | Depois |
|:---|:---|:---|
| `nutrition-context.service` | 2 últimos check-ins; peso do mais recente; `checkinStale` > 35 dias | últimas pesagens de 35 dias + último registro de medidas; peso inicial = `trendAt(hoje)` ou última pesagem; `checkinWeight`/`checkinStale` mantêm os códigos e passam a olhar a pesagem |
| `diet-phase.service` `createPhase` | peso e % do check-in | peso de R4, % de R7; `start_checkin_id` = último registro de medidas (ou null) |
| `diet-phase.service` `recalibrateOnCheckin` | chamado no POST do check-in | removido; substituído por `evaluateRecalibration` + `applyRecalibration` (R5) |
| `cycle-analysis.service` + `checkinTrend` (024) | compara 2 check-ins por `month` | compara 2 registros de medidas por `measured_on` (meses = dias/30,4, mínimo 1); o peso de cada lado é `referenceWeight` na data; % só se a origem for igual |
| `integrated-profile.service` | resumo dos 2 últimos check-ins | peso de tendência + variação semanal, últimas medidas e % com origem |
| Home (`page.tsx` + `CheckinCard`) | último check-in mensal | peso de tendência (ou última pesagem), % efetivo com origem, cargas; lembrete de medidas > 28 dias (FR-018) |
| Mocks (021) | `bodyCheckins` com `month` | `bodyWeights` + `bodyCheckins` com `measured_on`; rotas novas no mock router |

## R9 — Gráficos sem dependência nova

**Decision**: Um componente `TrendChart` em SVG inline (linha da tendência + pontos das pesagens; uma série por origem no gráfico de % de gordura). A web não tem biblioteca de gráficos hoje.

**Rationale**: Princípio V; dois gráficos simples não justificam uma dependência.

## R10 — Ilustrações do guia de medição

**Decision**: Uma silhueta SVG inline com marcadores por medida; ao tocar em "Onde medir?" num campo, a folha (`Sheet`) mostra a silhueta com o ponto destacado e o texto da US4.

**Alternatives considered**: Imagens raster: mais trabalho de produção e não respeitam o tema escuro.

## R11 — Migração dos dados

**Decision**: Uma migração SQL única e transacional:
1. Cria `body_weights` com RLS.
2. `insert into body_weights (user_id, date, weight_kg) select user_id, created_at::date, weight_kg from body_checkins where weight_kg is not null on conflict do nothing`.
3. Adiciona `measured_on` (= `created_at::date`), torna `not null`; troca o índice por `(user_id, measured_on desc)`; remove o `unique (user_id, month)` e a coluna `month`.
4. Renomeia `arm_cm` → `arm_right_cm`, `leg_cm` → `leg_right_cm`, `body_fat_pct` → `body_fat_device_pct`; adiciona lados esquerdos, panturrilhas, ombros, peitoral, `body_fat_navy_pct`, `body_fat_device_source` (backfill `outro` onde há valor).
5. Backfill de `body_fat_navy_pct` com a fórmula da Marinha em SQL a partir do perfil atual, para os registros antigos com cintura e pescoço.
6. Remove `weight_kg` de `body_checkins`.

Registros que ficarem sem nenhuma medida, % ou carga (só tinham peso) são apagados depois do passo 2, exceto os referenciados por `diet_phases`/`diet_phase_calibrations` (as FKs são `on delete set null`, então apagar também é seguro; manter evita perder o vínculo histórico).

**Rationale**: FR-024/FR-025 e SC-005. Rodar no Supabase pelo fluxo de migrações já usado (`supabase/migrations`).
