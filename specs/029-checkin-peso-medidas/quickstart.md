# Quickstart: Check-in de peso e medidas (029)

## Rodar

```powershell
pnpm install
pnpm --filter @helux/api dev
pnpm --filter @helux/web dev
```

Sem backend: modo mock da 021 (`NEXT_PUBLIC_DATA_SOURCE=mock` em `apps/web/.env.local`, ou Dev Bar → "Usar dados mockados"). As personas ganham pesagens diárias (com oscilação de ±1,5 kg) e registros de medidas.

## Migração

```powershell
# local
supabase db reset
# produção (projeto wgrlavmynbingemdbkjg): aplicar a migração 029 pelo fluxo usual
```

Antes de aplicar em produção, conferir com SQL: número de linhas de `body_checkins` com peso = número de linhas criadas em `body_weights`; % digitados antigos com origem `outro` (SC-005).

## Testes

```powershell
pnpm --filter @helux/nutrition test
pnpm --filter @helux/workouts test
pnpm --filter @helux/api test
pnpm --filter @helux/web test
pnpm -r typecheck
```

## Roteiro manual

### US1: pesagem e tendência

1. Check-in → **Registrar peso** → "82,4" → Salvar. Volta ao Check-in com a pesagem de hoje (< 15 s, SC-001).
2. Registrar de novo hoje "82,1": aviso de substituição; fica uma pesagem no dia.
3. Registrar ontem e anteontem (escolhendo a data): o resumo mostra o peso de tendência e a variação de 7 dias.
4. Tentar uma data futura: recusado.
5. Registrar "87,5" com tendência em 82: pede confirmação.
6. Histórico → aba Peso: pontos + linha de tendência; com < 3 pesagens nos últimos 7 dias, aviso de que falta pesagem.

### US2 + US4: medidas, % pela fita e guia

1. Perfil com altura e sexo. Check-in → **Registrar medidas**.
2. Ler o protocolo; tocar em "Onde medir?" na cintura e no braço: a folha mostra a silhueta e o texto.
3. Preencher pescoço e cintura, braço esq./dir.: a prévia mostra o % pela fita.
4. Salvar: o histórico mostra o % com origem "fita".
5. Abrir "Tenho uma medição de aparelho", informar 18% sem origem: erro; escolher Bioimpedância: salva ao lado da fita.
6. Histórico → aba Medidas: gráfico de % com uma série por origem.
7. Pescoço maior que a cintura: medidas salvas, sem % e com o aviso de inconsistência.

### US3: recalibração

1. Nutrição com fase ativa há ≥ 2 semanas e pesagens nas duas pontas (mock: persona com fase antiga).
2. **Recalibrar dieta** → proposta com metas atuais → novas e o motivo citando "peso de tendência". Descartar: nada muda.
3. De novo → Aplicar: metas mudam e a calibração aparece na lista.
4. Recalibrar logo depois: "Você poderá recalibrar a partir de …".
5. Sem pesagens na semana: "Faltam pesagens…".
6. Registrar pesagens e medidas: as metas não mudam sozinhas.

### US5: métricas e lembrete

1. Registro de medidas com % e pesagens próximas: massa gorda, massa magra e cintura/altura ("abaixo de 0,5").
2. Último registro de medidas com 29 dias (mock): lembrete na Home e no Check-in; com 10 dias, nada.

### Migração

1. Check-ins mensais antigos aparecem como pesagem + registro de medidas na data em que foram feitos, com os mesmos valores; braço/coxa no lado direito.
2. Calibrações antigas continuam na lista da Nutrição.
