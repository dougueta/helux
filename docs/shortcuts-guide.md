# Guia: Sincronizar Apple Watch com Helux via iOS Shortcuts

> **Versão:** iOS 26 (Liquid Glass)
> **Última revisão:** 2026-06-27
>
> Este guia usa o formato simples de payload — só valores numéricos, sem UUID ou datas. O backend gera os identificadores automaticamente com deduplicação por dia.

---

## 1. Pré-requisitos

- iPhone com iOS 26 e app **Atalhos** (vem instalado de fábrica)
- Apple Watch pareado e com dados sincronizados com o iPhone
- API do Helux rodando em `https://helux-api.onrender.com`
- Sua `PERSONAL_API_KEY` — confira o valor em `apps/api/.env`

> **Antes de começar:** abra o app **Saúde** no iPhone e confirme que você consegue ver dados recentes de HRV, Sono e Calorias. Se os dados ainda não aparecerem lá, o Watch ainda não sincronizou — aguarde e tente novamente.

---

## 2. Criar o Atalho

Abra o app **Atalhos** e toque em **+** para criar um novo atalho. Dê o nome **"Sincronizar Helux"**.

> **Como adicionar ações:** toque em **"Adicionar Ação"** (ou **+** dentro do editor). Uma gaveta de pesquisa abre na parte inferior — use-a para pesquisar cada ação.
>
> **Como usar "Definir Variável":** após cada busca de amostras, adicione a ação **"Definir Variável"** para dar um nome ao resultado. Assim você referencia a variável depois sem depender de renomear chips.
>
> **Como inserir chips de variável em campos de texto:** toque no campo de texto, selecione **Variáveis** na barra acima do teclado, escolha a variável. Toque no chip inserido para selecionar uma propriedade (Valor, Duração, etc.).

---

### Bloco 1 — HRV

1. Pesquise e adicione **"Amostras de Saúde"** (pode aparecer como *Buscar*, *Localizar* ou *Obter Amostras de Saúde*).
2. Configure:
   - **Tipo:** `Variabilidade de Batimentos`
   - **Filtro de data:** `Data de Início` nos últimos `1` dia
   - **Ordenar por:** `Data de Início` — decrescente
   - **Limite:** `1`
3. Adicione **"Definir Variável"**:
   - **Nome:** `HRV`
   - **Para:** o chip de resultado da ação anterior

---

### Bloco 2 — Energia Ativa

1. Adicione **"Amostras de Saúde"**.
2. Configure:
   - **Tipo:** `Energia Ativa`
   - **Filtro de data:** `Data de Início` nos últimos `1` dia
   - **Ordenar por:** `Data de Início` — decrescente
   - **Limite:** `1`
3. Adicione **"Definir Variável"**:
   - **Nome:** `Calorias`
   - **Para:** o chip de resultado

> **Nota:** estamos buscando apenas o sample mais recente (não o total do dia) até confirmar que os dados chegam corretamente. Após a validação, este bloco será ajustado para somar todos os samples do dia.

---

### Bloco 3 — Sono

1. Adicione **"Amostras de Saúde"**.
2. Configure:
   - **Tipo:** `Análise do Sono` (pode aparecer como `Tempo Dormindo` ou `Sono`)
   - **Filtro de data:** `Data de Início` nos últimos `1` dia
   - **Ordenar por:** `Duração` — decrescente
   - **Limite:** `1`
3. Adicione **"Definir Variável"**:
   - **Nome:** `Sono`
   - **Para:** o chip de resultado

> **Nota:** não estamos convertendo a duração por enquanto. O valor bruto da propriedade `Duração` será enviado para identificar em qual unidade o iOS 26 retorna (segundos, minutos ou horas). Após a validação, adicionamos a conversão necessária.

---

> **Recuperação Cardiovascular** não está incluída neste atalho. O iOS 26 exibe um alerta bloqueante em dias sem treino registrado no Watch e não há opção para suprimi-lo. Esta métrica é capturada pelo atalho **"Helux Pós-Treino"** — veja a Seção 5.

---

### Bloco 4 — Montar o JSON

1. Adicione a ação **"Texto"**.
2. Digite o conteúdo abaixo inserindo cada chip de variável no lugar indicado:

```
{
  "hrv": [HRV · Valor],
  "activeEnergy": [Calorias · Valor],
  "sleepHours": [Sono · Duração]
}
```

> **Como inserir cada chip:**
> - `[HRV · Valor]` → Variáveis → `HRV` → toque no chip → **Valor**
> - `[Calorias · Valor]` → Variáveis → `Calorias` → toque no chip → **Valor**
> - `[Sono · Duração]` → Variáveis → `Sono` → toque no chip → **Duração**

3. Adicione **"Definir Variável"**:
   - **Nome:** `CorpoJSON`
   - **Para:** o resultado desta ação de Texto

---

### Bloco 5 — Debug (temporário)

Adicione **"Mostrar Alerta"** com o conteúdo da variável `CorpoJSON` para inspecionar o JSON antes de enviar. **Remova este bloco após a validação.**

---

### Bloco 6 — Enviar para a API

