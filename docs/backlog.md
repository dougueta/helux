# Backlog de ideias — Helux

Ideias para virar spec depois (fluxo SDD: `speckit-specify` → `clarify` → `plan` → `tasks` → `implement`).
Nada aqui está decidido; cada item lista o que já se sabe e as perguntas em aberto.

---

## Onboarding do usuário

**Origem:** pedido do usuário durante o clarify da 018 (2026-10-13).

**Problema:** hoje o usuário cai direto no app sem dados de base. Perfil de treino, check-in e conexão com o Apple Health ficam espalhados e opcionais, e a 018 (nutrição) vai precisar de dados que o app ainda não pede (altura, idade, sexo, pescoço).

**Ideia:** um fluxo de primeiro acesso, curto e pulável por etapa, que deixa o usuário pronto para treino + dieta.

Etapas candidatas:
1. **Objetivo e experiência:** objetivo (hipertrofia, perda de gordura, recomposição, condicionamento), nível, tempo de treino, tempo parado, lesão atual (hoje em `user_training_profile`).
2. **Dados corporais fixos:** altura, data de nascimento, sexo (base da fórmula de calorias da 018 e do % de gordura pelo método da Marinha).
3. **Primeiro check-in:** peso e medidas com fita métrica (cintura, pescoço, quadril para mulheres), com guia visual de onde medir; % de gordura calculado na hora.
4. **Perfil genético:** status do `genera.json` (carregado ou não) e o que muda com ele.
5. **Dieta:** objetivo da fase de dieta e duração, restrições/preferências (vegetariano, alergias, alimentos que não come), número de refeições por dia.
6. **Saúde conectada:** como ligar o Atalho do Apple Health (HRV, sono, passos) — reaproveitar `docs/shortcuts-guide.md`.
7. **Fim:** gera o primeiro mesociclo e a primeira fase de dieta.

Perguntas em aberto:
- Obrigatório ou pulável? Quais etapas são mínimas para o app funcionar?
- Usuário que já usa o app (Doug) passa pelo onboarding ou só completa o que falta?
- Editar depois: tudo volta a ser editável no Perfil?
- Etapa de dieta só aparece depois que a 018 existir?

Dependências: 018 (nutrição) define os campos de dieta e corporais; 008 (perfil) já tem objetivo/nível.

---

## Spec 015 — Descanso personalizado

Descanso entre séries por exercício/genética/cansaço. Ponto de extensão pronto na 014: `restSecondsAfterSet` em `packages/workouts/src/workout-flow.ts` (ver notas em `specs/014-motor-treino-2/quickstart.md`).

## Volume inicial no retorno de pausa para quem tem experiência

**Origem:** relato do usuário após os primeiros treinos do mesociclo de 2026-10-28 (2026-10-29): "apenas duas séries para cada exercício", treino de 40–45 min parecendo curto.

**Problema:** `prescribeMethod` (`packages/workouts/src/method.ts`) trata qualquer pausa de 3+ meses como retorno e começa a semana 1 com 60% do volume (`start = 0.6`) e RIR 3, sem olhar o tempo de treino (o Doug treina há 15 anos e ficou 6 meses parado). Além disso, o arredondamento em `scaleExercise` achata tudo: 3 × 0,6 = 1,8 e 4 × 0,6 = 2,4 viram 2, então na semana 1 todo exercício fica com 2 séries (≈ 8–12 séries por sessão; na semana 3 são 13–20).

**Ideia:**
- Fator inicial do retorno de pausa conforme a experiência (ex.: 0,75–0,8 para quem treina há muitos anos; 0,6 continua para iniciante ou pausa longa).
- Arredondamento que preserve a diferença entre exercícios (o básico de 4 séries não deveria cair para o mesmo número do de 3).

Perguntas em aberto:
- Qual dado define "experiente": `training_time` (texto livre, precisaria de parse como `parseTimeOffMonths`), `level` ou os dois?
- O fator deve depender também da duração da pausa (6 meses ≠ 2 anos)?
- Condições como LCA reconstruído devem manter a rampa mais conservadora mesmo para experientes?
- Piso de séries por exercício básico na semana 1 (ex.: mínimo 3)?

## Limpeza de pendências técnicas

- Item B4 do roteiro de 2026-08-29.
- Hook órfão `apps/web/src/hooks/useRestTimer.ts` (sem uso; avaliar junto da 015).
- "Iniciar treino" na Home e na aba Treinos sobrescreve, sem aviso, um treino em andamento (`startWorkout` em `useActiveWorkout` substitui a sessão do `localStorage`). O preview da 026 já oferece "Continuar treino" nesse caso; falta fazer o mesmo na Home e na aba Treinos (observado no plano da 026, 2026-10-28).
- A ligação do `TirednessDialog` com o `useTirednessFlow` (16 props) e o fluxo de iniciar o treino estão duplicados entre `HomeClient` e `ProximoTreinoClient`; extrair um adaptador `<TirednessDialog flow={...} />` (revisão do PR #20, 2026-10-29).
- `pnpm --filter @helux/web lint` abre o assistente de configuração do ESLint do Next: o lint da web nunca foi configurado (observado na 026, 2026-10-28).

## Check-in (pós-029)

**Origem:** fora do escopo da spec 029 (check-in de peso e medidas), 2026-11-08.

- **Importar peso e medidas do Apple Health** pelo mesmo Atalho que já envia HRV, sono e passos (balança inteligente → `body_weights`). Pergunta: o que fazer quando a pesagem manual e a importada caem no mesmo dia?
- **Carga máxima estimada (1RM) calculada dos treinos**, no lugar de agachamento/supino/terra digitados no registro de medidas.
- **Fotos de progresso** (frente, lado e costas) ligadas ao registro de medidas. Dado sensível: depende da seção de LGPD abaixo.
- **Aviso de que já dá para recalibrar a dieta** (2 semanas desde a última calibração e tendência disponível), descartado no clarify da 029; reavaliar se o botão "Recalibrar dieta" ficar esquecido.

## LGPD — políticas de armazenamento de dados

Para quando sair do MVP: consentimento, retenção, exportação e exclusão de dados (genéticos e de saúde são dados sensíveis).

## `fly.toml`

Resolvido na spec 023: removido. O deploy da API usa só o Render (`render.yaml`); Fly.io fica como migração futura se o cold start do plano gratuito incomodar (ver `docs/deploy.md`).
