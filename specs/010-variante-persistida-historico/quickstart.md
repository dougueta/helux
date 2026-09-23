# Quickstart: Variante Executada Persistida no Histórico

Passos para verificar manualmente contra o app rodando localmente (`pnpm dev`), após a implementação.

1. Iniciar um treino em que o exercício atual tenha variantes disponíveis. Abrir "Ver execução", ir para a aba "Variantes", escolher uma variante diferente da recomendada e tocar em "Usar esta variante" — confirmar que, de volta à tela principal, o nome da variante ativa aparece visível (não só o equipamento) e o indicador de fit muda para refletir o match da nova variante.
2. Registrar ao menos 1 série nesse exercício com a variante trocada, finalizar o treino normalmente e confirmar no histórico (`/history/[id]` da sessão salva) que o exercício aparece com a variante executada, junto com o nome do exercício originalmente planejado.
3. Completar um exercício normalmente, sem nunca trocar de variante, finalizar o treino e confirmar que no histórico esse exercício aparece exatamente como antes desta mudança — sem nenhuma indicação de variante.
4. Trocar de variante, registrar 1 série, trocar de volta para a variante recomendada (sem registrar mais nenhuma série), finalizar o treino — confirmar que o histórico registra a variante que estava ativa quando a primeira série foi registrada (FR-006) — não a variante recomendada, que só foi "visitada" depois de já ter uma série registrada.
5. Verificar que o indicador de fit no exercício ativo, quando nenhuma variante foi trocada, mostra o match real da variante recomendada (não mais um valor fixo como "96 fit" para todo exercício).

## Incremento US4 (2026-09-22)

6. Com um treino ativo, escolher uma variante alternativa no exercício atual e voltar para a tela principal — confirmar que o título principal **e** o cabeçalho mostram o nome da variante, que aparece uma referência secundária "variante de {exercício planejado}", e que o chip de dica mostra a justificativa genética da variante (não as dicas personalizadas do planejado).
7. Abrir "Ver execução" com essa variante ativa — confirmar que a demonstração, o equipamento e o nível são os da variante e que a aba Execução mostra a justificativa genética da variante no lugar das dicas do planejado.
8. Avançar para o próximo exercício e voltar — confirmar que o exercício continua exibido como a variante e que o cabeçalho acompanha o exercício em andamento (não fica fixo no primeiro do plano). Sair do treino e retomar em `/workout` — a variante continua ativa.
9. Tocar em "Voltar à recomendada" — confirmar que título, cabeçalho, dica e fit voltam a ser exatamente os do exercício planejado.
