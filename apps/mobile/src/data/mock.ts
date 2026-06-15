import type { ActiveExercise, ActiveSession, SuggestedSet, Variant } from '@helux/workouts'

// ── Local interfaces ──────────────────────────────────────────

export interface UserProfile {
  name: string
  firstName: string
  goal: string
  geneticScore: number
  recovery: number
  streak: number
  week: { done: number; target: number }
}

export interface GeneticTrait {
  key: string
  label: string
  value: string
  tag: string
  level: number
  gene: string
  note: string
  warn?: boolean
}

export interface GeneticDriver {
  icon: string
  title: string
  text: string
}

export interface GeneticProfile {
  score: number
  summary: string
  traits: GeneticTrait[]
  drivers: GeneticDriver[]
}

export interface WorkoutListItem {
  id: string
  name: string
  focus: string
  duration: number
  exercises: number
  match: number
  last: string
  today?: boolean
}

export interface Program {
  name: string
  phase: string
  week: number
  weeks: number
  split: string
  match: number
}

export interface VolumePoint {
  w: string
  v: number
}

export interface PersonalRecordItem {
  lift: string
  value: string
  delta: string
  when: string
  up: boolean
}

export interface StatItem {
  label: string
  value: string
  sub: string
}

export interface SessionHistoryItem {
  name: string
  date: string
  volume: string
  sets: number
  dur: number
}

export interface ProgressData {
  volume: VolumePoint[]
  records: PersonalRecordItem[]
  stats: StatItem[]
  history: SessionHistoryItem[]
}

// ── Mock data ─────────────────────────────────────────────────

export const MOCK_USER: UserProfile = {
  name: 'Rafael',
  firstName: 'Rafael',
  goal: 'Hipertrofia',
  geneticScore: 86,
  recovery: 88,
  streak: 12,
  week: { done: 3, target: 5 },
}

export const MOCK_GENETICS: GeneticProfile = {
  score: 86,
  summary:
    'Seu DNA favorece força e explosão, com recuperação acima da média. O Helux ajusta volume, carga e descanso para extrair o máximo do seu perfil.',
  traits: [
    {
      key: 'fibra',
      label: 'Fibras musculares',
      value: '68% rápidas',
      tag: 'Força · Explosão',
      level: 0.68,
      gene: 'ACTN3 (R/R)',
      note: 'Você responde melhor a cargas altas e repetições baixas.',
    },
    {
      key: 'recup',
      label: 'Recuperação muscular',
      value: 'Rápida',
      tag: 'Alta frequência',
      level: 0.84,
      gene: 'IL6 / IGF-1',
      note: 'Tolera treinar o mesmo grupo até 2x por semana.',
    },
    {
      key: 'hiper',
      label: 'Resposta a hipertrofia',
      value: 'Alta',
      tag: 'Ganho muscular',
      level: 0.78,
      gene: 'IGF-1',
      note: 'Volume moderado-alto gera ótimo estímulo de crescimento.',
    },
    {
      key: 'forca',
      label: 'Predisposição a força',
      value: 'Alta',
      tag: '',
      level: 0.81,
      gene: 'ACE (D/D)',
      note: 'Curva de força sobe rápido — progrida cargas com confiança.',
    },
    {
      key: 'resist',
      label: 'Resistência aeróbica',
      value: 'Moderada',
      tag: '',
      level: 0.48,
      gene: 'PPARGC1A',
      note: 'Cardio em zona 2 ajuda recuperação sem roubar ganhos.',
    },
    {
      key: 'lesao',
      label: 'Risco tendíneo',
      value: 'Moderado',
      tag: 'Atenção',
      level: 0.46,
      warn: true,
      gene: 'COL5A1',
      note: 'Aquecimento articular e progressão gradual reduzem risco.',
    },
  ],
  drivers: [
    { icon: 'load', title: 'Cargas mais altas', text: 'Faixas de 6–8 reps nos compostos principais.' },
    { icon: 'freq', title: 'Frequência 2x', text: 'Cada grupo muscular treinado duas vezes por semana.' },
    { icon: 'rest', title: 'Descanso 90–120s', text: 'Pausas maiores para sustentar a intensidade.' },
    { icon: 'mob', title: 'Mobilidade no aquecimento', text: 'Protege tendões com perfil de risco moderado.' },
  ],
}

