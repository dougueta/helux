# Guia: Sincronizar Apple Watch com Helux via iOS Shortcuts

Este guia explica como criar um Atalho do iOS (Shortcuts) que lê dados de saúde do Apple Watch e os envia automaticamente para o backend do Helux.

> **Nota sobre a ação de busca:** dependendo da versão do iOS, a ação pode aparecer como **"Buscar Amostras de Saúde"** ou **"Localizar Amostras de Saúde"** (interface mais nova, em formato de filtro: "Localizar Amostras de Saúde em que Todos dos seguintes são verdadeiros"). Funcionalmente são equivalentes — ambas configuram Tipo, ordenação e limite de resultados. As instruções abaixo usam os nomes de campo da versão mais nova; adapte se a sua tela mostrar nomes diferentes.

---

## 1. Pré-requisitos

- iPhone com o app **Atalhos** instalado (já vem de fábrica no iOS 16+)
- Apple Watch pareado, com dados de saúde coletados
- API do Helux em funcionamento em `https://helux-api.onrender.com`
- Chave de API pessoal: veja o valor em `apps/api/.env` (`PERSONAL_API_KEY`) — **nunca cole o valor real aqui, este arquivo é versionado em um repositório público**

> **Nota sobre o payload:** O endpoint `POST /api/health/sync` aceita um objeto JSON com as chaves `heartRate`, `hrv`, `steps`, `activeEnergy`, `sleepDuration` e `cardioRecovery`. Cada item dentro dessas listas precisa dos campos `uuid`, `value`, `unit`, `startDate` e `endDate`. **Todas as chaves são opcionais** — se uma métrica não estiver disponível, basta omiti-la ou enviar lista vazia.

> **Nota sobre Frequência Cardíaca em Repouso:** essa métrica não está incluída neste guia porque a Apple só a calcula depois de vários dias/semanas de uso consistente do Apple Watch — em dispositivos novos ou recém-configurados ela simplesmente não existe ainda nas listas de tipo do Atalho. Quando ela aparecer no seu aparelho, pode ser adicionada seguindo o mesmo padrão do Passo 3 (Recuperação Cardiovascular), com **Tipo: Frequência Cardíaca em Repouso** e chave JSON `heartRate`.

---

## 2. Criando o Atalho

Abra o app **Atalhos** e toque em **+** para criar um novo atalho. Dê o nome **"Sincronizar Helux"**.

### Passo 1 — Buscar HRV (Variabilidade de Batimentos)

1. Toque em **Adicionar Ação**.
2. Pesquise por **"Amostras de Saúde"** e selecione a ação de busca/localização disponível.
3. Configure:
   - **Tipo é:** `Variabilidade de Batimentos`
   - **Ordenar por:** `Data de Início` (selecione a direção decrescente/mais recente primeiro, se houver essa opção)
   - **Limite:** ative o toggle e defina `1`
4. Renomeie a variável de resultado para **`HRV`** (toque no chip de variável e escolha "Renomear").

### Passo 2 — Buscar Energia Ativa (Calorias)

1. Adicione nova ação de busca de Amostras de Saúde.
2. Configure:
   - **Tipo é:** `Energia Ativa`
   - **Ordenar por:** `Data de Início`, decrescente/mais recente primeiro
   - **Limite:** `1`
3. Renomeie o resultado para **`Calorias`**.

### Passo 3 — Buscar Recuperação Cardiovascular

1. Adicione nova ação de busca de Amostras de Saúde.
2. Configure:
   - **Tipo é:** `Recuperação Cardiovascular`
   - **Ordenar por:** `Data de Início`, decrescente/mais recente primeiro
   - **Limite:** `1`
3. Renomeie o resultado para **`RecupCardio`**.

> Essa métrica só existe em dias em que você termina um treino registrado pelo Apple Watch (mede quantos bpm a FC cai no 1º minuto após o esforço). Em dias sem treino, o resultado vem vazio — isso é esperado e não quebra a sincronização (o campo é opcional).

### Passo 4 — Buscar Duração do Sono

1. Adicione nova ação de busca de Amostras de Saúde.
2. Configure:
   - **Tipo é:** `Análise do Sono` (ou `Tempo Dormindo`/`Sono`, conforme aparecer na sua lista)
   - **Filtro de Data de Início:** está nos(as) últimos(as) `1` dia (a noite de sono gera várias amostras de estágios diferentes — esse filtro pega só a mais recente)
   - **Ordenar por:** `Duração`, decrescente (a maior primeiro — tende a ser o registro principal da noite, não um cochilo)
   - **Limite:** `1`
3. Renomeie o resultado para **`Sono`**.

> ⚠️ **Ponto de atenção:** a propriedade "Duração" desse resultado pode vir em segundos, minutos ou num formato de duração do iOS, dependendo da versão. A API espera o valor numérico em **horas**. Se ao inserir a variável `Sono — Duração` o valor não estiver em horas, adicione uma ação **"Calcular"** dividindo o valor por `3600` (se vier em segundos) antes de usá-lo no JSON do Passo 6. Teste rodando o atalho uma vez e conferindo o número que chega na notificação final (Passo 9) antes de confiar no dado.

