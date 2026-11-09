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
