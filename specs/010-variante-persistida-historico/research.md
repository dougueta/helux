# Research: Variante Executada Persistida no Histórico

Nenhum `[NEEDS CLARIFICATION]` restou do `spec.md` (o único ponto ambíguo — qual variante registrar após uma troca no meio do exercício — foi resolvido com um default documentado em FR-006). Este documento registra as decisões técnicas tomadas durante o planejamento.

## Decisão 1 — Travar a variante executada na primeira série registrada, não reavaliar a cada série

**Decisão**: adicionar um novo mapa `executedVariantByExerciseIndex: Record<number, string | undefined>` ao estado do treino ativo. Em `toggleSetDone`, na transição para `done: true`, se o índice do exercício ainda não tem entrada nesse mapa, grava-se ali o valor atual de `variantByExerciseIndex[exerciseIndex]` (podendo ser `undefined`, significando "nenhuma troca — variante recomendada"). Trocas de variante feitas depois (via `selectVariant`) continuam atualizando `variantByExerciseIndex` normalmente (para fins de exibição/demonstração), mas não tocam mais em `executedVariantByExerciseIndex`.

**Rationale**: implementa FR-006 exatamente como especificado, sem exigir nenhuma mudança no shape de `SetState` (não é preciso guardar "qual variante" por série individual) — o registro histórico continua sendo um item por exercício, não por série+variante. Reaproveita o padrão já existente de `variantByExerciseIndex` (mesmo formato de mapa por índice), só adicionando uma segunda leitura "congelada".

**Alternativas consideradas**:
- Guardar a variante em cada `SetState` individualmente (rejeitado — expande o modelo de dados de série para resolver um edge case raro, viola Simplicity/YAGNI; a spec já assume que o registro histórico é "um item por exercício", herdado da spec 009).
- Usar sempre a variante ativa no momento da finalização, sem travar na primeira série (rejeitado — isso significaria que reabrir o `ExerciseSheet` só para *olhar* outra variante, sem nunca registrar séries nela, mudaria retroativamente o que foi salvo; a spec exige que a variante registrada reflita o que foi *de fato executado*).

## Decisão 2 — Formato do campo `executedVariant`: `{ name, match }`, não o objeto `Variant` completo

**Decisão**: `executedVariant?: { name: string; match: number }` em `ExerciseSet` (`packages/types`).

**Rationale**: o histórico (`history/[id]/page.tsx`) só precisa exibir o nome da variante e, opcionalmente, seu score de fit — os demais campos de `Variant` (`equip`, `level`, `motion`, `implement`, `why`, `rec`, `betterFit`) são metadados de apresentação da demonstração em vídeo/seleção, sem valor para um registro histórico já concluído. Guardar o objeto inteiro seria dado morto no banco.

**Alternativas consideradas**: guardar só o `id` da variante e resolver nome/match sob demanda contra o plano do mesociclo (rejeitado — o mesociclo pode já ter sido regenerado/substituído quando o histórico for consultado depois, então o `id` sozinho não seria resolvível de forma confiável; `name`+`match` são um snapshot autocontido, mesmo padrão de `ExerciseSet.name` já ser um snapshot do nome do exercício, não uma referência).

## Decisão 3 — Sem migration nova; `WorkoutSessionRow` passa a importar `ExerciseSet` de `@helux/types`

**Decisão**: `executedVariant` entra como campo opcional dentro do item de `exercises`, já persistido como JSON (mesmo mecanismo de `skipped` da spec 009) — nenhuma migration SQL. Aproveitando a mudança, `apps/web/src/hooks/useWorkoutHistory.ts` para de duplicar manualmente o shape do item de exercício e passa a importar `ExerciseSet` de `@helux/types`.

**Rationale**: evita que o tipo do histórico (`WorkoutSessionRow.exercises`) fique dessincronizado do tipo real gravado pela API (`ExerciseSet`) — hoje já estava desatualizado (não tinha `skipped`, adicionado na spec 009, sem que `WorkoutSessionRow` fosse atualizado). Corrige essa duplicação lateral, alinhado ao Princípio IV (Shared Code via Packages) da constituição, sem introduzir abstração nova.

**Alternativas consideradas**: manter a duplicação e só adicionar `executedVariant` também em `WorkoutSessionRow` (rejeitado — perpetua o mesmo problema que já causou o tipo ficar desatualizado uma vez).

