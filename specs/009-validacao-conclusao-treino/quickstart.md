# Quickstart: Validação de Conclusão de Treino

Passos para verificar manualmente contra o app rodando localmente (`pnpm dev`), após a implementação.

1. Iniciar um treino qualquer, registrar ao menos 1 série em todos os exercícios exceto um, e tocar em "Finalizar treino" — confirmar que aparece o diálogo avisando 1 exercício pulado, com o nome dele.
2. No diálogo do passo 1, tocar em "Cancelar" — confirmar que o treino **não** foi salvo (segue na tela de treino ativo, dá pra continuar registrando séries).
3. Repetir o treino do passo 1 e, desta vez, confirmar no diálogo — confirmar que o treino é salvo e o fluxo segue para a tela de conclusão normalmente.
4. Iniciar um novo treino e tocar em "Finalizar treino" **sem registrar nenhuma série em nenhum exercício** — confirmar que o mesmo diálogo aparece, mencionando todos os exercícios como pulados.
5. Completar um treino normalmente (todas as séries de todos os exercícios) e finalizar — confirmar que **nenhum** diálogo aparece, fluxo idêntico ao comportamento anterior a esta mudança.
6. (Opcional, verificação de defesa em profundidade) Com as devtools do navegador, tentar enviar diretamente `POST /api/workouts/sessions` com um exercício de `sets: []` e sem `skipped: true` — confirmar resposta `400`.
