# Processo de desenvolvimento — OBRIGATÓRIO, FIXO

**Todo pedido de trabalho neste repositório DEVE passar pelo processo SDD do Spec Kit (`speckit-*`). Nunca implementar nada ad-hoc — nenhuma exceção, nem para pedidos pequenos — até que o usuário mude esta regra explicitamente aqui neste arquivo.**

Fluxo a seguir para qualquer pedido novo (funcionalidade, correção, refatoração, etc.):
1. `speckit-specify` — criar/atualizar a spec da feature
2. `speckit-clarify` — resolver ambiguidades, se houver
3. `speckit-plan` — gerar o plano de implementação
4. `speckit-tasks` — gerar `tasks.md`
5. `speckit-implement` — executar as tarefas de `tasks.md`

Se o pedido não se encaixar em nenhuma spec existente, abrir um novo ciclo de spec-kit para ele antes de tocar em código. Não pular etapas nem ir direto para edição de código, mesmo que o pedido pareça trivial.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/009-validacao-conclusao-treino/plan.md
<!-- SPECKIT END -->
