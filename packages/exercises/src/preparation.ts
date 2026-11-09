import { REGIONS } from '@helux/types'
import { GEARS, type PreparationItem, type PreparationPhase } from './types'

/** Catálogo de aquecimento, volta à calma e mobilidade (US6). Itens novos nascem completos e nunca ficam pendentes. */
export const PREPARATION_ITEMS: PreparationItem[] = [
  /* ---------------------------------------------------------------- lote P1: aquecimento geral */
  {
    id: 'bike-leve',
    name: 'Bike leve',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['sistemica', 'joelho', 'quadril'],
    mode: 'continuo',
    needs: ['bicicleta'],
    knownNames: [],
    guidance: {
      setup: ['Selim na altura do quadril em pé: embaixo, o joelho fica quase estendido'],
      steps: ['Pedale num ritmo em que dá para conversar', 'Aumente a cadência aos poucos nos últimos minutos'],
      commonError: 'Começar forte demais e cansar antes do treino',
      context: 'Aquece o corpo todo com pouco impacto nos joelhos',
    },
  },
  {
    id: 'remo-leve',
    name: 'Remo leve',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['sistemica', 'lombar'],
    mode: 'continuo',
    needs: ['remo'],
    knownNames: [],
    guidance: {
      setup: ['Pés presos no apoio, braços estendidos segurando o puxador, joelhos dobrados'],
      steps: [
        'Empurre com as pernas e só depois leve o tronco um pouco para trás',
        'Puxe o puxador até o abdome, cotovelos junto do corpo',
        'Volte na ordem inversa: braços, tronco e por fim os joelhos',
      ],
      commonError: 'Puxar com os braços antes de empurrar com as pernas',
      context: 'Aquece pernas, costas e braços de uma vez',
    },
  },
  {
    id: 'marcha-no-lugar',
    name: 'Marcha no lugar',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['sistemica', 'quadril'],
    mode: 'continuo',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Em pé, tronco ereto, braços soltos ao lado do corpo'],
      steps: ['Suba um joelho até a altura do quadril, com o braço oposto à frente', 'Alterne as pernas num ritmo constante'],
      commonError: 'Inclinar o tronco para trás ao subir o joelho',
      context: 'Aquece sem equipamento e sem impacto',
    },
  },
  {
    id: 'polichinelo-leve',
    name: 'Polichinelo leve',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['sistemica'],
    mode: 'continuo',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Em pé, pés juntos, braços ao lado do corpo'],
      steps: ['Abra as pernas e suba os braços pelos lados até acima da cabeça', 'Volte à posição inicial, aterrissando com os joelhos soltos'],
      commonError: 'Aterrissar com os joelhos travados',
      context: 'Sem pular, dá para abrir uma perna de cada vez',
    },
  },
  {
    id: 'balanco-perna',
    name: 'Balanço de perna',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['quadril'],
    mode: 'por-lado',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Em pé sobre uma perna, com a mão numa parede ou apoio para equilibrar'],
      steps: ['Balance a perna livre para a frente e para trás, sem forçar', 'Aumente a amplitude aos poucos e depois troque de perna'],
      commonError: 'Balançar o tronco junto com a perna',
    },
  },
  /* ---------------------------------------------------------------- lote P1: ativação de membros superiores */
  {
    id: 'circulos-braco',
    name: 'Círculos de braço',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['ombro'],
    mode: 'reps',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Em pé, braços estendidos ao lado do corpo'],
      steps: ['Gire os braços em círculos para a frente, de menor para maior', 'Depois faça o mesmo para trás'],
      commonError: 'Subir os ombros em direção às orelhas',
    },
  },
  {
    id: 'deslizamento-parede',
    name: 'Deslizamento na parede',
    kind: 'preparacao',
    phases: ['aquecimento', 'mobilidade'],
    regions: ['ombro'],
    mode: 'reps',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Costas na parede, cotovelos e mãos encostados nela, braços em W'],
      steps: ['Deslize os braços para cima até formar um Y, sem tirar as mãos da parede', 'Desça devagar até o W'],
      commonError: 'Arquear a lombar para conseguir subir mais',
    },
  },
  {
    id: 'rotacao-externa-elastico',
    name: 'Rotação externa com elástico',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['ombro'],
    mode: 'por-lado',
    needs: ['elastico'],
    knownNames: [],
    guidance: {
      setup: ['Elástico preso à frente, cotovelo dobrado a 90 graus na altura do ombro'],
      steps: ['Gire o antebraço para cima até apontar para o teto', 'Volte devagar até o antebraço ficar na horizontal'],
      commonError: 'Deixar o cotovelo cair durante o giro',
      context: 'Ativa o manguito rotador antes de empurrar ou puxar acima da cabeça',
    },
  },
  {
    id: 'rotacao-passagem-ombro-elastico',
    name: 'Rotação e passagem de ombro com elástico',
    kind: 'preparacao',
    phases: ['aquecimento', 'mobilidade'],
    regions: ['ombro'],
    mode: 'reps',
    needs: ['elastico'],
    knownNames: [],
    guidance: {
      setup: ['Em pé, elástico seguro à frente das coxas, mãos bem afastadas'],
      steps: ['Com os braços estendidos, leve o elástico por cima da cabeça até atrás do quadril', 'Volte pelo mesmo caminho'],
      commonError: 'Dobrar os cotovelos para conseguir passar',
      context: 'Afaste mais as mãos se sentir desconforto no ombro',
    },
  },
  {
    id: 'puxada-elastico-rosto',
    name: 'Puxada de elástico para o rosto',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['ombro'],
    mode: 'reps',
    needs: ['elastico'],
    knownNames: [],
    guidance: {
      setup: ['Elástico preso à frente, na altura do rosto, braços estendidos'],
      steps: ['Puxe o elástico em direção ao rosto, abrindo os cotovelos para fora e para trás', 'Volte devagar até estender os braços'],
      commonError: 'Puxar com os cotovelos baixos, como numa remada',
      context: 'Ativa a parte de trás do ombro e ajuda a postura',
    },
  },
  {
    id: 'suspensao-ativa-barra',
    name: 'Suspensão ativa na barra',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['ombro'],
    mode: 'sustentacao',
    needs: ['barra-fixa'],
    knownNames: [],
    guidance: {
      setup: ['Pendurado na barra, mãos na largura dos ombros, braços estendidos'],
      steps: ['Desça os ombros, afastando-os das orelhas, sem dobrar os cotovelos', 'Mantenha a posição respirando normalmente'],
      commonError: 'Ficar pendurado solto, com os ombros encostando nas orelhas',
    },
  },
  /* ---------------------------------------------------------------- lote P2: ativação de membros inferiores */
  {
    id: 'ponte-gluteo',
    name: 'Ponte de glúteo',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['quadril', 'lombar'],
    mode: 'reps',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Deitado de costas, joelhos dobrados, pés no chão na largura do quadril'],
      steps: ['Suba o quadril contraindo o glúteo até alinhar ombros, quadril e joelhos', 'Desça devagar sem encostar todo o peso no chão'],
      commonError: 'Arquear a lombar no alto em vez de contrair o glúteo',
    },
  },
  {
    id: 'flexao-inclinada-leve',
    name: 'Flexão inclinada leve',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['ombro'],
    mode: 'reps',
    needs: ['banco'],
    knownNames: [],
    guidance: {
      setup: ['Mãos num banco ou apoio alto, na largura dos ombros, corpo reto dos pés à cabeça'],
      steps: ['Desça o peito em direção ao apoio, cotovelos a uns 45 graus do corpo', 'Empurre de volta sem deixar o quadril cair'],
      commonError: 'Deixar o quadril cair ou subir antes do peito',
      context: 'Quanto mais alto o apoio, mais leve fica',
    },
  },
  {
    id: 'afundo-sem-carga',
    name: 'Afundo sem carga',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['joelho', 'quadril'],
    mode: 'por-lado',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Em pé, um pé à frente e o outro atrás, tronco ereto'],
      steps: ['Desça até o joelho de trás quase tocar o chão', 'Suba empurrando o chão com o pé da frente'],
      commonError: 'Deixar o joelho da frente cair para dentro',
    },
  },
  {
    id: 'agachamento-banco-sem-carga',
    name: 'Agachamento no banco sem carga',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['joelho', 'quadril'],
    mode: 'reps',
    needs: ['banco'],
    knownNames: [],
    guidance: {
      setup: ['Em pé de costas para um banco, pés na largura dos ombros, braços à frente'],
      steps: ['Leve o quadril para trás e desça até tocar o banco de leve', 'Suba sem embalo, empurrando o chão com os pés'],
      commonError: 'Sentar e relaxar no banco antes de subir',
      context: 'O banco limita a profundidade e dá segurança para aprender o movimento',
    },
  },
  {
    id: 'dobradica-quadril-bastao',
    name: 'Dobradiça de quadril com bastão',
    kind: 'preparacao',
    phases: ['aquecimento'],
    regions: ['lombar', 'quadril'],
    mode: 'reps',
    needs: ['bastao'],
    knownNames: [],
    guidance: {
      setup: ['Bastão nas costas encostado na cabeça, entre as escápulas e no quadril; joelhos levemente dobrados'],
      steps: ['Leve o quadril para trás e incline o tronco sem perder os três pontos de contato', 'Volte contraindo o glúteo até ficar em pé'],
      commonError: 'Arredondar as costas e tirar o bastão da cabeça ou do quadril',
      context: 'Ensina o movimento do levantamento terra e do stiff sem carga',
    },
  },
  /* ---------------------------------------------------------------- lote P2: mobilidade de quadril e tornozelo */
  {
    id: 'quadril-90-90',
    name: 'Quadril 90/90',
    kind: 'preparacao',
    phases: ['mobilidade', 'aquecimento'],
    regions: ['quadril'],
    mode: 'por-lado',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Sentado no chão, perna da frente dobrada a 90 graus à frente e a de trás a 90 graus para o lado'],
      steps: ['Com o tronco reto, incline-se sobre a canela da frente até sentir o quadril', 'Volte e troque de lado girando os joelhos'],
      commonError: 'Arredondar as costas para descer mais',
    },
  },
  {
    id: 'abertura-quadril-sapo',
    name: 'Abertura de quadril (sapo)',
    kind: 'preparacao',
    phases: ['mobilidade', 'volta-calma'],
    regions: ['quadril'],
    mode: 'reps',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Em quatro apoios nos antebraços, joelhos bem afastados, canelas paralelas para trás'],
      steps: ['Leve o quadril para trás até sentir a parte interna das coxas', 'Volte devagar, sem forçar a abertura'],
      commonError: 'Afastar os joelhos além do confortável e forçar a virilha',
    },
  },
  {
    id: 'agachamento-profundo-pausa',
    name: 'Agachamento profundo com pausa',
    kind: 'preparacao',
    phases: ['mobilidade', 'aquecimento'],
    regions: ['quadril', 'tornozelo', 'joelho'],
    mode: 'sustentacao',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Em pé, pés um pouco mais abertos que os ombros, pontas levemente para fora'],
      steps: ['Desça até o fundo do agachamento, calcanhares no chão', 'Fique embaixo com as mãos juntas e os cotovelos empurrando os joelhos para fora'],
      commonError: 'Tirar os calcanhares do chão para descer mais',
      context: 'Segure num apoio à frente se o equilíbrio faltar',
    },
  },
  {
    id: 'agachamento-cossaco',
    name: 'Agachamento cossaco',
    kind: 'preparacao',
    phases: ['mobilidade', 'aquecimento'],
    regions: ['quadril', 'joelho'],
    mode: 'por-lado',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Em pé, pés bem afastados, pontas levemente para fora'],
      steps: ['Desça sobre uma perna, mantendo a outra estendida', 'Passe pelo centro e desça sobre a outra perna'],
      commonError: 'Tirar o calcanhar da perna dobrada do chão',
    },
  },
  {
    id: 'tornozelo-joelho-parede',
    name: 'Tornozelo com joelho à parede',
    kind: 'preparacao',
    phases: ['mobilidade', 'aquecimento'],
    regions: ['tornozelo'],
    mode: 'por-lado',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Semiajoelhado de frente para a parede, pé da frente a alguns centímetros dela'],
      steps: ['Leve o joelho da frente em direção à parede, por cima dos dedos', 'Volte e afaste o pé aos poucos quando o joelho tocar com facilidade'],
      commonError: 'Tirar o calcanhar do chão para o joelho alcançar a parede',
    },
  },
  {
    id: 'dorsiflexao-halux',
    name: 'Dorsiflexão do hálux',
    kind: 'preparacao',
    phases: ['mobilidade'],
    regions: ['tornozelo'],
    mode: 'sustentacao',
    needs: [],
    knownNames: [],
    guidance: {
      setup: ['Ajoelhado, com os dedos dos pés dobrados apoiados no chão'],
      steps: ['Leve o quadril em direção aos calcanhares até sentir a sola e os dedos', 'Fique na posição respirando devagar'],
      commonError: 'Deixar os dedos escorregarem e apoiar o peito do pé',
      context: 'Use um apoio sob os joelhos se incomodar',
    },
  },
]

