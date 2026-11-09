/** Tipos do motor de demonstração (R5, R6). Puro: sem React e sem relógio. */
import type { Gear } from '../types'

/** Coordenada no viewBox 220 × 250. */
export type Point = [number, number]

export interface Pose {
  head: Point
  sh: Point
  el: Point
  ha: Point
  hip: Point
  kn: Point
  an: Point
  toe: Point
  /** braço oposto */
  el2?: Point
  ha2?: Point
  /** perna oposta */
  kn2?: Point
  an2?: Point
  toe2?: Point
}

export type Joint = keyof Pose

export type LoopMode = 'reps' | 'hold' | 'alternate' | 'cycle'

/** `toe`: ponta do pé apoiada (elevação de panturrilha); o tornozelo sobe. */
export type Root = 'foot' | 'hand' | 'hip' | 'seat' | 'toe'

export interface Keyframe {
  /** de 0 a 1, crescente */
  at: number
  pose: Pose
}

export interface MovementBase {
  key: string
  view: 'side' | 'front'
  mirror?: boolean
  loop: LoopMode
  durationMs: number
  /** apoio fixo da cadeia */
  root: Root
  /** pontos que não podem se mover (deslocamento máximo de 1 unidade) */
  fixed: Joint[]
  keyframes: Keyframe[]
}

export type Scene =
  | 'solo'
  | 'banco-reto'
  | 'banco-inclinado'
  | 'banco-baixo'
  | 'assento'
  | 'assento-reclinado'
  | 'maquina'
  | 'barra-fixa'
  | 'paralelas'
  | 'parede'
  | 'degrau'
  | 'colchonete'
  | 'banco-romano'
  | 'banco-declinado'
  | 'banco-scott'

export interface DemoSpec {
  /** MovementBase.key */
  base: string
  gear: Gear
  scene: Scene
  implementAt: Joint
  /** ajustes por keyframe, aplicados sobre a base */
  poseOverrides?: Partial<Pose>[]
  /** origem do cabo ou do elástico */
  anchor?: Point
  /** obrigatória quando o item compartilha a base e a diferença não é visível */
  caption?: string
}

/** Demonstração pronta para desenhar: base resolvida e ajustes aplicados. */
export interface ResolvedDemo {
  id: string
  view: 'side' | 'front'
  mirror: boolean
  loop: LoopMode
  durationMs: number
  root: Root
  fixed: Joint[]
  keyframes: Keyframe[]
  gear: Gear
  scene: Scene
  implementAt: Joint
  anchor?: Point
  caption?: string
}