## Decisão 4 (incremento US4) — Helper puro `resolveExerciseDisplay` em vez de lógica espalhada no JSX

**Decisão**: centralizar em `apps/web/src/lib/exerciseDisplay.ts` a regra "variante alternativa ativa → exibir variante; caso contrário → exibir planejado" (título, referência ao planejado, fit, dica). `page.tsx` e `ExerciseSheet.tsx` consomem o resultado.

**Rationale**: hoje essa decisão já está duplicada e parcial (`selectedVariant`/`recVariant`/`fitScore` em `page.tsx`; `selectedVariant` de novo no sheet). A US4 multiplica os pontos de uso (título, cabeçalho, chip de dica, aba Execução), e `page.tsx` não tem teste de componente, então um helper puro é a forma mais barata de cumprir TDD e garantir SC-005/SC-006 (nenhum elemento contradiz a variante, e voltar à recomendada restaura tudo).

**Alternativas consideradas**: um hook (`useExerciseDisplay`), rejeitado porque não há estado nem efeito, então uma função pura basta; e substituir o exercício pela variante no estado do treino, rejeitado porque quebraria o registro histórico (que precisa do planejado em `name`) e a volta à recomendada.

## Decisão 5 (incremento US4) — "Variante alternativa" = variante ativa com `rec !== true`

**Decisão**: a variante recomendada é o próprio exercício planejado (mesmo nome; ver Assumptions da spec), então nunca conta como "alternativa": com ela ativa, a tela mostra o planejado com as dicas personalizadas. Só variantes com `rec !== true` trocam título, dica e referência. Um `variantId` que não existe mais na lista cai no planejado.

**Rationale**: é a mesma regra que `finishWorkout` já usa para decidir se grava `executedVariant` (variante travada ≠ recomendada), o que mantém a tela e o histórico consistentes.

## Decisão 6 (incremento US4) — Dicas: justificativa genética no lugar (FR-011, opção A); músculos e tempo ficam

**Decisão**: com uma variante alternativa ativa, a tela principal troca o chip `notes` pelo `why` da variante, e a aba Execução do sheet esconde `cues` e `notes` do planejado e mostra o `why`. O mapa muscular e o tempo continuam sendo os do planejado.

**Rationale**: decisão do usuário (opção A, 2026-09-22). Músculos e tempo ficam porque as variantes vêm do mesmo padrão de movimento (`buildVariants` filtra por `pattern`), então o grupo muscular é o mesmo, e `Variant` não tem mapa muscular próprio. Séries, repetições e carga sugerida não mudam (fora de escopo, spec 014).

## Decisão 7 (correções da revisão do PR #5, 2026-09-22) — Trava explícita e regra única de "recomendada"

**Problema 1**: a trava de `executedVariantByExerciseIndex` guardava `undefined` quando a primeira série era feita no exercício planejado. `JSON.stringify` descarta chaves com `undefined`, então, depois de recarregar a página, a trava sumia e uma troca posterior de variante passava a ser registrada no histórico, violando o FR-006. Além disso, desmarcar a série nunca liberava a trava.

**Decisão**: a trava passa a ser `Record<number, string | null>`, em que `null` significa "travado no exercício planejado". `null` sobrevive ao JSON. Quando a última série marcada de um exercício é desmarcada, a entrada da trava é removida. Estados legados no `localStorage` que já perderam a chave não são recuperáveis, mas o efeito só atinge treinos em andamento no momento do deploy.

**Problema 2**: `finishWorkout` e `ExerciseSheet` usavam `rec ?? variants[0]` como variante recomendada, e `resolveExerciseDisplay` (e o `recVariant` de `page.tsx`) usava só `rec`. Com variantes sem nenhuma `rec`, a tela mostrava uma variante alternativa que o histórico não registrava.

**Decisão**: exportar `recommendedVariant(exercise)` de `apps/web/src/lib/exerciseDisplay.ts` (`rec ?? variants[0]`) e usá-la em todos os quatro pontos. "Variante alternativa" passa a significar variante ativa cujo `id` difere do da recomendada, em vez de `rec !== true`.

**Alternativa rejeitada**: guardar o id da variante recomendada na trava em vez de `null`. Funciona, mas mistura "sem troca" com "trocou para a recomendada", e `null` deixa a intenção explícita.