### Passo 5 — Compor o JSON

> **Como inserir variáveis no texto:** ao digitar, toque na barra de **Variáveis** acima do teclado (ou mantenha pressionado o campo de texto) para inserir uma variável. Depois de inserida, toque no chip já dentro do texto para escolher a propriedade desejada (Valor, UUID, Data de Início, etc.) — cada `<placeholder>` abaixo representa um desses chips, não texto digitado.

1. Adicione a ação **"Texto"**.
2. Monte o conteúdo abaixo, inserindo um chip de variável em cada `<placeholder>`:

```
{
  "hrv": [
    {
      "uuid": "<HRV — Identificador>",
      "value": <HRV — Valor>,
      "unit": "ms",
      "startDate": "<HRV — Data de início>",
      "endDate": "<HRV — Data de término>"
    }
  ],
  "activeEnergy": [
    {
      "uuid": "<Calorias — Identificador>",
      "value": <Calorias — Valor>,
      "unit": "kcal",
      "startDate": "<Calorias — Data de início>",
      "endDate": "<Calorias — Data de término>"
    }
  ],
  "cardioRecovery": [
    {
      "uuid": "<RecupCardio — Identificador>",
      "value": <RecupCardio — Valor>,
      "unit": "bpm",
      "startDate": "<RecupCardio — Data de início>",
      "endDate": "<RecupCardio — Data de término>"
    }
  ],
  "sleepDuration": [
    {
      "uuid": "<Sono — Identificador>",
      "value": <Sono — Duração em horas, ver nota do Passo 4>,
      "unit": "hr",
      "startDate": "<Sono — Data de início>",
      "endDate": "<Sono — Data de término>"
    }
  ]
}
```

**Como inserir cada variável:**

| Placeholder | Variável a selecionar | Propriedade |
|---|---|---|
| `<HRV — Identificador>` | `HRV` | UUID / Identificador |
| `<HRV — Valor>` | `HRV` | Valor |
| `<HRV — Data de início>` | `HRV` | Data de início |
| `<HRV — Data de término>` | `HRV` | Data de término |
| `<Calorias — Identificador>` | `Calorias` | UUID / Identificador |
| `<Calorias — Valor>` | `Calorias` | Valor |
| `<Calorias — Data de início>` | `Calorias` | Data de início |
| `<Calorias — Data de término>` | `Calorias` | Data de término |
| `<RecupCardio — Identificador>` | `RecupCardio` | UUID / Identificador |
| `<RecupCardio — Valor>` | `RecupCardio` | Valor |
| `<RecupCardio — Data de início>` | `RecupCardio` | Data de início |
| `<RecupCardio — Data de término>` | `RecupCardio` | Data de término |
| `<Sono — Identificador>` | `Sono` | UUID / Identificador |
| `<Sono — Duração em horas>` | `Sono` | Duração (convertida para horas, ver Passo 4) |
| `<Sono — Data de início>` | `Sono` | Data de início |
| `<Sono — Data de término>` | `Sono` | Data de término |

> **Dica:** As datas retornadas pelo iOS já estão no formato ISO 8601 com timezone (ex: `2026-06-15T07:30:00+00:00`), que é exatamente o que a API espera.

3. Renomeie o resultado desta ação de Texto para **`CorpoJSON`**.

### Passo 6 — Enviar para a API

1. Adicione a ação **"Obter Conteúdo da URL"** (ou *Get Contents of URL*).
2. Configure:
   - **URL:** `https://helux-api.onrender.com/api/health/sync`
   - **Método:** `POST`
3. Toque em **Mostrar mais** para expandir as opções avançadas.
4. Em **Cabeçalhos** (Headers), adicione dois cabeçalhos:
   - **Chave:** `X-API-Key` → **Valor:** (o valor de `PERSONAL_API_KEY` — confira em `apps/api/.env`, nunca documente o valor aqui)
   - **Chave:** `Content-Type` → **Valor:** `application/json`
5. Em **Corpo da Requisição** (Request Body), selecione **JSON** ou **Texto**:
   - Se aparecer a opção **Arquivo/Texto**, escolha **Texto** e insira a variável `CorpoJSON`.
   - Se aparecer a opção **JSON**, mude para **Arquivo** ou **Texto** para enviar o JSON pré-formatado como string (isso evita que o iOS re-serialize e quebre o formato).
6. Renomeie o resultado para **`RespostaAPI`**.

### Passo 7 — Notificação de Resultado

1. Adicione a ação **"Mostrar Notificação"** (ou *Show Notification*).
2. No campo do título, digite: `Helux sincronizado!`
3. No corpo da notificação, insira a variável `RespostaAPI` para ver a resposta da API.

---

## 3. Adicionando à Tela Inicial

Para acessar o atalho com um toque:

