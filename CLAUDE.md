# Processo de desenvolvimento â€” OBRIGATÃ“RIO, FIXO

**Todo pedido de trabalho neste repositÃ³rio DEVE passar pelo processo SDD do Spec Kit (`speckit-*`). Nunca implementar nada ad-hoc â€” nenhuma exceÃ§Ã£o, nem para pedidos pequenos â€” atÃ© que o usuÃ¡rio mude esta regra explicitamente aqui neste arquivo.**

Fluxo a seguir para qualquer pedido novo (funcionalidade, correÃ§Ã£o, refatoraÃ§Ã£o, etc.):
1. `speckit-specify` â€” criar/atualizar a spec da feature
2. `speckit-clarify` â€” resolver ambiguidades, se houver
3. `speckit-plan` â€” gerar o plano de implementaÃ§Ã£o
4. `speckit-tasks` â€” gerar `tasks.md`
5. `speckit-implement` â€” executar as tarefas de `tasks.md`

Se o pedido nÃ£o se encaixar em nenhuma spec existente, abrir um novo ciclo de spec-kit para ele antes de tocar em cÃ³digo. NÃ£o pular etapas nem ir direto para ediÃ§Ã£o de cÃ³digo, mesmo que o pedido pareÃ§a trivial.

---

## TODO: Setup de nova conta (Claude Code)

> Se vocÃª estÃ¡ lendo isto numa conta ou mÃ¡quina nova, rode este checklist de setup antes de comeÃ§ar qualquer trabalho.

- [ ] **Plugin superpowers** â€” abra o Claude Code, vÃ¡ em Plugins e habilite `superpowers`
- [ ] **MCP Supabase** â€” rode no PowerShell:
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
- [ ] **VariÃ¡veis de ambiente** â€” copie `.env.example` â†’ `.env` em `apps/api` e `apps/web` e preencha as credenciais

Quando o setup estiver feito, apague (ou marque como concluÃ­dos) os itens acima e volte ao fluxo SDD normal.

---

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/023-producao-render/plan.md
<!-- SPECKIT END -->
