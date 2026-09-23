# Quickstart: Salvar o Treino ao Concluir

Verificação manual contra o app rodando localmente (`pnpm dev`), após a implementação.

1. Iniciar um treino, registrar séries em todos os exercícios e tocar "Finalizar treino" no último. Confirmar que aparece brevemente "Salvando treino…" e depois "Treino concluído" com a mensagem de registro. Na aba Network do navegador, confirmar que o `POST /api/workouts/sessions` saiu **antes** de qualquer toque em "Voltar ao início".
2. Na tela "Treino concluído", **não** tocar "Voltar ao início": sair pelo menu inferior (ou fechar a aba). Abrir o histórico — o treino está lá. Abrir `/workout` — não retoma nenhum treino (redireciona para o início).
3. Repetir com exercícios pulados: tocar "Finalizar treino", ver o aviso da spec 009, cancelar (nada é gravado, continua no treino) e depois confirmar (gravação acontece, tela de conclusão com sucesso). O histórico mostra os pulados como antes.
4. Na tela "Treino concluído", tocar "Voltar ao início" — navega para o início e **não** há um segundo `POST` na aba Network; o histórico tem uma única sessão.
5. Falha: com o DevTools em modo Offline (ou parando a API), finalizar um treino. Confirmar a tela "Não foi possível salvar" com "Tentar novamente" e "Voltar ao treino", sem a frase "registrou suas cargas". Tocar "Voltar ao treino" — séries intactas. Finalizar de novo ainda offline, voltar a ficar online e tocar "Tentar novamente" — passa para "Treino concluído" e o treino aparece uma única vez no histórico.
6. Treino com variante trocada (spec 010): finalizar e confirmar no histórico que a variante executada continua registrada como antes.
