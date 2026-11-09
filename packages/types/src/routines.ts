import type { Region, StressLevel } from './conditions'
import type { CardioZone } from './method'
import type { MotionKey } from './motion'

export type ComplementaryCategory = 'alongamento-mobilidade' | 'core-abdominal' | 'cardio'

export const COMPLEMENTARY_CATEGORIES: readonly ComplementaryCategory[] = [
  'alongamento-mobilidade',
  'core-abdominal',
  'cardio',
] as const

export interface StretchMobilityEntry {
  id: string
  name: string
  regions: Region[]
  /** Grupos musculares do treino principal beneficiados por este movimento. */
  targetGroups: string[]
  mode: 'tempo' | 'repeticoes'
  unilateral: boolean
  defaultSeconds?: number
  defaultReps?: string
  stress: { joelho: StressLevel; ombro: StressLevel; lombar: StressLevel }
  cues: string[]
  motion: MotionKey
}

export interface CoreRoutineCatalogEntry {
  id: string
  name: string
  focus: 'anti-extensao' | 'anti-rotacao' | 'flexao'
  mode: 'tempo' | 'repeticoes'
  unilateral: boolean
  defaultSets: number
  defaultSeconds?: number
  defaultReps?: string
  restSeconds: number
  stress: { joelho: StressLevel; ombro: StressLevel; lombar: StressLevel }
  cues: string[]
  motion: MotionKey
}

export interface ComplementaryRoutineItem {
  id: string
  name: string
  mode: 'tempo' | 'repeticoes' | 'cardio'
  sets: number
  seconds?: number
  reps?: string
  unilateral?: boolean
  restSeconds: number
  cues: string[]
  motion: MotionKey
  regions?: Region[]
  cardio?: {
    modality: string
    minutes: number
    zone: CardioZone
    allowedModalities: string[]
  }
}

export interface ComplementaryRoutine {
  category: ComplementaryCategory
  title: string
  subtitle: string
  purpose: string
  daysPerWeek: number
  estimatedMinutes: number
  items: ComplementaryRoutineItem[]
  legDayWarning?: string | null
}

export interface CategoryPreference {
  daysPerWeek?: number
  targetMinutes?: number
  preferredModality?: string
  focusRegions?: Region[]
}

export type ComplementaryPreferences = Partial<Record<ComplementaryCategory, CategoryPreference>>

export interface ComplementaryRoutineLogItem {
  id: string
  name: string
  setsCompleted: number
  secondsOrReps?: string
}

export interface ComplementaryRoutineLog {
  id: string
  category: ComplementaryCategory
  performed_on: string
  performed_at: string
  duration_minutes: number
  modality?: string | null
  zone?: CardioZone | null
  effort?: number | null
  items: ComplementaryRoutineLogItem[]
  notes?: string | null
}

export interface ComplementaryCategoryProgress {
  category: ComplementaryCategory
  doneToday: boolean
  completedThisWeek: number
  targetPerWeek: number
  lastPerformedOn: string | null
}

export interface ComplementaryRoutinesView {
  routines: Record<ComplementaryCategory, ComplementaryRoutine>
  progress: Record<ComplementaryCategory, ComplementaryCategoryProgress>
  recentLogs: ComplementaryRoutineLog[]
  preferences: ComplementaryPreferences
  completedToday: ComplementaryCategory[]
}

