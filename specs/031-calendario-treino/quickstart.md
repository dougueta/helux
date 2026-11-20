# Quickstart: Calendário visual de treino, saldo semanal e curiosidades do período (031)

## Rodar localmente

```powershell
cd C:\Users\Doug\Documents\dev\helux
pnpm install
pnpm --filter @helux/api dev
pnpm --filter @helux/web dev
```

Sem backend: modo mock da spec 021 (`NEXT_PUBLIC_DATA_SOURCE=mock` em `apps/web/.env.local`, ou Dev Bar → "Usar dados mockados"). As personas trazem histórico de sessões de academia, rotinas complementares e pesagens distribuídas ao longo das semanas do mês atual e do mês anterior.

## Testes

```powershell
pnpm --filter @helux/types test
pnpm --filter @helux/workouts test
pnpm --filter @helux/api test
pnpm --filter @helux/web test
pnpm -r typecheck
```

## Roteiro Manual de Validação

### US1 + US4: Tira semanal na Home e Calendário visual no Histórico
1. Abrir a **Home (`/`)** e localizar a tira semanal **Esta semana**:
   - Verificar os 7 dias (`S T Q Q S S D`) com marcadores distintos para dias de academia (`--accent`), rotinas complementares (`--success`) e o dia de hoje.
   - Tocar na tira semanal e confirmar que abre `/history` diretamente na visão **Calendário** (SC-003).
2. Na grade mensal:
   - Verificar os dias com treino de academia, dias com rotina complementar e dias com ambos (dois pontos lado a lado).
   - Tocar em um dia ativo e conferir o painel **Detalhe do Dia** logo abaixo da grade (sessões com link para `/history/[id]`, rotinas complementares e peso do dia).
   - Navegar para o mês anterior e voltar para o mês atual (verificando que o botão de próximo mês fica desabilitado no mês corrente).

### US2: Saldo da Semana (esforço, peso, volume e assiduidade)
1. Com o calendário aberto, observar a linha semanal destacada e o cartão **Saldo da Semana** logo abaixo.
2. Conferir os 4 blocos do Saldo da Semana:
   - **Assiduidade**: dias de academia concluídos vs. meta semanal + rotinas complementares concluídas;
   - **Esforço médio**: classificação (*Leve*, *Moderado*, *Forte*, *Muito forte*) + nota na escala `1–10` + delta contra a semana anterior;
   - **Peso corporal**: média da semana em `kg` + delta (`±kg`) contra a semana anterior;
   - **Carga & tempo**: volume em toneladas/kg, séries totais e minutos ativos somados.
3. Tocar em outra linha semanal do mês e verificar que o destaque da linha e todos os números e deltas do **Saldo da Semana** atualizam imediatamente sem salto de layout.

### US3: Curiosidades da Semana e do Mês
1. Rolar até a seção **Curiosidades** abaixo do Saldo da Semana.
2. Na aba **Semana**, verificar os cartões determinísticos gerados para a semana selecionada (ex.: equivalência de tonelagem em carros/pianos/malas, maior carga ou PR da semana, exercício mais trabalhado, tempo ativo).
3. Alternar o seletor para **Mês** e verificar que os cartões mudam instantaneamente para os destaques consolidados do mês inteiro (incluindo o dia da semana mais fiel e a tonelagem mensal equivalente).