export const MOCK_PROGRAM: Program = {
  name: 'Hipertrofia Genética',
  phase: 'Bloco 2 · Acúmulo',
  week: 6,
  weeks: 8,
  split: 'Push · Pull · Legs',
  match: 92,
}

export const MOCK_WORKOUTS: WorkoutListItem[] = [
  { id: 'push-a', name: 'Push A', focus: 'Peito · Ombro · Tríceps', duration: 52, exercises: 6, match: 94, last: 'há 3 dias', today: true },
  { id: 'pull-a', name: 'Pull A', focus: 'Costas · Bíceps', duration: 48, exercises: 6, match: 88, last: 'há 2 dias' },
  { id: 'legs-a', name: 'Legs A', focus: 'Quadríceps · Posterior · Panturrilha', duration: 56, exercises: 7, match: 90, last: 'há 4 dias' },
  { id: 'push-b', name: 'Push B', focus: 'Ombro · Peito superior', duration: 50, exercises: 6, match: 85, last: 'há 6 dias' },
  { id: 'pull-b', name: 'Pull B', focus: 'Largura · Trapézio', duration: 47, exercises: 6, match: 87, last: 'há 5 dias' },
]

const sessionExercises: ActiveExercise[] = [
  {
    id: 'e1',
    name: 'Supino reto com barra',
    muscle: 'Peito',
    scheme: '4 × 6-8',
    rest: 120,
    match: 96,
    gene: 'Cargas altas — seu forte',
    tempo: '2 · 0 · 1',
    muscles: { primary: ['peito'], secondary: ['ombro', 'triceps'] },
    cues: [
      'Escápulas retraídas e pés firmes no chão',
      'Desça a barra na linha do mamilo, cotovelos ~45°',
      'Empurre explodindo, sem travar os cotovelos',
    ],
    suggestedSets: [
      { prev: '60 kg × 8', w: 62.5, r: 8 },
      { prev: '60 kg × 7', w: 62.5, r: 7 },
      { prev: '60 kg × 7', w: 60, r: 8 },
      { prev: '57.5 kg × 8', w: 60, r: 7 },
    ] as SuggestedSet[],
    variants: [
      { id: 'e1', rec: true, name: 'Supino reto com barra', equip: 'Barra', level: 'Intermediário', match: 96, motion: 'press-flat', implement: 'barbell', why: 'Cargas altas casam com suas fibras rápidas (ACTN3).' },
      { id: 'e1b', name: 'Supino reto com halteres', equip: 'Halteres', level: 'Intermediário', match: 90, motion: 'press-flat', implement: 'dumbbell', why: 'Maior amplitude e estabilização; corrige assimetrias.' },
      { id: 'e1c', name: 'Supino na máquina', equip: 'Máquina', level: 'Iniciante', match: 84, motion: 'press-flat', implement: 'machine', why: 'Mais seguro para falhar sozinho, menos estabilização.' },
      { id: 'e1d', name: 'Crucifixo com halteres', equip: 'Halteres', level: 'Intermediário', match: 78, motion: 'raise-lateral', implement: 'dumbbell', why: 'Isola o peitoral; pouca sobrecarga de força.' },
    ] as Variant[],
  },
  {
    id: 'e2',
    name: 'Supino inclinado halter',
    muscle: 'Peito sup.',
    scheme: '3 × 8-10',
    rest: 90,
    match: 91,
    tempo: '2 · 1 · 1',
    muscles: { primary: ['peito', 'ombro'], secondary: ['triceps'] },
    cues: [
      'Banco a 30°, halteres na linha do peito alto',
      'Cotovelos levemente à frente do tronco',
      'Junte os halteres no topo sem batê-los',
    ],
    suggestedSets: [
      { prev: '26 kg × 10', w: 28, r: 9 },
      { prev: '26 kg × 9', w: 26, r: 10 },
      { prev: '24 kg × 10', w: 26, r: 9 },
    ] as SuggestedSet[],
    variants: [
      { id: 'e2', rec: true, name: 'Supino inclinado halter', equip: 'Halteres', level: 'Intermediário', match: 91, motion: 'press-incline', implement: 'dumbbell', why: 'Amplitude ideal para o peitoral superior.' },
      { id: 'e2b', name: 'Supino inclinado barra', equip: 'Barra', level: 'Intermediário', match: 88, motion: 'press-incline', implement: 'barbell', why: 'Permite mais carga e progressão linear.' },
      { id: 'e2c', name: 'Crossover na polia alta', equip: 'Polia', level: 'Iniciante', match: 80, motion: 'raise-lateral', implement: 'cable', why: 'Tensão constante; ótimo finalizador.' },
    ] as Variant[],
  },
  {
    id: 'e3',
    name: 'Desenvolvimento militar',
    muscle: 'Ombro',
    scheme: '4 × 6-8',
    rest: 120,
    match: 89,
    gene: 'Composto pesado — progrida carga',
    tempo: '2 · 0 · 1',
    muscles: { primary: ['ombro'], secondary: ['triceps', 'peito'] },
    cues: [
      'Barra na clavícula, pegada pouco mais que ombros',
      'Contraia o abdômen, sem hiperestender a lombar',
      'Empurre acima da cabeça e encaixe a barra atrás da linha do rosto',
    ],
    suggestedSets: [
      { prev: '40 kg × 7', w: 40, r: 7 },
      { prev: '40 kg × 6', w: 40, r: 6 },
      { prev: '37.5 kg × 8', w: 40, r: 6 },
      { prev: '37.5 kg × 7', w: 37.5, r: 7 },
    ] as SuggestedSet[],
    variants: [
      { id: 'e3', rec: true, name: 'Desenvolvimento militar', equip: 'Barra', level: 'Avançado', match: 89, motion: 'press-overhead', implement: 'barbell', why: 'Composto pesado — explora sua força.' },
      { id: 'e3b', name: 'Desenvolvimento com halteres', equip: 'Halteres', level: 'Intermediário', match: 86, motion: 'press-overhead', implement: 'dumbbell', why: 'Mais amplitude e estável para os ombros.' },
      { id: 'e3c', name: 'Desenvolvimento na máquina', equip: 'Máquina', level: 'Iniciante', match: 82, motion: 'press-overhead', implement: 'machine', why: 'Trajetória guiada; bom em dias de fadiga.' },
      { id: 'e3d', name: 'Arnold press', equip: 'Halteres', level: 'Avançado', match: 79, motion: 'press-overhead', implement: 'dumbbell', why: 'Recruta as três porções do deltoide.' },
    ] as Variant[],
  },
  {
    id: 'e4',
    name: 'Elevação lateral',
    muscle: 'Ombro',
    scheme: '3 × 12-15',
    rest: 60,
    match: 82,
    gene: 'Volume alto p/ deltoide',
    tempo: '1 · 0 · 2',
    muscles: { primary: ['ombro'], secondary: [] },
    cues: [
      'Cotovelos levemente flexionados, "despeje a água"',
      'Suba até a linha dos ombros, sem usar impulso',
      'Desça controlando 2s — sinta o deltoide lateral',
    ],
    suggestedSets: [
      { prev: '12 kg × 14', w: 12, r: 14 },
      { prev: '12 kg × 13', w: 12, r: 13 },
      { prev: '10 kg × 15', w: 12, r: 12 },
    ] as SuggestedSet[],
    variants: [
      { id: 'e4', rec: true, name: 'Elevação lateral (halteres)', equip: 'Halteres', level: 'Iniciante', match: 82, motion: 'raise-lateral', implement: 'dumbbell', why: 'Volume alto trabalha bem seu deltoide.' },
      { id: 'e4b', name: 'Elevação lateral na polia', equip: 'Polia', level: 'Intermediário', match: 85, betterFit: true, motion: 'raise-lateral', implement: 'cable', why: 'Tensão constante na descida — fit maior que a barra.' },
      { id: 'e4c', name: 'Elevação lateral na máquina', equip: 'Máquina', level: 'Iniciante', match: 80, motion: 'raise-lateral', implement: 'machine', why: 'Isola sem estabilização; bom para iniciar.' },
    ] as Variant[],
  },
  {
    id: 'e5',
    name: 'Tríceps testa',
    muscle: 'Tríceps',
    scheme: '3 × 10-12',
    rest: 75,
    match: 86,
    tempo: '2 · 0 · 1',
    muscles: { primary: ['triceps'], secondary: [] },
    cues: [
      'Deitado, barra acima da testa, cotovelos fixos',
      'Desça flexionando só o cotovelo',
      'Estenda sem travar; mantenha os cotovelos apontando ao teto',
    ],
    suggestedSets: [
      { prev: '30 kg × 11', w: 30, r: 11 },
      { prev: '30 kg × 10', w: 30, r: 10 },
      { prev: '27.5 kg × 12', w: 30, r: 10 },
    ] as SuggestedSet[],
    variants: [
      { id: 'e5', rec: true, name: 'Tríceps testa (barra W)', equip: 'Barra W', level: 'Intermediário', match: 86, motion: 'ext-lying', implement: 'barbell', why: 'Boa sobrecarga na cabeça longa do tríceps.' },
      { id: 'e5b', name: 'Tríceps francês', equip: 'Halter', level: 'Intermediário', match: 84, betterFit: true, motion: 'ext-lying', implement: 'dumbbell', why: 'Menor estresse no cotovelo — atenção ao COL5A1.' },
      { id: 'e5c', name: 'Tríceps testa na polia', equip: 'Polia', level: 'Iniciante', match: 83, motion: 'ext-lying', implement: 'cable', why: 'Tensão constante e poupa a articulação.' },
    ] as Variant[],
  },
  {
    id: 'e6',
    name: 'Tríceps corda',
    muscle: 'Tríceps',
    scheme: '3 × 12-15',
    rest: 60,
    match: 84,
    tempo: '1 · 0 · 2',
    muscles: { primary: ['triceps'], secondary: [] },
    cues: [
      'Cotovelos colados ao tronco o tempo todo',
      'Estenda abrindo a corda no fim do movimento',
      'Suba controlando, sem deixar o ombro entrar',
    ],
    suggestedSets: [
      { prev: '25 kg × 14', w: 27.5, r: 13 },
      { prev: '25 kg × 13', w: 25, r: 14 },
      { prev: '22.5 kg × 15', w: 25, r: 13 },
    ] as SuggestedSet[],
    variants: [
      { id: 'e6', rec: true, name: 'Tríceps corda', equip: 'Polia', level: 'Iniciante', match: 84, motion: 'pushdown', implement: 'cable', why: 'Abertura no fim recruta bem o tríceps.' },
      { id: 'e6b', name: 'Tríceps barra reta', equip: 'Polia', level: 'Intermediário', match: 86, betterFit: true, motion: 'pushdown', implement: 'cable', why: 'Permite mais carga — fit ligeiramente maior.' },
      { id: 'e6d', name: 'Mergulho entre bancos', equip: 'Peso corporal', level: 'Intermediário', match: 78, motion: 'pushdown', implement: 'machine', why: 'Composto; some carga no colo para progredir.' },
    ] as Variant[],
  },
]

