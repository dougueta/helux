# Data Model: Marcadores Genéticos na Tela DNA

## GeneticTrait (`packages/types/src/genetic.ts`)

| Campo | Tipo | Origem (genera.json) | Regra |
|---|---|---|---|
| `key` | string | `snp` + `caracteristica` | `${snp}:${slug}`; único na lista |
| `gene` | string | `gene` | texto como veio |
| `genotype` | string? | `genotipo` | omitido se vazio |
| `label` | string | `caracteristica` | texto original |
| `note` | string | `resultado` | texto original |
| `level` | number 0–1 | seção + `resultado` | 0,9 se ponto de atenção ou começa com "Maior predisposição"/"Maior suscetibilidade"; 0,2 se começa com "Sem predisposição"/"Menor predisposição"; senão 0,5 |
| `warn` | boolean | seção + `categoria` | true se seção `pontos_de_atencao`/`cuidados_relevantes` ou `categoria` ∈ {`ponto_atencao`, `cuidado_relevante`, `lesao`} |

Ordem: prioridade 0 (ponto de atenção), 1 (demais com `warn`), 2 (resto); estável na ordem de leitura: `fit.pontos_de_atencao`, `fit.cuidados_relevantes`, `fit.curiosidades`, `painel_saude_esportiva.resultados`, `fit.achados_adicionais`.

## GeneticProfileView

`GeneticProfile` (inalterado: metabolismo, recuperacaoMuscular, riscoCardiovascular, predisposicao, alertas) + `traits: GeneticTrait[]`.

## DnaState (web, `apps/web/src/app/dna/load-profile.ts`)

`{ status: 'ok'; profile: GeneticProfileView } | { status: 'missing' } | { status: 'error' }`