export const STRETCH_MOBILITY_BANK: StretchMobilityEntry[] = [
  {
    id: 'mob-tornozelo-parede',
    name: 'Mobilidade de Tornozelo na Parede',
    regions: ['tornozelo', 'joelho'],
    targetGroups: ['quadriceps', 'panturrilha'],
    mode: 'repeticoes',
    unilateral: true,
    defaultReps: '10 por lado',
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'calf-raise',
    cues: [
      'Em pé de frente para a parede, um pé a cerca de 8–10 cm do rodapé',
      'Avance o joelho na direção da parede sem tirar o calcanhar do chão',
      'Retorne devagar e repita no ritmo controlado',
      'Erro comum: levantar o calcanhar para forçar o alcance',
    ],
  },
  {
    id: 'alongamento-flexores-quadril',
    name: 'Alongamento de Flexores de Quadril (Meio Ajoelhado)',
    regions: ['quadril', 'lombar', 'joelho'],
    targetGroups: ['quadriceps', 'gluteo'],
    mode: 'tempo',
    unilateral: true,
    defaultSeconds: 30,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'lunge',
    cues: [
      'Meio ajoelhado sobre apoio macio, tronco ereto e pelve encaixada',
      'Contraia o glúteo do lado de trás e projete o quadril suavemente à frente',
      'Sustente respirando fundo sem arquear a lombar',
      'Erro comum: jogar a barriga para frente em vez de encaixar o quadril',
    ],
  },
  {
    id: 'alongamento-posterior-deitado',
    name: 'Alongamento de Posterior de Coxa Deitado',
    regions: ['quadril', 'joelho', 'lombar'],
    targetGroups: ['posterior', 'gluteo'],
    mode: 'tempo',
    unilateral: true,
    defaultSeconds: 30,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'leg-raise',
    cues: [
      'Deitado de costas com a lombar apoiada no chão',
      'Eleve uma perna segurando atrás da coxa e estenda o joelho até sentir alongar',
      'Mantenha o pescoço e os ombros relaxados no solo',
      'Erro comum: tirar o quadril ou a cabeça do chão para subir mais a perna',
    ],
  },
  {
    id: 'alongamento-gluteo-figura-4',
    name: 'Alongamento de Glúteo e Piriforme (Figura 4)',
    regions: ['quadril', 'lombar'],
    targetGroups: ['gluteo', 'posterior'],
    mode: 'tempo',
    unilateral: true,
    defaultSeconds: 30,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'hip-abduction',
    cues: [
      'Deitado de costas, apoie o tornozelo de um lado sobre a coxa oposta',
      'Puxe a coxa de apoio em direção ao peito até sentir alongar o glúteo',
      'Mantenha a cabeça e a lombar apoiadas no chão',
      'Erro comum: girar o tronco ou tensionar os ombros',
    ],
  },
  {
    id: 'mobilidade-quadril-90-90',
    name: 'Mobilidade de Quadril 90/90',
    regions: ['quadril', 'joelho'],
    targetGroups: ['gluteo', 'quadriceps', 'posterior'],
    mode: 'repeticoes',
    unilateral: true,
    defaultReps: '8 por lado',
    stress: { joelho: 1, ombro: 0, lombar: 0 },
    motion: 'hip-abduction',
    cues: [
      'Sentado no chão com as duas pernas flexionadas a 90 graus',
      'Alterne os joelhos de um lado para o outro mantendo a coluna longa',
      'Use as mãos atrás do quadril se precisar aliviar os joelhos',
      'Erro comum: forçar o joelho contra o chão sentindo desconforto articular',
    ],
  },
  {
    id: 'ponte-gluteo-ativacao',
    name: 'Ponte de Glúteo Isométrica (Ativação Protetora)',
    regions: ['quadril', 'joelho', 'lombar'],
    targetGroups: ['gluteo', 'posterior'],
    mode: 'tempo',
    unilateral: false,
    defaultSeconds: 30,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'hip-thrust',
    cues: [
      'Deitado de costas, joelhos flexionados e pés firmes na largura do quadril',
      'Eleve o quadril contraindo os glúteos até alinhar joelhos, quadril e ombros',
      'Sustente no topo mantendo as costelas baixas e o abdômen firme',
      'Erro comum: subir demais arqueando a lombar em vez de usar os glúteos',
    ],
  },
  {
    id: 'gato-camelo-coluna',
    name: 'Mobilidade de Coluna Gato-Camelo',
    regions: ['lombar', 'sistemica'],
    targetGroups: ['costas', 'core'],
    mode: 'repeticoes',
    unilateral: false,
    defaultReps: '10 ciclos',
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'plank',
    cues: [
      'Em quatro apoios com mãos abaixo dos ombros e joelhos abaixo do quadril',
      'Arredonde a coluna para o teto soltando o ar e depois abra o peito suavemente',
      'Movimente vértebra por vértebra sem forçar o final da amplitude',
      'Erro comum: fazer o movimento rápido ou forçar dor na lombar',
    ],
  },
  {
    id: 'rotacao-toracica-livro-aberto',
    name: 'Rotação Torácica Deitado (Livro Aberto)',
    regions: ['ombro', 'lombar'],
    targetGroups: ['peito', 'costas', 'ombro'],
    mode: 'repeticoes',
    unilateral: true,
    defaultReps: '8 por lado',
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'cable-rotation',
    cues: [
      'Deitado de lado com os joelhos dobrados à frente na altura do quadril',
      'Abra o braço de cima girando o peito para o outro lado e acompanhando com o olhar',
      'Mantenha os joelhos unidos no chão para o giro vir da região torácica',
      'Erro comum: levantar o joelho de cima e girar pela lombar',
    ],
  },
  {
    id: 'alongamento-peitoral-porta',
    name: 'Alongamento de Peitoral e Ombro Anterior',
    regions: ['ombro', 'cotovelo'],
    targetGroups: ['peito', 'ombro'],
    mode: 'tempo',
    unilateral: true,
    defaultSeconds: 30,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'fly',
    cues: [
      'Apoie o antebraço no batente ou parede com o cotovelo levemente abaixo da linha do ombro',
      'Dê um passo suave à frente girando o peito até sentir alongar o peitoral',
      'Mantenha os ombros longe das orelhas',
      'Erro comum: subir demais o cotovelo ou projetar a cabeça para frente',
    ],
  },
  {
    id: 'deslizamento-escapular-parede',
    name: 'Mobilidade de Ombros e Escápulas na Parede',
    regions: ['ombro', 'cotovelo'],
    targetGroups: ['ombro', 'costas'],
    mode: 'repeticoes',
    unilateral: false,
    defaultReps: '10 repetições',
    stress: { joelho: 0, ombro: 1, lombar: 0 },
    motion: 'press-overhead',
    cues: [
      'Costas e quadril apoiados na parede, cotovelos e dorso das mãos próximos à parede',
      'Deslize os braços para cima até onde mantiver o controle sem encolher os ombros',
      'Desça controlando o movimento pelas escápulas',
      'Erro comum: desencostar a lombar da parede para compensar falta de mobilidade',
    ],
  },
  {
    id: 'alongamento-dorsal-crianca',
    name: 'Alongamento de Dorsal e Lombar (Posição da Criança)',
    regions: ['lombar', 'ombro'],
    targetGroups: ['costas', 'ombro'],
    mode: 'tempo',
    unilateral: false,
    defaultSeconds: 40,
    stress: { joelho: 1, ombro: 0, lombar: 0 },
    motion: 'rollout',
    cues: [
      'Ajoelhado, sente-se em direção aos calcanhares e estenda os braços à frente no chão',
      'Solte o peso do peito em direção ao solo respirando profundamente pelas costelas',
      'Se houver sensibilidade no joelho, mantenha o quadril mais alto',
      'Erro comum: tensionar o pescoço em vez de relaxar a cabeça',
    ],
  },
  {
    id: 'alongamento-panturrilha-parede',
    name: 'Alongamento de Panturrilha em Pé',
    regions: ['tornozelo', 'joelho'],
    targetGroups: ['panturrilha', 'posterior'],
    mode: 'tempo',
    unilateral: true,
    defaultSeconds: 30,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'calf-raise',
    cues: [
      'Mãos apoiadas na parede, uma perna recuada com o joelho estendido e calcanhar firme no chão',
      'Incline o corpo à frente mantendo o calcanhar de trás colado no solo',
      'Pé de trás apontando diretamente para frente',
      'Erro comum: girar o pé de trás para fora ou tirar o calcanhar do chão',
    ],
  },
  {
    id: 'alongamento-quadriceps-lateral',
    name: 'Alongamento de Quadríceps Deitado de Lado',
    regions: ['quadril', 'joelho'],
    targetGroups: ['quadriceps'],
    mode: 'tempo',
    unilateral: true,
    defaultSeconds: 30,
    stress: { joelho: 1, ombro: 0, lombar: 0 },
    motion: 'leg-curl',
    cues: [
      'Deitado de lado, segure o peito do pé da perna de cima levando o calcanhar ao glúteo',
      'Mantenha os dois joelhos alinhados e o quadril encaixado',
      'Use uma toalha no tornozelo se não quiser flexionar tanto o joelho',
      'Erro comum: puxar o joelho para trás arqueando a lombar',
    ],
  },
  {
    id: 'mobilidade-punhos-antebraco',
    name: 'Mobilidade e Alongamento de Punhos e Antebraços',
    regions: ['punho', 'cotovelo'],
    targetGroups: ['biceps', 'triceps', 'peito', 'costas'],
    mode: 'tempo',
    unilateral: true,
    defaultSeconds: 25,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'curl',
    cues: [
      'Estenda um braço à frente com a palma para cima e puxe suavemente os dedos para trás',
      'Depois inverta com a palma para baixo alongando os extensores do punho',
      'Mantenha o cotovelo destravado e o ombro baixo',
      'Erro comum: puxar os dedos com força excessiva',
    ],
  },
  {
    id: 'alongamento-triceps-ombro',
    name: 'Alongamento de Tríceps e Cápsula Posterior do Ombro',
    regions: ['ombro', 'cotovelo'],
    targetGroups: ['triceps', 'ombro'],
    mode: 'tempo',
    unilateral: true,
    defaultSeconds: 25,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'ext-overhead',
    cues: [
      'Leve um braço à frente do peito ou acima da cabeça segurando pelo cotovelo com a outra mão',
      'Puxe suavemente mantendo o tronco ereto e o pescoço livre',
      'Respire devagar sem girar o tronco',
      'Erro comum: empurrar a cabeça para frente com o braço',
    ],
  },
  {
    id: 'respiracao-diafragmatica-recuperacao',
    name: 'Descompressão Lombar e Respiração Diafragmática 90/90',
    regions: ['sistemica', 'lombar'],
    targetGroups: ['core', 'costas', 'quadriceps', 'posterior'],
    mode: 'tempo',
    unilateral: false,
    defaultSeconds: 45,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'plank',
    cues: [
      'Deitado de costas com as pernas apoiadas sobre um banco ou cadeira (quadril e joelhos a 90°)',
      'Inspire pelo nariz expandindo as costelas e solte o ar lentamente pela boca por 6 segundos',
      'Deixe a lombar e os ombros pesarem completamente no chão',
      'Erro comum: respirar curto pelo peito e tensionar o pescoço',
    ],
  },
]

