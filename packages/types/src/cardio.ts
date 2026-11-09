import type { Equipment } from './agents'
import type { StressLevel } from './conditions'
import type { MotionKey } from './motion'

// Spec 024 (R6) + Spec 030 (FR-006, FR-011): catálogo de cardio com impacto,
// carga articular, orientações de execução e como manter a zona prescrita.

export interface CardioBankEntry {
  id: string
  name: string
  /** 0 = sem impacto, 1 = baixo, 2 = alto. */
  impact: StressLevel
  stress: { joelho: StressLevel; ombro: StressLevel; lombar: StressLevel }
  /** Onde dá para fazer: academia (máquina), casa/ao ar livre (peso corporal) ou piscina. */
  setting: 'academia' | 'casa' | 'ao-ar-livre' | 'piscina'
  equipment: Equipment | 'piscina' | 'nenhum'
  motion: MotionKey
  cues: string[]
  zoneGuidance: {
    leve: string
    moderada: string
    'intervalado-leve': string
  }
}

const DEFAULT_ZONES: CardioBankEntry['zoneGuidance'] = {
  leve: 'Ritmo confortável em que você consegue conversar frases completas sem ofegar (Zona 2 leve).',
  moderada: 'Respiração mais profunda mantendo ritmo constante, falando frases curtas (Zona 2–3).',
  'intervalado-leve': 'Alterne 2 min em ritmo moderado com 2 min em ritmo leve de recuperação, sem picos máximos.',
}

const c = (
  id: string,
  name: string,
  impact: StressLevel,
  joelho: StressLevel,
  ombro: StressLevel,
  lombar: StressLevel,
  setting: CardioBankEntry['setting'],
  equipment: CardioBankEntry['equipment'],
  motion: MotionKey,
  cues: string[],
): CardioBankEntry => ({
  id,
  name,
  impact,
  stress: { joelho, ombro, lombar },
  setting,
  equipment,
  motion,
  cues,
  zoneGuidance: DEFAULT_ZONES,
})

export const CARDIO_BANK: CardioBankEntry[] = [
  c('bike', 'Bike ergométrica', 0, 0, 0, 0, 'academia', 'maquina-cabo', 'leg-press', [
    'Ajuste o selim na altura do quadril para o joelho manter leve flexão no ponto mais baixo',
    'Pedale em cadência fluida (75–90 rpm) com carga leve a moderada, sem travar o joelho',
    'Erro comum: selim baixo demais, aumentando a compressão na frente do joelho',
  ]),
  c('bike-intervalado', 'Bike ergométrica intervalada', 0, 1, 0, 0, 'academia', 'maquina-cabo', 'leg-press', [
    'Use 5 min iniciais leves para aquecer a articulação antes dos blocos moderados',
    'Aumente a cadência ou 1–2 níveis de carga nos blocos ativos mantendo o quadril estável no banco',
    'Erro comum: colocar carga pesada demais e pedalar em pé forçando o joelho',
  ]),
  c('eliptico', 'Elíptico', 0, 0, 0, 0, 'academia', 'maquina-cabo', 'lunge', [
    'Mantenha os pés inteiros apoiados nas plataformas e o tronco ereto',
    'Divida o esforço entre pernas e braços em movimento contínuo sem impacto',
    'Erro comum: apoiar só na ponta dos pés ou inclinar o corpo sobre o painel',
  ]),
  c('remo', 'Remo ergométrico', 0, 1, 1, 1, 'academia', 'maquina-cabo', 'row', [
    'Sequência na puxada: empurre com as pernas, incline levemente o tronco e puxe a manopla ao esterno',
    'No retorno, estenda os braços antes de dobrar os joelhos, mantendo a coluna neutra',
    'Erro comum: puxar com os braços antes de empurrar com as pernas ou arredondar a lombar',
  ]),
  c('natacao', 'Natação', 0, 0, 1, 0, 'piscina', 'piscina', 'pull-vertical', [
    'Priorize nado crawl ou costas com rolamento suave do tronco e pernada contínua',
    'Solte o ar dentro da água de forma ritmada para manter a frequência cardíaca estável',
    'Erro comum: pernada de peito forte quando há sensibilidade no joelho',
  ]),
  c('caminhada', 'Caminhada', 1, 0, 0, 0, 'ao-ar-livre', 'nenhum', 'lunge', [
    'Passada natural tocando o calcanhar primeiro e desenrolando o pé até a ponta',
    'Postura alta, olhar à frente e braços acompanhando o ritmo ao lado do corpo',
    'Erro comum: alongar demais o passo à frente batendo o calcanhar seco no chão',
  ]),
  c('caminhada-inclinada', 'Caminhada inclinada na esteira', 1, 1, 0, 1, 'academia', 'maquina-cabo', 'lunge', [
    'Use inclinação moderada (3% a 8%) e velocidade controlada, sem segurar no painel',
    'Incline levemente o corpo a partir dos tornozelos, mantendo o core firme',
    'Erro comum: segurar nas barras da esteira e jogar o tronco para trás',
  ]),
  c('escada', 'Escada / stepper', 1, 1, 0, 0, 'academia', 'maquina-cabo', 'squat', [
    'Apoie o pé inteiro no degrau e suba empurrando pelo calcanhar e meio do pé',
    'Use o corrimão apenas para equilíbrio leve, sem descarregar o peso nos braços',
    'Erro comum: subir na ponta dos pés ou debruçar sobre o aparelho',
  ]),
  c('corrida-caminhada', 'Corrida alternada com caminhada', 2, 1, 0, 0, 'ao-ar-livre', 'nenhum', 'lunge', [
    'Alterne blocos curtos de trote leve com caminhada ativa antes de acumular fadiga articular',
    'Mantenha passos curtos e cadência leve, aterrissando próximo ao centro do corpo',
    'Erro comum: correr rápido demais nos blocos de trote e perder a postura',
  ]),
  c('corrida', 'Corrida', 2, 2, 0, 1, 'ao-ar-livre', 'nenhum', 'lunge', [
    'Mantenha cadência ágil e passada curta, evitando bater o calcanhar longe à frente do quadril',
    'Tronco firme, ombros baixos e cotovelos a cerca de 90 graus',
    'Erro comum: aumentar o volume ou a velocidade bruscamente em dias próximos ao treino de pernas',
  ]),
  c('circuito-corporal', 'Circuito com o peso do corpo (sem saltos)', 1, 1, 1, 0, 'casa', 'peso-corporal', 'squat', [
    'Alterne movimentos contínuos sem salto (marcha estacionária, agachamento parcial, deslocamento lateral)',
    'Mantenha transição fluida entre os exercícios para sustentar a zona cardíaca',
    'Erro comum: transformar o circuito em saltos de alto impacto',
  ]),
]