export const MOCK_SESSION: ActiveSession = {
  workoutId: 'push-a',
  workoutName: 'Push A',
  exercises: sessionExercises,
  sets: {},
  variantById: {},
  startedAt: Date.now(),
}

export const MOCK_PROGRESS: ProgressData = {
  volume: [
    { w: 'S1', v: 18.2 },
    { w: 'S2', v: 19.6 },
    { w: 'S3', v: 21.1 },
    { w: 'S4', v: 20.4 },
    { w: 'S5', v: 22.8 },
    { w: 'S6', v: 24.3 },
  ],
  records: [
    { lift: 'Supino reto', value: '62.5 kg', delta: '+2.5', when: 'esta semana', up: true },
    { lift: 'Agachamento', value: '110 kg', delta: '+5', when: 'há 1 semana', up: true },
    { lift: 'Levantamento terra', value: '140 kg', delta: '+0', when: 'há 2 semanas', up: false },
    { lift: 'Desenv. militar', value: '40 kg', delta: '+2.5', when: 'esta semana', up: true },
  ],
  stats: [
    { label: 'Treinos', value: '64', sub: 'total' },
    { label: 'Volume', value: '24.3t', sub: 'esta semana' },
    { label: 'Adesão', value: '92%', sub: '8 semanas' },
    { label: 'PRs', value: '11', sub: 'no bloco' },
  ],
  history: [
    { name: 'Pull A', date: 'Ontem', volume: '18.9t', sets: 18, dur: 47 },
    { name: 'Legs A', date: 'Seg', volume: '26.1t', sets: 21, dur: 56 },
    { name: 'Push B', date: 'Sáb', volume: '15.4t', sets: 18, dur: 50 },
  ],
}
