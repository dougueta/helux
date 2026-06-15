# Guia: Sincronizar Apple Watch com Helux via iOS Shortcuts

Este guia explica como criar um Atalho do iOS (Shortcuts) que lê dados de saúde do Apple Watch Series 7 e os envia automaticamente para o backend do Helux.

---

## 1. Pré-requisitos

- iPhone com o app **Atalhos** instalado (já vem de fábrica no iOS 16+)
- Apple Watch Series 7 pareado, com dados de saúde coletados
- API do Helux em funcionamento em `https://helux.fly.dev`
- Chave de API pessoal: `106ade90-507a-46c1-8efb-4471ddb0515b`

> **Nota sobre o payload:** O endpoint `POST /api/health/sync` aceita um objeto JSON com as chaves `heartRate`, `hrv`, `steps`, `activeEnergy` e `sleepDuration`. Cada item dentro dessas listas precisa dos campos `uuid`, `value`, `unit`, `startDate` e `endDate`.

---

## 2. Criando o Atalho

Abra o app **Atalhos** e toque em **+** para criar um novo atalho. Dê o nome **"Sincronizar Helux"**.

### Passo 1 — Buscar HRV (Variabilidade da Frequência Cardíaca)

1. Toque em **Adicionar Ação**.
2. Pesquise por **"Buscar Amostras de Saúde"** (ou *Find Health Samples*) e selecione a ação.
3. Configure:
   - **Tipo:** `Heart Rate Variability SDNN` (Variabilidade da FC — SDNN)
   - **Ordenar por:** Data — Do mais recente ao mais antigo
   - **Limite:** `1`
4. Renomeie a variável de resultado para **`HRV`** (toque no chip de variável e escolha "Renomear").

### Passo 2 — Buscar Frequência Cardíaca em Repouso

1. Adicione nova ação **"Buscar Amostras de Saúde"**.
2. Configure:
   - **Tipo:** `Resting Heart Rate` (Frequência Cardíaca em Repouso)
   - **Ordenar por:** Data — Do mais recente ao mais antigo
   - **Limite:** `1`
3. Renomeie o resultado para **`FreqCardiaca`**.

### Passo 3 — Buscar Energia Ativa (Calorias)

1. Adicione nova ação **"Buscar Amostras de Saúde"**.
2. Configure:
   - **Tipo:** `Active Energy Burned` (Energia Ativa Queimada)
   - **Ordenar por:** Data — Do mais recente ao mais antigo
   - **Limite:** `1`
3. Renomeie o resultado para **`Calorias`**.

### Passo 4 — Compor o JSON

> **Como inserir variáveis no texto:** ao digitar, toque em **{x}** (ou mantenha pressionado o campo de texto) para inserir uma variável. Selecione a lista de resultado (ex: `HRV`) e depois escolha a propriedade desejada do menu que aparece.

1. Adicione a ação **"Texto"**.
2. Cole o conteúdo abaixo, substituindo cada `<placeholder>` pela variável correspondente conforme as instruções entre parênteses:

```
{
  "heartRate": [
    {
      "uuid": "<FreqCardiaca — Identificador>",
      "value": <FreqCardiaca — Valor>,
      "unit": "bpm",
      "startDate": "<FreqCardiaca — Data de início>",
      "endDate": "<FreqCardiaca — Data de término>"
    }
  ],
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
  ]
}
```

**Como inserir cada variável:**

| Placeholder | Variável a selecionar | Propriedade |
|---|---|---|
| `<FreqCardiaca — Identificador>` | `FreqCardiaca` | UUID / Identificador |
| `<FreqCardiaca — Valor>` | `FreqCardiaca` | Valor |
| `<FreqCardiaca — Data de início>` | `FreqCardiaca` | Data de início |
| `<FreqCardiaca — Data de término>` | `FreqCardiaca` | Data de término |
| `<HRV — Identificador>` | `HRV` | UUID / Identificador |
| `<HRV — Valor>` | `HRV` | Valor |
| `<HRV — Data de início>` | `HRV` | Data de início |
| `<HRV — Data de término>` | `HRV` | Data de término |
| `<Calorias — Identificador>` | `Calorias` | UUID / Identificador |
| `<Calorias — Valor>` | `Calorias` | Valor |
| `<Calorias — Data de início>` | `Calorias` | Data de início |
| `<Calorias — Data de término>` | `Calorias` | Data de término |

> **Dica:** As datas retornadas pelo iOS já estão no formato ISO 8601 com timezone (ex: `2026-06-15T07:30:00+00:00`), que é exatamente o que a API espera.