export const CORE_ROUTINE_ITEMS: CoreRoutineCatalogEntry[] = [
  {
    id: 'prancha-abdominal-corporal',
    name: 'Prancha Abdominal (Peso Corporal)',
    focus: 'anti-extensao',
    mode: 'tempo',
    unilateral: false,
    defaultSets: 3,
    defaultSeconds: 30,
    restSeconds: 30,
    stress: { joelho: 0, ombro: 1, lombar: 0 },
    motion: 'plank',
    cues: [
      'Antebraços e pontas dos pés no chão, corpo formando uma linha reta',
      'Contraia o abdômen e o glúteo para evitar que o quadril caia',
      'Olhe para o chão entre as mãos mantendo o pescoço neutro',
      'Erro comum: prender a respiração ou deixar a lombar afundar',
    ],
  },
  {
    id: 'prancha-lateral-corporal',
    name: 'Prancha Lateral (Peso Corporal)',
    focus: 'anti-rotacao',
    mode: 'tempo',
    unilateral: true,
    defaultSets: 2,
    defaultSeconds: 25,
    restSeconds: 30,
    stress: { joelho: 0, ombro: 1, lombar: 0 },
    motion: 'plank',
    cues: [
      'Apoio em um antebraço e na lateral dos pés (ou joelho dobrado), corpo alinhado',
      'Eleve o quadril até formar uma linha reta da cabeça aos pés',
      'Sustente pelo tempo indicado e troque de lado',
      'Erro comum: deixar o quadril cair ou girar o peito para o chão',
    ],
  },
  {
    id: 'dead-bug-estabilidade',
    name: 'Dead Bug (Estabilidade Lombar)',
    focus: 'anti-extensao',
    mode: 'repeticoes',
    unilateral: true,
    defaultSets: 3,
    defaultReps: '8 por lado',
    restSeconds: 30,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'leg-raise',
    cues: [
      'Deitado de costas, lombar colada no chão, braços para o teto e joelhos a 90 graus',
      'Estenda lentamente um braço para trás e a perna oposta para frente sem desencostar a lombar',
      'Volte ao centro soltando o ar e alterne o lado',
      'Erro comum: descer a perna rápido demais deixando a lombar arquear',
    ],
  },
  {
    id: 'abdominal-supra-corporal',
    name: 'Abdominal Supra Curto (Peso Corporal)',
    focus: 'flexao',
    mode: 'repeticoes',
    unilateral: false,
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 30,
    stress: { joelho: 0, ombro: 0, lombar: 0 },
    motion: 'crunch',
    cues: [
      'Deitado, joelhos flexionados, mãos leves atrás da cabeça ou cruzadas no peito',
      'Eleve apenas as escápulas do chão contraindo o abdômen e soltando o ar',
      'Desça controlando sem puxar o pescoço',
      'Erro comum: puxar a cabeça com as mãos',
    ],
  },
  {
    id: 'abdominal-infra-corporal',
    name: 'Abdominal Infra Controlado (Peso Corporal)',
    focus: 'flexao',
    mode: 'repeticoes',
    unilateral: false,
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 35,
    stress: { joelho: 0, ombro: 0, lombar: 1 },
    motion: 'leg-raise',
    cues: [
      'Deitado de costas, mãos ao lado do corpo e lombar firme no chão',
      'Traga os joelhos em direção ao peito tirando levemente o quadril do solo',
      'Desça devagar só até onde a lombar permanecer colada no chão',
      'Erro comum: usar impulso das pernas e arquear a lombar na descida',
    ],
  },
  {
    id: 'prancha-toque-ombro-corporal',
    name: 'Prancha Alta com Toque no Ombro',
    focus: 'anti-rotacao',
    mode: 'repeticoes',
    unilateral: true,
    defaultSets: 3,
    defaultReps: '10 por lado',
    restSeconds: 35,
    stress: { joelho: 0, ombro: 1, lombar: 1 },
    motion: 'plank',
    cues: [
      'Posição de prancha alta com os pés um pouco mais afastados que os ombros',
      'Toque o ombro oposto com uma mão mantendo o quadril firme sem balançar',
      'Alterne os lados de forma lenta e controlada',
      'Erro comum: girar o quadril de um lado para o outro a cada toque',
    ],
  },
  {
    id: 'hollow-hold-corporal',
    name: 'Hollow Hold (Canoinha Isométrica)',
    focus: 'anti-extensao',
    mode: 'tempo',
    unilateral: false,
    defaultSets: 3,
    defaultSeconds: 20,
    restSeconds: 35,
    stress: { joelho: 0, ombro: 0, lombar: 1 },
    motion: 'plank',
    cues: [
      'Deitado de costas, pressione firmemente a lombar contra o chão',
      'Eleve as escápulas e as pernas (flexionadas ou estendidas) mantendo o abdômen contraído',
      'Se a lombar desencostar do chão, dobre um pouco os joelhos',
      'Erro comum: manter as pernas baixas demais perdendo o contato da lombar',
    ],
  },
  {
    id: 'abdominal-bicicleta-corporal',
    name: 'Abdominal Bicicleta Controlado',
    focus: 'flexao',
    mode: 'repeticoes',
    unilateral: true,
    defaultSets: 3,
    defaultReps: '10 por lado',
    restSeconds: 35,
    stress: { joelho: 0, ombro: 0, lombar: 1 },
    motion: 'crunch',
    cues: [
      'Deitado de costas, mãos leves na lateral da cabeça e joelhos elevados',
      'Gire o ombro em direção ao joelho oposto enquanto estende a outra perna',
      'Pause 1 segundo em cada lado antes de trocar',
      'Erro comum: girar só os cotovelos rápido sem girar o tronco',
    ],
  },
]
