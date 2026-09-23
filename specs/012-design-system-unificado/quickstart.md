# Quickstart: Verificação Manual do Design System Unificado

Rodar o app local (`pnpm dev`, com API na porta 3001 e web na 3000), logado. Fazer as capturas nas larguras de **375 px** (celular) e **1280 px** (desktop).

1. **Regressão do reset (R3):**
   - Antes da troca do reset (commit anterior à remoção do Tailwind), capturar a tela de treino ativo, a Home e a folha "Ver execução".
   - Depois da remoção, capturar as mesmas telas na mesma largura.
   - Não pode haver diferença visível: espaçamentos, margens, botões e listas iguais.
2. **Percorrer as 11 telas** e comparar com a tela de treino ativo:
   - Telas: Hoje, Treinos, Treino ativo, Histórico, Detalhe do treino, Check-in, Histórico de check-ins, DNA, Perfil, Progresso e Login.
   - Cartões, bordas, texto secundário, etiquetas e badges de fit devem ter a mesma aparência.
   - Nenhum texto secundário pode estar branco, que era o sintoma do B3, e toda borda de cartão deve estar visível.
3. **Carregamentos:** recarregar a Home e a tela DNA com a rede lenta ("Slow 3G" no DevTools). O esqueleto de carregamento e a tela final devem usar o mesmo padrão, sem troca de estilo no fim do carregamento.
4. **Estados vazios e de erro:**
   - Histórico vazio: usar uma conta de teste ou apenas inspecionar o estado.
   - Tela de erro: forçar um erro de render no DevTools, se possível, ou inspecionar pelo teste do `ErrorBoundary`.
   - As duas seguem o padrão.
5. **Dicas de execução:**
   - Abrir um treino e olhar o bloco de dicas de um exercício com dicas longas, como o Agachamento ou o Levantamento Terra Romeno.
   - Deve aparecer uma orientação por linha, e os marcadores genéticos ("WNT16", "COL1A1 C,C") como etiquetas discretas junto ao item.
   - Abrir "Ver execução", aba Execução: mesmo formato.
   - Trocar para uma variante alternativa: a justificativa genética da variante aparece no mesmo formato.
   - Um exercício com uma frase só deve aparecer sem marcador de lista.
6. **Área segura inferior:** no DevTools, simular um iPhone com notch. O menu inferior não pode ficar colado à borda inferior; o conteúdo do menu fica acima da área segura.
7. **Sem rolagem horizontal** em 320 px nas 11 telas.
8. **Sem Tailwind:** `pnpm --filter @helux/web build` passa, e não há `tailwindcss` em `apps/web/package.json` nem `@tailwind` em `globals.css`.