3. Renomeie o resultado desta ação de Texto para **`CorpoJSON`**.

### Passo 5 — Enviar para a API

1. Adicione a ação **"Obter Conteúdo da URL"** (ou *Get Contents of URL*).
2. Configure:
   - **URL:** `https://helux.fly.dev/api/health/sync`
   - **Método:** `POST`
3. Toque em **Mostrar mais** para expandir as opções avançadas.
4. Em **Cabeçalhos** (Headers), adicione dois cabeçalhos:
   - **Chave:** `X-API-Key` → **Valor:** `106ade90-507a-46c1-8efb-4471ddb0515b`
   - **Chave:** `Content-Type` → **Valor:** `application/json`
5. Em **Corpo da Requisição** (Request Body), selecione **JSON** ou **Texto**:
   - Se aparecer a opção **Arquivo/Texto**, escolha **Texto** e insira a variável `CorpoJSON`.
   - Se aparecer a opção **JSON**, mude para **Arquivo** ou **Texto** para enviar o JSON pré-formatado como string (isso evita que o iOS re-serialize e quebre o formato).
6. Renomeie o resultado para **`RespostaAPI`**.

### Passo 6 — Notificação de Resultado

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
   - **Treino:** selecione **"Treino"** e escolha **"Termina"**. O atalho será executado automaticamente ao fim de cada treino registrado no Apple Watch.
4. Toque em **"Adicionar Ação"** → pesquise por **"Executar Atalho"** e selecione.
5. Toque no campo do atalho e selecione **"Sincronizar Helux"**.
6. Toque em **"Próximo"** e desative a opção **"Perguntar antes de executar"** — isso permite que a automação rode silenciosamente em segundo plano, sem exibir um alerta.
7. Toque em **"Concluído"** para salvar.

> **Dica:** Você pode criar duas automações ao mesmo tempo — uma pela manhã e outra após o treino — para garantir que os dados mais recentes sempre cheguem ao Helux.

---

## 5. Dados Ausentes ou Apple Watch Não Usado

Se o Apple Watch não foi usado ou não sincronizou com o iPhone antes de o atalho rodar, o HealthKit pode não ter amostras recentes. Nesses casos:

- A ação **"Buscar Amostras de Saúde"** retornará uma lista vazia ou sem valor.
- O JSON enviado à API poderá conter arrays vazios (ex.: `"activeEnergy": []`), o que é aceito sem erro.
- O app Helux exibirá **"—"** para as métricas sem dados disponíveis.

**O que fazer:** antes de rodar o atalho, abra o app **Saúde** no iPhone e confirme que os dados do Watch já aparecem lá. Se necessário, abra o app **Watch** no iPhone e aguarde a sincronização concluir. Somente após isso rode o atalho **"Sincronizar Helux"**.

---

## 6. Testando Localmente (antes do deploy)

Enquanto a API ainda não está no Fly.io, você pode testar apontando para o servidor local:

1. Descubra o IP local do seu Mac: abra o Terminal e rode `ipconfig getifaddr en0`.
   Exemplo de resultado: `192.168.1.100`
2. Certifique-se de que a API local está rodando na porta `3001`:
   ```bash
   pnpm --filter @helux/api dev
   ```
3. No atalho, substitua temporariamente a URL do Passo 5:
   - De: `https://helux.fly.dev/api/health/sync`
   - Para: `http://192.168.1.100:3001/api/health/sync`
4. O iPhone e o Mac precisam estar na **mesma rede Wi-Fi**.
5. Execute o atalho e observe os logs no terminal — você verá a requisição chegando.
6. Quando o deploy estiver feito, volte a URL para `https://helux.fly.dev/api/health/sync`.

---

## 7. Solução de Problemas

| Sintoma | Possível causa | Solução |
|---|---|---|
| Notificação mostra `401 Unauthorized` | Chave de API incorreta ou ausente | Confirme o cabeçalho `X-API-Key` no Passo 5 |
| Notificação mostra `400 Bad Request` | JSON malformado ou campo faltando | Verifique se todas as variáveis foram inseridas corretamente no Passo 4 |
| Campo `uuid` vazio | iOS não retornou identificador único | Tente a propriedade "UUID" em vez de "Identificador" ao selecionar a variável |
| Atalho não encontra amostras | Permissão de saúde não concedida | Vá em Ajustes → Saúde → Acesso a Dados e Dispositivos → Atalhos e ative os tipos de dado |
| Erro de conexão no teste local | Firewall ou IP diferente | Confirme o IP com `ipconfig getifaddr en0` e que está na mesma rede Wi-Fi |
