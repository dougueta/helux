# Contrato: `GET /genetic-profile`

Sem autenticação (como hoje).

## 200 OK — `GeneticProfileView`

```json
{
  "metabolismo": "moderado",
  "recuperacaoMuscular": "media",
  "riscoCardiovascular": "baixo",
  "predisposicao": "misto",
  "alertas": ["Predisposição para menor densidade óssea (WNT16) — manter cálcio e vitamina D"],
  "traits": [
    {
      "key": "rs2707466:densidade-ossea-forca-dos-ossos",
      "gene": "WNT16",
      "genotype": "C,T",
      "label": "Densidade óssea (força dos ossos)",
      "level": 0.9,
      "note": "Predisposição para menor densidade óssea",
      "warn": true
    }
  ]
}
```

`traits` é sempre um array (pode ser vazio). Campos do resumo inalterados.

## 404 — arquivo Genera ausente

`{ "error": "Perfil genético não encontrado. Adicione genera.json em data/genetics/" }`

## 500 — arquivo Genera malformado

Erro padrão do Fastify (o parser lança). O web trata como falha de carregamento.
