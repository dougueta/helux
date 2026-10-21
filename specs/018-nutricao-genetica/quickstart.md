# Quickstart: Módulo de Nutrição Esportiva Genética (018)

## Pré-requisitos

- `pnpm install` no worktree; migration `20261014002645_nutrition.sql` aplicada (local: `pnpm db:start` aplica as migrations; produção: `supabase db push` feito pelo usuário).
- `apps/api/data/genetics/genera.json` presente (sem ele o módulo funciona em modo padrão, com aviso).

## Testes direcionados

```bash
pnpm --filter @helux/nutrition test        # fórmulas, Marinha, fase, recalibração, dia, catálogo, trocas, horários
pnpm --filter @helux/genetics test         # parseGeneraNutrition
pnpm --filter @helux/ai test               # prompt e stream do agente (SDK mockado)
pnpm --filter @helux/api test -- nutrition checkins profile
pnpm --filter @helux/web test -- nutricao NavBar design-system-guard
```

## Verificação final (uma vez)

```bash
pnpm test && pnpm typecheck && pnpm build
```

## Validação manual

1. **Perfil:** abrir Nutrição sem altura/nascimento/sexo → formulário pede os três; salvar.
2. **Check-in:** registrar peso, cintura e pescoço → o check-in mostra o % de gordura (Marinha).
3. **Fase (US0):** iniciar fase "perder gordura" por 8 semanas → metas da fase aparecem (kcal, proteína ~2,2 g/kg).
4. **Dia (US1):** em Nutrição › Hoje, ver metas do dia, 5 refeições, badges "Sem lactose"; nenhum laticínio com lactose em nenhuma refeição; expandir uma refeição e ver a justificativa genética.
5. **Descanso:** marcar "hoje é descanso" → carboidrato cai; voltar para treino → sobe.
6. **Horário:** iniciar um treino → o pós-treino passa a "até 60 min após terminar"; concluir → pós-treino com hora no relógio e destaque.
7. **Cansaço (US3):** marcar "exausto" na Home → Nutrição mostra o card de recuperação (+água) com a orientação de recuperação.
8. **Troca (FR-010):** trocar um alimento pelo botão → opções do mesmo grupo, sem lactose; o total do dia continua perto da meta.
9. **Chat:** movido para a spec 022.
10. **Recalibração:** registrar outro check-in (≥ 2 semanas depois, ou ajustar a data em ambiente local) com perda menor que a esperada → Fase mostra "reduzir" com o motivo.
11. **Perfil genético (US4):** Nutrição › Perfil genético mostra os cards nas 3 categorias com status; abrir MCM6 → conduta prática.
12. **Sem genética:** renomear `genera.json` → aviso "personalização genética inativa" e plano padrão.

## Verificação final (T040, 2026-10-20)

- `pnpm test`: web 500, api 181, ai 121, workouts 100, nutrition 76, genetics 34, health 27, types 17, mobile 9 — tudo verde.
- `pnpm typecheck` (9/9) e `pnpm build` (2/2) verdes.

## Observações finais (T041)

- **Antes do deploy da API**: aplicar `supabase/migrations/20261014002645_nutrition.sql` no projeto (`supabase db push`). A tabela `nutrition_chat_messages` vem junto, mas fica sem uso (o chat foi para a 022).
- **US2 (chat)**: saiu da 018 em 2026-10-20 e virou a US4 da spec 022. A aba Nutrição agora tem Hoje · Fase · Perfil genético.
- **Pontos de revisão**: R5 (dia de treino por padrão + "hoje é descanso"). O R9 (latência do chat) passou para a 022.
- **Validação manual**: os passos 1–8 e 10–12 acima não foram feitos no navegador; ficam para o usuário.
