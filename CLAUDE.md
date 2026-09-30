# Processo de desenvolvimento — OBRIGATÓRIO, FIXO

**Todo pedido de trabalho neste repositório DEVE passar pelo processo SDD do Spec Kit (`speckit-*`). Nunca implementar nada ad-hoc — nenhuma exceção, nem para pedidos pequenos — até que o usuário mude esta regra explicitamente aqui neste arquivo.**

Fluxo a seguir para qualquer pedido novo (funcionalidade, correção, refatoração, etc.):
1. `speckit-specify` — criar/atualizar a spec da feature
2. `speckit-clarify` — resolver ambiguidades, se houver
3. `speckit-plan` — gerar o plano de implementação
4. `speckit-tasks` — gerar `tasks.md`
5. `speckit-implement` — executar as tarefas de `tasks.md`

Se o pedido não se encaixar em nenhuma spec existente, abrir um novo ciclo de spec-kit para ele antes de tocar em código. Não pular etapas nem ir direto para edição de código, mesmo que o pedido pareça trivial.

---

## TODO: Setup de nova conta (Claude Code)

> Se você está lendo isto numa conta ou máquina nova, rode este checklist de setup antes de começar qualquer trabalho.

- [ ] **Plugin superpowers** — abra o Claude Code, vá em Plugins e habilite `superpowers`
- [ ] **MCP Supabase** — rode no PowerShell:
  ```powershell
  npm install -g @supabase/mcp-server-supabase
  ```
  Depois gere um Personal Access Token em https://supabase.com/dashboard/account/tokens e rode:
  ```powershell
  $env:SUPA_TOKEN = "seu-token-aqui"
  $config = Get-Content "$env:USERPROFILE\.claude.json" | ConvertFrom-Json
  $config.mcpServers | Add-Member -NotePropertyName 'supabase' -NotePropertyValue @{
      type = "stdio"; command = "mcp-server-supabase"; args = @()
      env = @{ SUPABASE_ACCESS_TOKEN = $env:SUPA_TOKEN }
  } -Force
  $config | ConvertTo-Json -Depth 20 | Set-Content "$env:USERPROFILE\.claude.json" -Encoding UTF8
  Write-Host "Tamanho do token: $($env:SUPA_TOKEN.Length)"
  ```
  Deve imprimir `Tamanho do token: 44`. Confirme com `claude mcp list`.
- [ ] **Variáveis de ambiente** — copie `.env.example` → `.env` em `apps/api` e `apps/web` e preencha as credenciais

Quando o setup estiver feito, apague (ou marque como concluídos) os itens acima e volte ao fluxo SDD normal.

---

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/012-design-system-unificado/plan.md
<!-- SPECKIT END -->
