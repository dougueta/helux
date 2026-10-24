# Quickstart — validar a 024

Roteiro manual por fase, depois de `pnpm typecheck` e `pnpm test` verdes. Os passos com IA real custam dinheiro: rode só com aprovação do dono.

## Ações do dono fora do código (antes ou junto da F1)

1. Tornar o repositório `dougueta/helux` **privado** (GitHub → Settings → General → Change visibility).
2. Depois do merge da F1, remover `data/genetics/genera.json` do histórico do git (`git filter-repo --path data/genetics/genera.json --invert-paths` + push forçado) — operação destrutiva, feita pelo dono.
3. Subir o laudo pelo Perfil (`/perfil` → Genética → enviar arquivo).

## F0 — Linha de base

1. `pnpm --filter @helux/ai eval:treino` (mostra o custo estimado e pede confirmação).
2. Conferir a tabela por perfil × critério e o arquivo salvo em `__evals__/results/`.

## F1 — Privacidade e gerador único

1. `curl -X POST {API}/workout/generate` → `404`.
2. Com laudo enviado: `GET /genetic-profile` responde com os traços; o Perfil Integrado mostra a fonte "Genética" ativa em produção.
3. "Gerar novo plano" em Treinos → status "gerando" → plano novo salvo; abre igual em outro navegador.
4. Simular falha (chave da Anthropic inválida num ambiente de teste) → após 3 tentativas, Home mostra "não foi possível gerar" com a opção "Repetir a última semana".

## F2 — Onboarding e condições

1. Usuário com onboarding pendente e mesociclo concluído → Home leva ao onboarding.
2. Onboarding pré-preenchido com "Voltar a correr 5km sem dor no joelho" e o texto da lesão; converter em: Reconstrução de LCA (esquerdo, 2) + Reconstrução de LCA (direito, 1) + Artrose (joelho esquerdo) + Gota.
3. Cada condição mostra as regras. Uma condição "outra" gera regras pendentes no Perfil Integrado; aceitar uma.
4. Marcar crise de gota no joelho → treino do dia sem carga no joelho e explicação.

## F3 — Mesociclo semanal

1. Gerar o mesociclo do dono: 4 semanas (retorno de pausa), última de deload; cada grupo principal ≥ 2×/semana; cardio de impacto 0 (bike/elíptico/natação/remo); bloco de mobilidade de joelho/quadril.
2. Home e Treinos mostram "semana 1 de 4", o tipo de cada dia e o RIR alvo nos exercícios.
3. Nenhuma nota cita datas de uso anterior; nenhuma decisão tem só a genética como motivo.
4. Rodar o eval: segurança 5/5 em todos os perfis; total ≥ linha de base.

## F4 — Sensações e dados

1. Abrir o treino → check-in de antes (≤ 30 s); marcar dor 2 no joelho → exercícios de joelho trocados com explicação.
2. Concluir → check-in de depois; histórico mostra RPE e sensações.
3. Progresso → "Revisar treinos" lista as sessões de 84–167 s; excluir ou confirmar cada uma.

## F5 — Análise do ciclo

1. Com o perfil de teste "ciclo concluído", a análise lista estagnação no agachamento, dor recorrente no leg press e baixa aderência ao cardio.
2. O próximo ciclo troca o leg press, muda o estímulo do agachamento e propõe outro formato de cardio, citando os achados nas decisões.
3. Dois check-ins com cintura estável e objetivo emagrecimento → +1 cardio, explicado com os números.
