# Quickstart: Módulo de rotinas diárias e complementares (030)

## Rodar no worktree `030-rotinas-complementares`

```powershell
cd C:\Users\Doug\Documents\dev\helux\.worktrees\030-rotinas-complementares
pnpm install
pnpm --filter @helux/api dev
pnpm --filter @helux/web dev
```

Sem backend: modo mock da spec 021 (`NEXT_PUBLIC_DATA_SOURCE=mock` em `apps/web/.env.local`, ou Dev Bar → "Usar dados mockados"). As personas trazem as 3 rotinas complementares calculadas e registros de execução na semana.

## Migração

```powershell
# local
supabase db reset
# produção: aplicar a migração 20261109000000_030_complementary_routines.sql
```

## Testes

```powershell
pnpm --filter @helux/types test
pnpm --filter @helux/workouts test
pnpm --filter @helux/ai test
pnpm --filter @helux/api test
pnpm --filter @helux/web test
pnpm -r typecheck
```

## Roteiro Manual de Validação

### US1 + US3: Executar rotinas no mesmo dia sem afetar o treino de academia
1. Na **Home**, verificar o cartão do treino de academia (ex.: `Treino B`) e logo abaixo a seção **Rotinas do Dia** com **Alongamento & Mobilidade**, **Core / Abdominal** e **Cardio**.
2. Iniciar o treino de academia (`Treino B`), marcar 1 série como concluída e voltar para a Home (deixando o treino de academia em andamento).
3. Na seção **Rotinas do Dia**, tocar em **Cardio** → verificar a recomendação de zona/modalidade → informar `25 min`, esforço `Moderado` e tocar em **Concluir cardio** (< 15 s, SC-003).
4. Verificar que o Cardio aparece como **Feito hoje** (`1/3 sem.`), que a sessão `Treino B` continua sendo a sessão atual da fila e que, ao reabrir `/workout`, a série marcada antes continua salva (SC-001).
5. Tocar em **Alongamento & Mobilidade** → usar o cronômetro regressivo de sustentação e concluir os movimentos com um toque sem digitar carga em kg.
6. Tocar em **Core / Abdominal** → concluir as séries por repetições/tempo com descanso curto e finalizar.

### US2 + US4: Prescrição determinística, condições articulares e ajustes instantâneos
1. Com condição articular de joelho ativa (ex.: reconstrução de LCA / artrose), abrir **Treinos** → sub-aba **Rotinas**.
2. Conferir que o **Cardio** prescreve modalidade sem impacto (ex.: Bike ergométrica ou Elíptico), o **Alongamento & Mobilidade** prioriza quadril, tornozelo e posterior sem sobrecarga articular, e cada rotina explica como potencializa os treinos.
3. Tocar em **Ajustar** na rotina de Alongamento → mudar de `10 min` para `5 min` e frequência de `5×` para `7×` na semana → Salvar.
4. Verificar que a lista de exercícios e a meta semanal (`x/7`) mudam instantaneamente (< 100 ms, sem chamada de IA).

### US5: Sinergia entre turnos (manhã e noite)
1. Num dia em que a sessão pendente da academia é de membros inferiores, abrir a rotina complementar de **Cardio**: verificar o aviso recomendando manter ritmo leve/baixo impacto para não comprometer o treino de pernas à noite.
2. Após concluir **Cardio** e **Alongamento & Mobilidade** pela manhã, abrir a sessão de academia da noite: verificar que os itens equivalentes da `volta-calma` mostram o selo **"Já cumprido hoje nas Rotinas"** (SC-004).
