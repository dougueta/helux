# Contrato de UI

Todos os componentes seguem o Design System v2 e o `design-system-guard`.

## Tela de treino

- **Todo item** tem o acesso "Ver execução", inclusive aquecimento, volta à calma, mobilidade, cardio e exercício sem variantes.
- A miniatura mostra a demonstração parada. Se estiver indisponível, mostra um ícone neutro, nunca outra animação.
- As linhas de séries, carga e esforço continuam como estão para cada tipo de item.
- O subtítulo "Técnica, músculos e N variantes" omite as variantes quando N = 0.

## `ExerciseDemo`

```ts
interface ExerciseDemoProps {
  demo: ResolvedDemo
  playing: boolean
  nonce?: string | number
  phase?: number      // 0 a 1; fixa o quadro (galeria e captura)
  label: string       // aria-label: "demonstração de <nome>"
}
```

- Mantém o viewBox 220 × 250, os tokens, o acento só no implemento e a pose central em movimento reduzido.
- `hold` mostra a posição sustentada, com a indicação de tempo do item. `alternate` mostra um lado por vez. `cycle` não simula início e fim de repetição.
- `caption`, quando existe, aparece abaixo da demonstração, como texto real.

## `ExerciseSheet`

| Estado | Comportamento |
|:---|:---|
| Item normal | Demonstração, passos em `setup` + `steps`, `commonError` em âmbar, `context` separado, músculos |
| Com observação do plano | `notes` aparece como complemento, separado dos passos (FR-020) |
| Variante ativa | Título, demonstração, passos, músculos, cadência e etiquetas são da variante (FR-011) |
| Variante ativa fora da lista | Continua como atual, com a etiqueta "Atual" (FR-035) |
| Sem variantes | Sem a aba "Variantes" |
| Cardio | Passos, zona de intensidade prescrita, sem mapa muscular obrigatório |
| Série de aproximação | Demonstração do exercício, com o aviso "Série leve de preparação" (FR-030) |
| Indisponível | `DemoUnavailable`: "Demonstração indisponível para este item", nome e `notes` |

### Pré-visualização de variante (FR-010)

1. Cada linha da aba "Variantes" tem o botão "Ver", com `aria-label="Ver execução de <nome>"`.
2. O botão abre a execução da variante na mesma folha, com "Voltar às variantes" e "Trocar".
3. "Voltar às variantes" e fechar a folha **não** alteram o treino nem chamam `onApply`.
4. Em modo só leitura (preview da 026), não aparece "Trocar".
5. "Equivalente" mantém a etiqueta e tem o mesmo conteúdo.

## `MuscleMap`

- Acrescenta uma vista de costas, exibida quando o item envolve `dorsal`, `trapezio`, `lombar`, `gluteo`, `posterior`, `panturrilha` ou `triceps`.
- A legenda ganha os rótulos das novas chaves. Chave desconhecida em plano antigo não quebra e cai no texto bruto, como hoje.
- Mesa Flexora destaca posterior de coxa, e não quadríceps.

## Galeria (`/dev/demos`)

- `notFound()` quando `NODE_ENV === 'production'`; sem link em nenhum menu.
- Roda em modo mock, sem login.
- Mostra cada item com demonstração, orientação, situação e os filtros por catálogo e pendentes.
- Parâmetros para captura: `?ids=a,b&phase=0.5&frame=1`. Com `frame=1`, mostra só o cartão do item em 390 × 844.