export const PREPARATION_PHASES: readonly PreparationPhase[] = ['aquecimento', 'volta-calma', 'mobilidade']
export const PREPARATION_MODES: readonly PreparationItem['mode'][] = ['reps', 'por-lado', 'sustentacao', 'continuo']

/** Implementos que não contam como equipamento: "sem equipamento" é `needs` vazio. */
const NOT_EQUIPMENT = ['peso-corporal', 'nenhum']

/** Dados obrigatórios de um item de preparação (data-model.md). Cada problema vem como "<id>: <motivo>". */
export function preparationIssues(item: PreparationItem): string[] {
  const issues: string[] = []
  const add = (msg: string) => issues.push(`${item.id || '(sem id)'}: ${msg}`)
  if (!item.id?.trim()) add('falta id')
  if (!item.name?.trim()) add('falta nome')
  if (item.kind !== 'preparacao') add(`kind deveria ser preparacao, é ${item.kind}`)
  if (!item.phases?.length) add('falta ao menos uma fase')
  for (const p of item.phases ?? []) if (!PREPARATION_PHASES.includes(p)) add(`fase inválida ${p}`)
  if (new Set(item.phases).size !== item.phases?.length) add('fase repetida')
  if (!item.regions?.length) add('falta ao menos uma região')
  for (const r of item.regions ?? []) if (!(REGIONS as readonly string[]).includes(r)) add(`região inválida ${r}`)
  if (!PREPARATION_MODES.includes(item.mode)) add(`modo inválido ${item.mode}`)
  for (const g of item.needs ?? []) {
    if (!GEARS.includes(g)) add(`equipamento inválido ${g}`)
    else if (NOT_EQUIPMENT.includes(g)) add(`${g} não é equipamento; sem equipamento é needs vazio`)
  }
  if (!Array.isArray(item.needs)) add('falta needs (vazio = sem equipamento)')
  if (!Array.isArray(item.knownNames)) add('falta knownNames')
  for (const n of item.knownNames ?? []) if (!n.trim()) add('nome antigo vazio')
  return issues
}
