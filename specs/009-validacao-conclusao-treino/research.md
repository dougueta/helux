# Research: Validação de Conclusão de Treino

Nenhum `[NEEDS CLARIFICATION]` restou do `spec.md` (decisão de produto já vinha confirmada antes da spec ser escrita). Este documento registra as 3 decisões técnicas tomadas durante o planejamento, para contexto de quem for implementar.

## Decisão 1 — Validação de "todo exercício vazio precisa vir marcado skipped"

**Decisão**: usar `z.object(...).superRefine()` no `SessionBodySchema`, iterando `exercises` e emitindo uma issue por item que tenha `sets.length === 0` sem `skipped: true`.

**Rationale**: um `.min(1)` simples no array `exercises` ou em `sets` resolveria só o caso "totalmente vazio" (US2), não o caso "alguns exercícios pulados, outros não" (US1) — que é o caso mais comum na prática. `superRefine` permite a regra condicional por item sem introduzir uma biblioteca nova ou uma segunda camada de validação.

**Alternativas consideradas**: validar isso só no frontend (rejeitado — FR-008 exige que a API também rejeite, não pode ser contornável por uma chamada direta); criar um schema `SkippedExerciseSchema` totalmente separado e usar `z.union` (rejeitado — mais complexo que necessário para uma regra de 3 linhas, viola Simplicity/YAGNI).

## Decisão 2 — Sem migration nova

**Decisão**: `skipped?: boolean` entra como campo opcional dentro do item de `exercises`, que já é persistido como JSON (`workout_sessions.exercises` recebe o array diretamente via `supabase.insert`, sem colunas relacionais por exercício).

**Rationale**: nenhuma migration SQL necessária — o Postgres/Supabase não valida a forma interna de uma coluna JSON. Sessões antigas continuam válidas (o campo é opcional, tratado como "desconhecido" por quem futuramente ler o histórico).

## Decisão 3 — Diálogo de confirmação reaproveita o padrão visual do `ExerciseSheet`

**Decisão**: `FinishWorkoutConfirmDialog` usa o mesmo padrão de overlay/backdrop já estabelecido em `ExerciseSheet.tsx` (`position: fixed`, `zIndex`, `backdropFilter: blur`), em vez de introduzir um componente `Modal` genérico novo em `components/ui/`.

**Rationale**: não existe hoje nenhum componente de modal/dialog genérico no design system do app — criar um agora, para um único caso de uso, seria uma abstração prematura (viola Simplicity/YAGNI, Princípio V da constituição). Se uma segunda necessidade de diálogo aparecer (ex: na spec 011, confirmação de ajuste de treino por cansaço), aí sim vale extrair um `components/ui/Dialog.tsx` compartilhado — mas essa decisão fica para quando o segundo caso de uso existir de fato.

**Alternativas consideradas**: extrair um `Dialog` genérico agora, antecipando a spec 011 (rejeitado — a spec 011 ainda não foi planejada em detalhe, extrair cedo demais arrisca desenhar a abstração errada).
