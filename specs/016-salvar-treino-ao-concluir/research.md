# Research: Salvar o Treino ao Concluir

## R1. Onde disparar a gravação

- **Decision**: Numa função `startFinish()` da página, chamada tanto por `handleNext` (último exercício, sem pulados) quanto por `handleConfirmFinish` (após o diálogo da spec 009). Ela congela o resumo e chama `submit()` do hook `useFinishWorkout`.
- **Rationale**: Um único ponto de entrada garante que os dois caminhos de finalização gravem da mesma forma; o diálogo da spec 009 continua decidindo *se* finaliza, sem mudança.
- **Alternatives considered**: Gravar num `useEffect` disparado por `showDone === true` — rejeitado: efeitos rodam duas vezes em Strict Mode (dev) e tornam a guarda contra duplicidade mais frágil.

## R2. Guarda contra gravação duplicada

- **Decision**: `useRef` com o estado corrente dentro do hook; `submit()` ignora a chamada se já houver gravação em andamento ou já tiver tido sucesso. "Voltar ao início" não chama `submit()`.
- **Rationale**: `useState` não é síncrono entre dois cliques no mesmo tick; a ref é. Mantém o hook simples e testável.
- **Alternatives considered**: Desabilitar botões apenas — insuficiente sozinho (duplo toque antes do re-render); idempotency key no servidor — exige mudar a API (fora de escopo).

## R3. Sessão limpa após sucesso x tela de conclusão

- **Decision**: A página guarda `finishSummary = { totalDone, elapsed }` ao iniciar a finalização e renderiza `WorkoutDoneScreen` sempre que `finishSummary !== null`, antes do `if (!session) return null`. O efeito de redirecionamento passa a exigir `finishSummary === null`.
- **Rationale**: `finishWorkout` já faz `save(null)` + `setSession(null)` após sucesso (limpar só após sucesso é requisito — FR-005), o que hoje dispararia o redirecionamento para `/` e esconderia a tela (FR-008).
- **Alternatives considered**: Adiar `setSession(null)` até o usuário sair — rejeitado: reabrir `/workout` depois do sucesso retomaria um treino já gravado (duplicidade).

## R4. Ações no estado de erro

- **Decision**: "Tentar novamente" (chama `submit()` de novo; permitido porque o estado é `error`) e "Voltar ao treino" (`reset()` + limpa `finishSummary`, voltando à tela ativa com a sessão intacta).
- **Rationale**: Cobre FR-004 sem esconder o treino; o usuário pode ajustar algo e finalizar de novo.

## R5. Estratégia de teste

- **Decision**: Teste unitário do hook (renderHook + promessas controladas), teste do componente (três estados e callbacks) e um teste de integração da página renderizando `WorkoutPage` com `useActiveWorkout` real (localStorage semeado), `apiFetch` mockado e `next/navigation` mockado (padrão já usado em `CheckinForm.test.tsx`).
- **Rationale**: `page.tsx` não tinha teste; o risco principal está na fiação (redirecionamento, momento do POST), que só um teste da página pega.
