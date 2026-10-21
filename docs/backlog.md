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

## Limpeza de pendências técnicas

- Item B4 do roteiro de 2026-08-29.
- Hook órfão `apps/web/src/hooks/useRestTimer.ts` (sem uso; avaliar junto da 015).

## LGPD — políticas de armazenamento de dados

Para quando sair do MVP: consentimento, retenção, exportação e exclusão de dados (genéticos e de saúde são dados sensíveis).

## `fly.toml`

Resolvido na spec 023: removido. O deploy da API usa só o Render (`render.yaml`); Fly.io fica como migração futura se o cold start do plano gratuito incomodar (ver `docs/deploy.md`).
