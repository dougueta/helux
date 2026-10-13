# Research: Motor de Geração de Treino 2.0

## R1 — Onde modelar a fase

- **Decision**: campo opcional `phase?: 'aquecimento' | 'principal' | 'volta-calma'` em cada `PlannedExercise`, mantendo a lista da sessão plana; ausência = principal. Normalização garante ordem aquecimento → principal → volta-calma.
- **Rationale**: todo o código atual (treino ativo por índice, ajuste de cansaço por índice, `WorkoutProgress`, variantes por índice, cache local) opera sobre uma lista plana; um campo opcional é 100% retrocompatível e não obriga migração do jsonb.
- **Alternatives considered**: três arrays na sessão (`warmup`, `exercises`, `cooldown`) — quebraria o contrato de `exercises` para a web antiga e exigiria reescrever o treino ativo e o ajuste de cansaço; tabela nova — desnecessária.

## R2 — Conteúdo de aquecimento/volta à calma fora do catálogo

- **Decision**: o catálogo continua obrigatório apenas para o principal; aquecimento e volta à calma são texto livre da IA (ex.: "Esteira leve", "Alongamento de peitoral"), com `sets` (normalmente 1) e `reps` descritivo ("5 min", "10 por lado"), `weight` livre ("—"). Não recebem enriquecimento de catálogo (cues/variantes/fit).
- **Rationale**: o catálogo (spec 013, em paralelo) não tem cardio/alongamento; não mexer nele evita conflito. `buildVariants` já devolve `[]` para nomes fora do catálogo, mas o planner pula o enriquecimento explicitamente para não casar nomes por acaso.
- **Alternatives considered**: adicionar entradas de mobilidade ao catálogo — conflita com a 013.

## R3 — Histórico dos itens de aquecimento/volta à calma

- **Decision**: não enviados ao `POST /api/workouts/sessions`; o payload contém só o principal. A confirmação de "exercícios pulados" considera só o principal.
- **Rationale**: evita séries com carga 0 contaminando volume/analytics/progressão e evita mudar o schema de histórico (zod exige `reps` inteiro positivo).
- **Alternatives considered**: gravar com `phase` no histórico — adiado (não há consumidor).

## R4 — Representação do biset

- **Decision**: `supersetGroup?: string` (rótulo arbitrário, ex. `"b1"`). Válido somente se exatamente 2 itens consecutivos do principal compartilham o rótulo; a normalização remove o campo nos demais casos.
- **Rationale**: um rótulo de grupo é mais robusto a erros da IA que `pairedWith` por nome (nomes podem divergir/duplicar) e é simétrico. Consecutividade simplifica a UI (a ordem do treino já coloca os dois juntos).
- **Alternatives considered**: `pairedWith: <nome>` — ambíguo com nomes repetidos; índice numérico — frágil após normalização/reordenação.

## R5 — Fluxo do biset e descanso (gancho da 015)

- **Decision**: função pura `nextStepAfterSet({ exercises, hasPendingSets, exerciseIndex })` em `@helux/workouts/workout-flow` devolve `{ restSeconds, goToExerciseIndex }`; o tempo vem de `restSecondsAfterSet(exercise, context)` que hoje devolve 0 para aquecimento/volta-calma, 0 para o 1º membro de biset com parceiro pendente e `DEFAULT_REST_SECONDS = 90` nos demais casos.
- **Rationale**: a página só aplica o resultado; a 015 substitui/estende `restSecondsAfterSet` (ex.: por cansaço/perfil) sem tocar a navegação.
- **Alternatives considered**: lógica inline na página — não testável e duplicaria regra na 015.

## R6 — Esforço percebido

- **Decision**: 4 níveis por exercício (`facil`=6, `moderado`=7, `dificil`=9, `limite`=10) gravados no campo `effort` (1–10) já existente de cada série concluída; sem relato → 8 (valor atual). Na regra, 7–8 = moderado, ≤6 = fácil, ≥9 = difícil/limite.
- **Rationale**: reaproveita o schema do histórico sem migração; o histórico antigo (tudo 8) cai em "moderado", equivalente à progressão dupla clássica.
- **Alternatives considered**: RPE por série — mais atrito (SC-006 pede 1 toque); RIR numérico — menos claro para leigos.

## R7 — Regra de progressão (dupla progressão autorregulada)

- **Decision**: para cada exercício do principal do mesociclo anterior, usar a execução mais recente no histórico desde `generated_at` do mesociclo anterior:
  - sem dados se: pulado, `executedVariant` presente, maior carga concluída = 0, faixa não numérica, exercício ausente do mesociclo anterior;
  - referência = maior carga concluída; `repsAtTop` = mínimo de reps nas séries concluídas com essa carga; `setsAtTop` = nº de séries com essa carga; completo = séries concluídas ≥ prescritas;
  - topo (completo e `repsAtTop ≥ max`): esforço ≤ 8 → aumentar `carga × base × nível` (base fácil 5%, moderado 2,5%; nível iniciante 1,5, intermediário 1, avançado 0,5), arredondado ao incremento (1 kg < 20 kg; 2 kg < 60 kg; 2,5 kg ≥ 60 kg), mínimo 1 incremento, teto 10% (se 1 incremento > 10%, aplica 1 incremento); esforço ≥ 9 → manter;
  - dentro da faixa (completo e `min ≤ repsAtTop < max`): fácil → +1 incremento; senão manter;
  - incompleto ou abaixo do mínimo: esforço ≥ 9 → reduzir 10% arredondado (mín. 1 incremento, nunca abaixo de 0); senão manter.
- **Rationale**: é a progressão dupla usada por treinadores (subir reps até o topo, depois carga), autorregulada por RPE; percentuais pequenos (2,5–5%) são o padrão para progressão sustentável; incrementos refletem anilhas/halteres comuns.
- **Alternatives considered**: estimar 1RM (Epley) e prescrever %1RM — mais sensível a ruído de reps com poucos dados; delegar à IA — requisito proíbe.

## R8 — Onde calcular e aplicar

- **Decision**: em `triggerBackgroundPlanGeneration`, quando o mesociclo ativo fica completo, `generateAndSaveMesocycle` recebe o mesociclo anterior; busca o histórico desde `generated_at` (data) com o cliente do usuário; calcula as decisões; passa-as em `PlanInput.loadProgression` para o prompt; após a IA, `normalizeSessionExercises` + `applyProgression` antes do insert. O bootstrap (sem anterior) e o botão "Gerar novo plano" (rota legada) não aplicam.
- **Rationale**: o ponto já existente de transição de mesociclo; aplicação pós-IA garante determinismo (FR-018).

## R9 — Retrocompatibilidade na web

- **Decision**: toda leitura de fase/biset passa por helpers (`exercisePhase`, `supersetPartnerIndex`) que tratam campos ausentes; `ActiveWorkoutState.effortByExerciseIndex` é opcional ao carregar do localStorage (`?? {}`), igual ao padrão de `variantByExerciseIndex`.
