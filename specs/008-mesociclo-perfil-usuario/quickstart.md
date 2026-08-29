# Quickstart: Personalização do Mesociclo por Perfil do Usuário e Cansaço Manual

## Rodando localmente

```bash
# na raiz do monorepo
pnpm install
pnpm --filter @helux/ai test         # testes do prompt/mesociclo com dados de perfil
pnpm --filter @helux/api test        # testes das rotas /api/profile, /api/tiredness-today
pnpm --filter @helux/web test        # testes de ProfileForm, TirednessToggle

# aplicar a migration nova (projeto Supabase real, ver reference-supabase-project na memória)
supabase link --project-ref wgrlavmynbingemdbkjg   # se ainda não estiver linkado
supabase db push --linked
```

## Fluxo manual de verificação (após implementar)

1. Acessar `/perfil` (pelo ícone no cabeçalho da Home), preencher objetivo, nível, tempo treinando e uma lesão fictícia, salvar.
2. Verificar `GET /api/profile` retornando os dados salvos.
3. Concluir o mesociclo ativo (ou aguardar a próxima geração automática) e conferir que:
   - A justificativa do novo `mesocycle_plans.rationale` menciona o objetivo declarado.
   - Algum exercício que agravaria a lesão declarada foi evitado ou adaptado, com a adaptação mencionada na justificativa.
4. Na Home, tocar em "Hoje estou muito cansado" (sem nenhum dado de HRV sincronizado) e confirmar que o treino do dia aparece com volume/carga reduzidos e o motivo visível.
5. Tocar novamente para desfazer a sinalização e confirmar que o treino volta à prescrição original (sem HRV).
6. Repetir o passo 4 com um dado de HRV baixo sincronizado ao mesmo tempo, e confirmar que o resultado não fica menos conservador do que qualquer um dos dois isoladamente (FR-009).
7. Apagar o perfil (ou usar uma conta nova sem perfil preenchido) e confirmar que a geração do mesociclo continua funcionando normalmente com os valores padrão (FR-005).

## Onde olhar primeiro no código

- `apps/api/src/services/plan-context.service.ts` — `gatherPlanInput`, ponto onde os valores hoje fixos (`userGoals`, `userLevel`) são lidos; passa a buscar `user_training_profile`.
- `packages/ai/src/mesocycle-prompts.ts` — `buildMesocycleSystemPrompt`/`buildMesocycleUserPrompt`, onde entram o novo bloco de "Alertas Situacionais" e as novas linhas de contexto (tempo treinando/parado).
- `packages/ai/src/recovery-adjustment.ts` — `applyRecoveryAdjustment`, referência para o novo parâmetro `manualTirednessToday`.
- `apps/api/src/routes/workout-latest-plan.ts` — ponto de leitura de `daily_tiredness_signals` junto com `health_samples`.
- `apps/web/src/app/checkin/` + `apps/web/src/hooks/useCheckin.ts` — referência de padrão para a nova tela `/perfil` e seu hook.
