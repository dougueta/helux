import type { CardioContent, Guidance } from './types'

/** Como manter cada zona sem monitor: pelo fôlego e pela fala (028 FR-029). */
const zones = (leve: string, moderada: string, intervalado: string): Guidance['zones'] => ({
  leve: `Leve: ${leve}`,
  moderada: `Moderada: ${moderada}`,
  'intervalado-leve': `Intervalado leve: ${intervalado}`,
})

const FALA_LEVE = 'dá para conversar em frases completas sem ofegar.'
const FALA_MODERADA = 'a respiração fica funda e só saem frases curtas.'

const content = (id: string, guidance: Guidance): [string, CardioContent] => [id, { id, guidance }]

/**
 * Orientação e demonstração das modalidades de cardio, por id de `CARDIO_BANK` (`@helux/types`).
 * Impacto, carga articular e local continuam em `CARDIO_BANK`; a demonstração está em `demos/cardio.ts`.
 */
export const CARDIO_GUIDANCE: Record<string, CardioContent> = Object.fromEntries([
  content('bike', {
    setup: [
      'Ajuste o selim na altura do quadril, de pé ao lado da bike',
      'Sentado, com o pedal embaixo, o joelho fica levemente dobrado, sem esticar de vez',
    ],
    steps: [
      'Pedale em ritmo redondo e constante, com o tronco parado e as mãos leves no guidão',
      'Empurre o pedal com o pé inteiro, sem deixar o joelho abrir para fora',
    ],
    commonError: 'Selim baixo demais: o joelho dobra muito e a frente dele reclama',
    zones: zones(
      `carga leve e giro solto; ${FALA_LEVE}`,
      `suba 1 ou 2 níveis de carga e mantenha o giro; ${FALA_MODERADA}`,
      '2 min um pouco mais forte, 2 min leve, repetindo; nunca no máximo.',
    ),
  }),
  content('bike-intervalado', {
    setup: [
      'Ajuste o selim como na bike comum: joelho levemente dobrado com o pedal embaixo',
      'Comece com 5 min leves para aquecer antes do primeiro bloco forte',
    ],
    steps: [
      'Nos blocos fortes, aumente o giro ou 1 a 2 níveis de carga, sentado e com o quadril parado',
      'Nos blocos leves, volte à carga inicial e solte o giro até a respiração acalmar',
    ],
    commonError: 'Carga pesada demais nos blocos fortes, pedalando em pé e forçando o joelho',
    zones: zones(
      `fique só nos blocos leves; ${FALA_LEVE}`,
      `blocos fortes sem passar do ponto; ${FALA_MODERADA}`,
      '2 min fortes e 2 min leves; no bloco forte ainda dá para dizer frases curtas.',
    ),
  }),
  content('eliptico', {
    setup: [
      'Suba com os pés inteiros nos pedais e segure as alavancas na altura do peito',
      'Tronco em pé, olhando para a frente, sem se apoiar no painel',
    ],
    steps: [
      'Ande no aparelho: o pé vai para trás apoiado e volta por cima, sem tirar o calcanhar',
      'Os braços acompanham: quando um pé vai à frente, a mão do mesmo lado vem para trás',
    ],
    commonError: 'Ficar na ponta dos pés ou curvar o corpo sobre o painel',
    zones: zones(
      `passada solta e resistência baixa; ${FALA_LEVE}`,
      `suba a resistência e use mais os braços; ${FALA_MODERADA}`,
      '2 min com mais resistência, 2 min leve; o movimento continua igual.',
    ),
  }),
  content('remo', {
    setup: [
      'Prenda os pés nas sapatas com a faixa sobre o peito do pé',
      'Comece sentado à frente, joelhos dobrados e braços estendidos segurando o puxador',
    ],
    steps: [
      'Puxada: empurre primeiro com as pernas, depois leve o tronco um pouco para trás',
      'Por último, puxe o puxador até a altura do umbigo, com os cotovelos rentes ao corpo',
      'Volta na ordem inversa: estique os braços, incline o tronco à frente e só então dobre os joelhos',
    ],
    commonError: 'Puxar com os braços antes de empurrar com as pernas ou curvar a lombar',
    zones: zones(
      `remadas lentas, cerca de 20 por minuto; ${FALA_LEVE}`,
      `empurre mais forte com as pernas no mesmo ritmo; ${FALA_MODERADA}`,
      '2 min com remadas mais fortes, 2 min leves; a técnica não muda.',
    ),
  }),
  content('natacao', {
    setup: [
      'Corpo esticado na superfície da água, rosto para baixo e olhar para o fundo',
      'Prefira crawl ou costas; peito pede pernada forte, ruim para joelho sensível',
    ],
    steps: [
      'Um braço entra à frente e puxa a água por baixo do corpo enquanto o outro volta por cima',
      'Pernada curta e contínua, saindo do quadril, com os joelhos quase esticados',
      'Solte o ar devagar dentro da água e vire o rosto de lado para respirar',
    ],
    commonError: 'Prender a respiração debaixo da água e levantar a cabeça para respirar',
    zones: zones(
      'nado contínuo e sem pressa; você respira com folga a cada 2 ou 3 braçadas.',
      'braçadas mais firmes no mesmo ritmo; a respiração fica mais funda.',
      '1 piscina mais rápida e 1 piscina tranquila, sem parar na borda.',
    ),
  }),
  content('caminhada', {
    setup: ['Em pé, corpo alto, ombros soltos e olhar à frente'],
    steps: [
      'Pise com o calcanhar e role o pé até sair pela ponta',
      'Os braços balançam ao lado do corpo, cada um junto da perna do outro lado',
      'Passos de tamanho natural, sem esticar a perna longe à frente',
    ],
    commonError: 'Passo longo demais, batendo o calcanhar seco no chão',
    zones: zones(
      `ritmo de passeio; ${FALA_LEVE}`,
      `passo mais rápido e braços mais ativos; ${FALA_MODERADA}`,
      '2 min de caminhada rápida e 2 min de passeio, repetindo.',
    ),
  }),
  content('caminhada-inclinada', {
    setup: [
      'Suba na esteira parada, com inclinação moderada, de 3% a 8%',
      'Ligue em velocidade baixa e solte as mãos do painel quando estiver firme',
    ],
    steps: [
      'Incline o corpo levemente à frente a partir dos tornozelos, com a barriga firme',
      'Caminhe com o pé inteiro na lona e os braços balançando soltos',
    ],
    commonError: 'Segurar nas barras e jogar o tronco para trás',
    zones: zones(
      `inclinação baixa e passo calmo; ${FALA_LEVE}`,
      `suba a inclinação antes da velocidade; ${FALA_MODERADA}`,
      '2 min com mais inclinação e 2 min com menos, na mesma velocidade.',
    ),
  }),
  content('escada', {
    setup: [
      'Suba com o pé inteiro em cada pedal, corpo em pé e quase sem inclinar',
      'Mãos só encostadas no corrimão, para o equilíbrio',
    ],
    steps: [
      'Desça um pedal com o peso do corpo, empurrando pelo calcanhar e pelo meio do pé',
      'Enquanto um pedal desce, o outro sobe; deixe o pé acompanhar sem perder o apoio',
    ],
    commonError: 'Subir na ponta dos pés ou debruçar no aparelho, apoiando o peso nos braços',
    zones: zones(
      `passos curtos e ritmo lento; ${FALA_LEVE}`,
      `passos mais rápidos, ainda com o pé inteiro; ${FALA_MODERADA}`,
      '2 min em ritmo mais rápido e 2 min devagar, repetindo.',
    ),
  }),
  content('corrida-caminhada', {
    setup: ['Comece caminhando 5 min para aquecer as articulações'],
    steps: [
      'Alterne um bloco curto de trote leve com um bloco de caminhada ativa',
      'No trote, passos curtos e pé pousando perto do corpo, sem pular alto',
      'Volte a caminhar antes de cansar muito, não só quando já estiver sem fôlego',
    ],
    commonError: 'Trote rápido demais nos primeiros blocos e perder a postura no fim',
    zones: zones(
      `trote bem lento e caminhada calma; ${FALA_LEVE}`,
      `trote um pouco mais firme; ${FALA_MODERADA}`,
      '1 a 2 min de trote e 2 min de caminhada, repetindo.',
    ),
  }),
  content('corrida', {
    setup: ['Aqueça com 5 min de caminhada rápida antes de começar a correr'],
    steps: [
      'Passos curtos e rápidos, pousando o pé logo abaixo do corpo',
      'Tronco firme e levemente à frente, ombros baixos e cotovelos a cerca de 90 graus',
      'Os braços balançam para a frente e para trás, sem cruzar na frente do peito',
    ],
    commonError: 'Passada longa, batendo o calcanhar bem à frente do quadril',
    zones: zones(
      `corrida lenta, quase um trote; ${FALA_LEVE}`,
      `ritmo firme e constante; ${FALA_MODERADA}`,
      '2 min um pouco mais rápido e 2 min lento, sem tiros de velocidade.',
    ),
    context: 'Evite aumentar o volume ou a velocidade de uma vez em dias perto do treino de pernas',
  }),
  content('circuito-corporal', {
    setup: [
      'Espaço livre de 1 a 2 metros, de tênis, em piso firme',
      'Sequência: marcha no lugar, socos alternados e calcanhar no glúteo, 30 a 40 s cada',
    ],
    steps: [
      'Marcha: suba os joelhos até perto da altura do quadril, alternando, com os braços acompanhando',
      'Socos: base firme, estique um braço à frente e volte à guarda, alternando os lados',
      'Calcanhar no glúteo: leve um calcanhar para trás de cada vez, sem saltar',
      'Passe de um movimento para o outro sem parar e recomece a sequência',
    ],
    commonError: 'Transformar a marcha em saltos: um pé fica sempre no chão',
    zones: zones(
      `movimentos lentos e amplos; ${FALA_LEVE}`,
      `ritmo mais rápido, sem saltar; ${FALA_MODERADA}`,
      '1 volta mais rápida e 1 volta lenta, repetindo.',
    ),
  }),
])