1. Adicione **"Obter Conteúdo da URL"** (ou *Get Contents of URL*).
2. Configure:
   - **URL:** `https://helux-api.onrender.com/api/health/sync`
   - **Método:** `POST`
3. Expanda as opções avançadas (**"Mostrar mais"** ou `…`).
4. Em **Cabeçalhos**, adicione:
   - Chave: `X-API-Key` → Valor: *(sua PERSONAL_API_KEY de `apps/api/.env`)*
   - Chave: `Content-Type` → Valor: `application/json`
5. Em **Corpo da Requisição**:
   - Tipo: **Arquivo** (não JSON nem Formulário)
   - Conteúdo: variável `CorpoJSON`
6. Adicione **"Definir Variável"**:
   - **Nome:** `RespostaAPI`
   - **Para:** o resultado desta ação

---

### Bloco 7 — Ver o resultado

1. Adicione **"Mostrar Notificação"**.
2. Título: `Helux sincronizado`
3. Corpo: variável `RespostaAPI`

> Resposta de sucesso: `{"status":"accepted","count":2}` — `count` indica quantas métricas foram salvas.
> Se `count` for `0`, o Watch provavelmente não sincronizou com o iPhone ainda.

---

## 3. Adicionar à Tela Inicial

1. Segure o atalho **"Sincronizar Helux"** no app Atalhos
2. Selecione **"Detalhes"** → **"Adicionar à Tela de Início"**
3. Escolha ícone e confirme

---

## 4. Automatizar

1. Atalhos → aba **"Automação"** → **+** → **"Criar Automação Pessoal"**
2. Gatilho: **"Hora do Dia"** — 7h, todos os dias
3. Ação: **"Executar Atalho"** → `Sincronizar Helux`
4. Desative **"Perguntar antes de executar"**
5. **"Concluído"**

---

## 5. Atalho "Helux Pós-Treino" (Recuperação Cardiovascular)

Atalho separado, disparado automaticamente ao fim de cada treino. Só precisa ser configurado uma vez.

### Criar o atalho

Crie um novo atalho chamado **"Helux Pós-Treino"** com 5 ações:

**Bloco 1 — Buscar amostra**
1. Adicione **"Amostras de Saúde"**
   - **Tipo:** `Recuperação Cardiovascular`
   - **Filtro de data:** últimos `1` dia
   - **Ordenar por:** `Data de Início` — decrescente
   - **Limite:** `1`
2. **"Definir Variável"** → Nome: `RecupCardio`

**Bloco 2 — Montar JSON**
1. Adicione **"Texto"**:
```
{"cardioRecovery": [RecupCardio · Valor]}
```
2. **"Definir Variável"** → Nome: `CorpoJSON`

**Bloco 3 — Enviar**
1. Adicione **"Obter Conteúdo da URL"**
   - URL: `https://helux-api.onrender.com/api/health/sync`
   - Método: `POST`
   - Cabeçalhos: `X-API-Key` + `Content-Type: application/json`
   - Corpo: **Arquivo** → variável `CorpoJSON`

### Configurar a automação

1. Atalhos → aba **"Automação"** → **+** → **"Criar Automação Pessoal"**
2. Gatilho: **"Treino"** → **"Termina"**
3. Ação: **"Executar Atalho"** → `Helux Pós-Treino`
4. Desative **"Perguntar antes de executar"**
5. **"Concluído"**

> Como este atalho só roda quando o treino termina, a amostra sempre existe — nunca aparece o alerta de "nenhuma amostra encontrada".

---

## 6. Solução de Problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `401 Unauthorized` | Chave de API errada | Confira o header `X-API-Key` com o valor exato de `apps/api/.env` |
| `400 Bad Request` / JSON inválido | JSON malformado | Use o Bloco 5 (debug) para inspecionar o `CorpoJSON` antes de enviar |
| `count: 0` na resposta | Watch não sincronizou | Abra o app Saúde e confirme que os dados aparecem lá antes de rodar |
| Valor de sono muito grande (ex: `28800`) | Duração em segundos | Adicione ação **"Calcular"** com `Sono · Duração ÷ 3600` entre os Blocos 3 e 4, e use o resultado no JSON |
| Valor de sono em minutos (ex: `480`) | Duração em minutos | Adicione ação **"Calcular"** com `Sono · Duração ÷ 60` entre os Blocos 3 e 4 |
| Calorias muito baixas (ex: `3`) | Apenas último sample | Esperado por ora — será corrigido após validação |
| Corpo vazio chegando na API | Tipo de corpo errado | No Bloco 6, certifique-se que o tipo do corpo é **Arquivo**, não JSON |

---

## 7. Testar com API local (Windows)

1. Abra o Prompt de Comando e rode `ipconfig` — copie o **Endereço IPv4** da rede Wi-Fi (ex: `192.168.1.100`)
2. Garanta que a API está rodando: `pnpm --filter @helux/api dev`
3. No Bloco 6, troque temporariamente a URL:
   - De: `https://helux-api.onrender.com/api/health/sync`
   - Para: `http://192.168.1.100:3001/api/health/sync`
4. iPhone e PC precisam estar na mesma rede Wi-Fi
5. Volte a URL para produção após o teste