1. No app Atalhos, toque e segure o atalho **"Sincronizar Helux"**.
2. Selecione **Detalhes** e depois **Adicionar à Tela de Início**.
3. Escolha um ícone e confirme.

Para executar manualmente sempre que quiser sincronizar, basta tocar no ícone na tela inicial. Veja a seção 4 abaixo para configurar a execução automática.

---

## 4. Automatizando o Atalho (iOS Automações)

Você pode configurar o atalho para rodar automaticamente, sem precisar tocá-lo manualmente.

1. Abra o app **Atalhos** e toque na aba **"Automação"** (ícone de relógio na parte inferior).
2. Toque em **"+"** no canto superior direito e selecione **"Criar Automação Pessoal"**.
3. Escolha o gatilho desejado:
   - **Hora do dia:** selecione **"Hora do dia"** e defina o horário (ex.: 7h da manhã, todos os dias). Ideal para sincronização matinal de dados de sono e recuperação.
   - **Treino:** selecione **"Treino"** e escolha **"Termina"**. O atalho será executado automaticamente ao fim de cada treino registrado no Apple Watch — é o melhor momento pra capturar a Recuperação Cardiovascular.
4. Toque em **"Adicionar Ação"** → pesquise por **"Executar Atalho"** e selecione.
5. Toque no campo do atalho e selecione **"Sincronizar Helux"**.
6. Toque em **"Próximo"** e desative a opção **"Perguntar antes de executar"** — isso permite que a automação rode silenciosamente em segundo plano, sem exibir um alerta.
7. Toque em **"Concluído"** para salvar.

> **Dica:** Você pode criar duas automações ao mesmo tempo — uma pela manhã (HRV + Sono) e outra após o treino (Recuperação Cardiovascular + Calorias) — para garantir que os dados mais recentes sempre cheguem ao Helux.

---

## 5. Dados Ausentes ou Apple Watch Não Usado

Se o Apple Watch não foi usado ou não sincronizou com o iPhone antes de o atalho rodar, o HealthKit pode não ter amostras recentes. Nesses casos:

- A ação de busca de Amostras de Saúde retornará uma lista vazia ou sem valor.
- O JSON enviado à API poderá conter arrays vazios (ex.: `"activeEnergy": []`), o que é aceito sem erro.
- O app Helux exibirá **"—"** para as métricas sem dados disponíveis.

**O que fazer:** antes de rodar o atalho, abra o app **Saúde** no iPhone e confirme que os dados do Watch já aparecem lá. Se necessário, abra o app **Watch** no iPhone e aguarde a sincronização concluir. Somente após isso rode o atalho **"Sincronizar Helux"**.

---

## 6. Testando Localmente (antes do deploy)

Para testar mudanças no Shortcut antes de apontar para produção, você pode usar o servidor local:

1. Descubra o IP local do seu Mac: abra o Terminal e rode `ipconfig getifaddr en0`.
   Exemplo de resultado: `192.168.1.100`
2. Certifique-se de que a API local está rodando na porta `3001`:
   ```bash
   pnpm --filter @helux/api dev
   ```
3. No atalho, substitua temporariamente a URL do Passo 6:
   - De: `https://helux-api.onrender.com/api/health/sync`
   - Para: `http://192.168.1.100:3001/api/health/sync`
4. O iPhone e o Mac precisam estar na **mesma rede Wi-Fi**.
5. Execute o atalho e observe os logs no terminal — você verá a requisição chegando.
6. Ao terminar o teste, volte a URL para `https://helux-api.onrender.com/api/health/sync`.

---

## 7. Solução de Problemas

| Sintoma | Possível causa | Solução |
|---|---|---|
| Notificação mostra `401 Unauthorized` | Chave de API incorreta ou ausente | Confirme o cabeçalho `X-API-Key` no Passo 6 |
| Notificação mostra `400 Bad Request` | JSON malformado ou campo faltando | Verifique se todas as variáveis foram inseridas corretamente no Passo 5 |
| Campo `uuid` vazio | iOS não retornou identificador único | Tente a propriedade "UUID" em vez de "Identificador" ao selecionar a variável |
| Atalho não encontra amostras de um tipo específico | Métrica ainda não existe nos seus dados (ex: Frequência Cardíaca em Repouso em dispositivo novo) ou permissão não concedida | Vá em Ajustes → Saúde → Acesso a Dados e Dispositivos → Atalhos e confira os tipos disponíveis/ativos; se a métrica não aparecer nem ali, a Apple ainda não a calculou — aguarde mais dias de uso |
| Valor de Sono parece muito grande/pequeno (ex: milhares ao invés de horas) | "Duração" retornada em segundos ou minutos, não horas | Adicione uma ação "Calcular" convertendo para horas antes de montar o JSON (ver nota do Passo 4) |
| Erro de conexão no teste local | Firewall ou IP diferente | Confirme o IP com `ipconfig getifaddr en0` e que está na mesma rede Wi-Fi |
