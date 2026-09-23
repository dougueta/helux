# Quickstart / Verificação manual — 011

## Pré-requisitos

1. Aplicar a migration `supabase/migrations/20260922000000_tiredness_levels.sql` no projeto Supabase **antes** de subir a API nova (a API lê `level`/`override_automatic`).
2. `pnpm install` (web e api passaram a depender de `@helux/workouts`).
3. Subir api (3001) e web (3000); logar com um usuário que tenha mesociclo ativo e treino pendente.

## Cenários

1. **Sem relógio, Home** — sem amostras de HRV nas últimas 48 h: a Home mostra o seletor com 4 níveis e "Não informado". Tocar "exausto" → aparece o resumo (séries −1, carga `NNkg` −10%). Cancelar → nada muda. Repetir e confirmar → card mostra treino reduzido e motivo "Você marcou "exausto" hoje". Recarregar a página → continua "exausto".
2. **Mudança sem efeito** — de "ótimo" para "normal": salva direto, sem resumo.
3. **Iniciar treino** — tocar "Iniciar treino": aparece "Como você está hoje?" com o nível vigente pré-selecionado. Continuar com "exausto" já vigente → resumo vs. planejado → confirmar → treino ativo abre com as séries/cargas reduzidas. Fechar a pergunta → não inicia.
4. **Relógio prevalece** — inserir amostra `hrv` = 45 nas últimas 48 h: Home mostra "cansado — indicado pelo relógio (HRV 45 ms)". Escolher "cansado" → sem confirmação de discordância. Escolher "ótimo" → "Seu relógio indica cansado, mas você marcou ótimo…"; recusar → nada muda; aceitar → resumo (séries voltam) → confirmar → Home indica escolha manual contra o relógio; recarregar → mantém.
5. **Treino em andamento** — com treino ativo aberto, mudar o nível na Home não altera o treino em andamento.
6. **Virada do dia** — no dia seguinte, o nível aparece como não informado (cache local de outro dia é descartado).
