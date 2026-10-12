# Quickstart: Verificação Manual do Design System v2

**Preparação**:
- Rodar o app local (`pnpm dev`, com API na porta 3001 e web na 3000), logado.
- Abrir `design_handoff_helux_v2/Helux Design System v2.html` no navegador, como referência lado a lado.
- App em **375 px**, pelo DevTools no modo dispositivo ou por iframe; o desktop fica para o passo 3.

1. **Treino ativo e folha (US2):**
   - Iniciar um treino.
   - Comparar com a referência:
     - cabeçalho;
     - barra por série (tocar num grupo leva ao exercício);
     - etiqueta e fit em hélice;
     - prescrição com números em mono;
     - dicas: uma por linha, a dica com gene em âmbar com `GeneTag`, sem "ATENÇÃO";
     - card "Ver execução" e atalho de variante;
     - série atual em área de foco;
     - séries compactas.
   - Concluir uma série. Esperado:
     - o ✓ anima;
     - a linha fica compacta;
     - o traço acende;
     - o contador sobe;
     - o bloco de descanso aparece e "Próximo exercício" vira secundário.
   - Usar "+15s" e "Pular".
   - Tocar numa série compacta para editá-la; tocar no ✓ de uma série feita para desfazer.
   - Usar "Adicionar série" (o anterior aparece como "—").
   - Abrir "Ver execução" e conferir:
     - palco e cadência;
     - abas;
     - passos com "Erro comum" em âmbar;
     - mapa e legenda;
     - aba Variantes com "Trocar";
     - trocar de variante: a tela reflete a variante (spec 010);
     - fechar pelo scrim e pelo "Fechar".
2. **Conclusão (US4):**
   - Finalizar um treino. Esperado:
     - o aviso de exercícios pulados (spec 009) no visual novo;
     - a fita acendendo em sequência;
     - o resumo com volume, séries e duração em pt-BR;
     - sem bloco de recorde.
   - Com a API derrubada, verificar o banner de erro, "Tentar de novo" e "Sair sem sincronizar" (spec 016).
3. **Home (US3):**
   - Comparar com a referência:
     - topo;
     - saudação sem verde;
     - área de foco única com fit, "Depois", seletor de cansaço neutro e um único CTA;
     - ciclo;
     - último check-in.
   - Fluxo da spec 011 completo (escolher nível → resumo → aplicar); o diálogo fica acima do menu.
   - Recarregar com a rede lenta: skeleton na forma final.
   - Desktop: coluna de 512 px, com o menu alinhado.
4. **Progresso (US5):**
   - Conferir:
     - recovery (banner âmbar se os dados forem antigos);
     - volume com número herói e barras neutras;
     - recordes;
     - seção Histórico com os 3 últimos e "Ver todos".
   - Abrir a lista completa e o detalhe de um treino.
5. **DNA (US6):**
   - Conferir:
     - fita de marcadores;
     - cards de marcador com gene em itálico, genótipo, nível em palavra e barras, alerta âmbar nos traços de risco;
     - sem a seção "Como molda seu treino".
6. **Demais telas (US7):**
   - Percorrer:
     - Treinos;
     - Check-in (campo numérico v2 com foco e erro);
     - histórico de check-ins;
     - Perfil;
     - Login (sem menu, um CTA);
     - tela de erro.
7. **Regras transversais:**
   - Acento só nos usos permitidos, em todas as telas.
   - Navegar por Tab: anel de foco claro visível em tudo.
   - Movimento reduzido ligado no sistema: tudo instantâneo, demonstração parada, fita já acesa.
   - Sem rolagem horizontal em 320 px.
   - Menu ausente no treino, na conclusão e no login.
8. **Automático:** rodar `pnpm --filter @helux/web test` (inclui o guarda v2), `pnpm typecheck` e `pnpm --filter @helux/web build`, todos verdes.
