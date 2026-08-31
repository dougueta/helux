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
