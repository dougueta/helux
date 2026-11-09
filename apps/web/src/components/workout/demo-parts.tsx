/**
 * Partes do desenho da demonstração do catálogo (spec 028): cena, figura e implemento.
 * Mesmo visual de sempre — figura articulada, tokens do Design System, acento só no implemento.
 */
import { SceneGeometry as G, UNLOADED_GEAR, type Gear, type Point, type Pose, type ResolvedDemo, type Scene } from '@helux/exercises'

const mir = (p: Point): Point => [G.VIEWBOX.width - p[0], p[1]]
const BENCH_FILL = 'var(--surface-2)'
const LEG_STROKE = 'var(--surface-3)'

function Floor() {
  return <line x1={16} y1={G.FLOOR_Y} x2={204} y2={G.FLOOR_Y} stroke="var(--hairline)" strokeWidth="2" strokeLinecap="round" />
}

const post = (x: number, y1: number, y2: number, w = 5) => (
  <line x1={x} y1={y1} x2={x} y2={y2} stroke={LEG_STROKE} strokeWidth={w} strokeLinecap="round" />
)

export function DemoScene({ scene }: { scene: Scene }) {
  switch (scene) {
    case 'colchonete':
      return (
        <g data-scene={scene}>
          <Floor />
          <rect x={G.MAT.x0} y={G.MAT.top} width={G.MAT.x1 - G.MAT.x0} height={G.FLOOR_Y - G.MAT.top} rx={2} fill={BENCH_FILL} />
        </g>
      )
    case 'banco-reto':
      return (
        <g data-scene={scene}>
          <Floor />
          <rect x={G.FLAT_BENCH.x0} y={G.FLAT_BENCH.top} width={G.FLAT_BENCH.x1 - G.FLAT_BENCH.x0} height={12} rx={6} fill={BENCH_FILL} stroke="var(--hairline)" />
          {post(G.FLAT_BENCH.x0 + 18, G.FLAT_BENCH.top + 12, G.FLOOR_Y - 2)}
          {post(G.FLAT_BENCH.x1 - 18, G.FLAT_BENCH.top + 12, G.FLOOR_Y - 2)}
        </g>
      )
    case 'banco-inclinado': {
      const [low, high] = G.INCLINE_BENCH.back
      return (
        <g data-scene={scene}>
          <Floor />
          <line x1={low[0]} y1={low[1]} x2={high[0]} y2={high[1]} stroke={BENCH_FILL} strokeWidth="12" strokeLinecap="round" />
          <line x1={G.INCLINE_BENCH.seat.x0} y1={G.INCLINE_BENCH.seatTop + 4} x2={G.INCLINE_BENCH.seat.x1} y2={G.INCLINE_BENCH.seatTop + 4} stroke={BENCH_FILL} strokeWidth="10" strokeLinecap="round" />
          {post(110, G.INCLINE_BENCH.seatTop + 8, G.FLOOR_Y - 2)}
        </g>
      )
    }
    case 'banco-baixo':
      return (
        <g data-scene={scene}>
          <Floor />
          <rect x={G.LOW_BENCH.x0} y={G.LOW_BENCH.top} width={G.LOW_BENCH.x1 - G.LOW_BENCH.x0} height={12} rx={6} fill={BENCH_FILL} stroke="var(--hairline)" />
          {post(G.LOW_BENCH.x0 + 16, G.LOW_BENCH.top + 12, G.FLOOR_Y - 2)}
        </g>
      )
    case 'assento':
    case 'maquina':
      return (
        <g data-scene={scene}>
          <Floor />
          <rect x={G.SEAT.x0} y={G.SEAT.top} width={G.SEAT.x1 - G.SEAT.x0} height={12} rx={6} fill={BENCH_FILL} stroke="var(--hairline)" />
          {post(G.SEAT.backX, G.SEAT.backTop, G.SEAT.top, 6)}
          {post(104, G.SEAT.top + 12, G.FLOOR_Y - 2)}
          {scene === 'maquina' && post(G.MACHINE.x, G.MACHINE.top, G.FLOOR_Y - 2, 6)}
        </g>
      )
    case 'assento-reclinado':
      return (
        <g data-scene={scene}>
          <Floor />
          <line x1={G.RECLINED_SEAT.from[0]} y1={G.RECLINED_SEAT.from[1]} x2={G.RECLINED_SEAT.to[0]} y2={G.RECLINED_SEAT.to[1]} stroke={BENCH_FILL} strokeWidth="12" strokeLinecap="round" />
          {post(60, G.RECLINED_SEAT.to[1], G.FLOOR_Y - 2)}
        </g>
      )
    case 'barra-fixa':
      return (
        <g data-scene={scene}>
          <Floor />
          <line x1={G.PULL_UP_BAR.x0} y1={G.PULL_UP_BAR.y} x2={G.PULL_UP_BAR.x1} y2={G.PULL_UP_BAR.y} stroke="var(--text-faint)" strokeWidth="5" strokeLinecap="round" />
          {post(G.PULL_UP_BAR.x0, G.PULL_UP_BAR.y, G.FLOOR_Y - 2, 4)}
          {post(G.PULL_UP_BAR.x1, G.PULL_UP_BAR.y, G.FLOOR_Y - 2, 4)}
        </g>
      )
    case 'paralelas':
      return (
        <g data-scene={scene}>
          <Floor />
          <line x1={G.DIP_BARS.x0} y1={G.DIP_BARS.y} x2={G.DIP_BARS.x1} y2={G.DIP_BARS.y} stroke="var(--text-faint)" strokeWidth="5" strokeLinecap="round" />
          {post(G.DIP_BARS.x1 - 6, G.DIP_BARS.y, G.FLOOR_Y - 2, 4)}
        </g>
      )
    case 'parede':
      return (
        <g data-scene={scene}>
          <Floor />
          <line x1={G.WALL_X} y1={14} x2={G.WALL_X} y2={G.FLOOR_Y} stroke="var(--hairline)" strokeWidth="3" strokeLinecap="round" />
        </g>
      )
    case 'degrau':
      return (
        <g data-scene={scene}>
          <Floor />
          <rect x={G.STEP.x0} y={G.STEP.top} width={G.STEP.x1 - G.STEP.x0} height={G.FLOOR_Y - G.STEP.top} rx={3} fill={BENCH_FILL} stroke="var(--hairline)" />
        </g>
      )
    case 'banco-romano':
      return (
        <g data-scene={scene}>
          <Floor />
          <rect x={G.ROMAN_CHAIR.x0} y={G.ROMAN_CHAIR.top} width={G.ROMAN_CHAIR.x1 - G.ROMAN_CHAIR.x0} height={10} rx={5} fill={BENCH_FILL} stroke="var(--hairline)" />
          <circle cx={G.ROMAN_CHAIR.ankle[0]} cy={G.ROMAN_CHAIR.ankle[1]} r={5} fill={BENCH_FILL} />
          {post(G.ROMAN_CHAIR.x0 + 20, G.ROMAN_CHAIR.top + 10, G.FLOOR_Y - 2)}
          {post(G.ROMAN_CHAIR.x1 - 16, G.ROMAN_CHAIR.top + 10, G.FLOOR_Y - 2)}
        </g>
      )
    case 'banco-declinado': {
      const [low, high] = G.DECLINE_BENCH.back
      return (
        <g data-scene={scene}>
          <Floor />
          <line x1={low[0]} y1={low[1]} x2={high[0]} y2={high[1]} stroke={BENCH_FILL} strokeWidth="12" strokeLinecap="round" />
          <circle cx={G.DECLINE_BENCH.hook[0]} cy={G.DECLINE_BENCH.hook[1]} r={6} fill={BENCH_FILL} />
          {post(low[0] + 16, low[1] + 6, G.FLOOR_Y - 2)}
          {post(high[0] - 10, high[1] + 6, G.FLOOR_Y - 2)}
          {post(G.DECLINE_BENCH.hook[0], G.DECLINE_BENCH.hook[1] + 6, G.FLOOR_Y - 2, 3)}
        </g>
      )
    }
    case 'banco-scott': {
      const [top, low] = G.SCOTT_BENCH.pad
      return (
        <g data-scene={scene}>
          <Floor />
          <rect x={G.SCOTT_BENCH.seat.x0} y={G.SCOTT_BENCH.seat.top} width={G.SCOTT_BENCH.seat.x1 - G.SCOTT_BENCH.seat.x0} height={10} rx={5} fill={BENCH_FILL} stroke="var(--hairline)" />
          <line x1={top[0]} y1={top[1]} x2={low[0]} y2={low[1]} stroke={BENCH_FILL} strokeWidth="12" strokeLinecap="round" />
          {post(G.SCOTT_BENCH.seat.x0 + 22, G.SCOTT_BENCH.seat.top + 10, G.FLOOR_Y - 2)}
          {post(top[0] + 2, top[1] + 6, G.SCOTT_BENCH.seat.top)}
        </g>
      )
    }
    case 'solo':
    default:
      return (
        <g data-scene="solo">
          <Floor />
        </g>
      )
  }
}

/** Figura articulada. Membros do lado oposto em tom de corpo; `mirror` desenha o outro lado espelhado (vista frontal). */
export function DemoFigure({ pose, mirror }: { pose: Pose; mirror: boolean }) {
  const limb = { stroke: 'var(--text)', strokeWidth: 7, strokeLinecap: 'round' as const, fill: 'none' }
  const body = { stroke: 'var(--text-dim)', strokeWidth: 7, strokeLinecap: 'round' as const, fill: 'none' }
  const jointFill = 'var(--surface-3)'
  const seg = (a: Point, b: Point, key: string) => <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
  const f = (q: Point) => (mirror ? mir(q) : q)
  const cx = G.VIEWBOX.width / 2
  const midSh: Point = mirror ? [cx, pose.sh[1]] : pose.sh
  const midHip: Point = mirror ? [cx, pose.hip[1]] : pose.hip
  const marker = (joint: string, p: Point | undefined) =>
    p ? <circle key={joint} data-joint={joint} cx={p[0]} cy={p[1]} r={0} fill="none" /> : null

  return (
    <g data-part="figure">
      <g {...body}>
        {pose.kn2 && pose.an2 && pose.toe2 && [seg(pose.hip, pose.kn2, 'b1'), seg(pose.kn2, pose.an2, 'b2'), seg(pose.an2, pose.toe2, 'b3')]}
        {pose.el2 && pose.ha2 && [seg(pose.sh, pose.el2, 'b4'), seg(pose.el2, pose.ha2, 'b5')]}
        {mirror && seg(pose.sh, mir(pose.sh), 'b6')}
        {mirror && seg(pose.hip, mir(pose.hip), 'b7')}
        {seg(midSh, midHip, 'b8')}
      </g>
      <circle cx={pose.head[0]} cy={pose.head[1]} r={14} fill="none" stroke="var(--text-dim)" strokeWidth={7} />
      <g data-part="legs" {...limb}>
        {seg(pose.hip, pose.kn, 'l1')}
        {seg(pose.kn, pose.an, 'l2')}
        {seg(pose.an, pose.toe, 'l3')}
        {mirror && [seg(f(pose.hip), f(pose.kn), 'm1'), seg(f(pose.kn), f(pose.an), 'm2'), seg(f(pose.an), f(pose.toe), 'm3')]}
      </g>
      <g data-part="arms" {...limb}>
        {seg(pose.sh, pose.el, 'a1')}
        {seg(pose.el, pose.ha, 'a2')}
        {mirror && [seg(f(pose.sh), f(pose.el), 'm4'), seg(f(pose.el), f(pose.ha), 'm5')]}
      </g>
      <circle data-joint="kn" cx={pose.kn[0]} cy={pose.kn[1]} r="4.5" fill={jointFill} />
      <circle data-joint="el" cx={pose.el[0]} cy={pose.el[1]} r="4.5" fill={jointFill} />
      {pose.el2 && <circle data-joint="el2" cx={pose.el2[0]} cy={pose.el2[1]} r="4.5" fill={jointFill} />}
      {marker('hip', pose.hip)}
      {marker('sh', pose.sh)}
      {marker('ha', pose.ha)}
      {marker('ha2', pose.ha2)}
      {marker('an', pose.an)}
      {marker('an2', pose.an2)}
    </g>
  )
}

const ACC = 'var(--accent)'

function Single({ gear, at, anchor }: { gear: Gear; at: Point; anchor: Point }) {
  switch (gear) {
    case 'halteres':
      return (
        <g>
          <line x1={at[0] - 8} y1={at[1]} x2={at[0] + 8} y2={at[1]} stroke={ACC} strokeWidth="5" strokeLinecap="round" />
          <circle cx={at[0] - 8} cy={at[1]} r="3.4" fill={ACC} />
          <circle cx={at[0] + 8} cy={at[1]} r="3.4" fill={ACC} />
        </g>
      )
    case 'kettlebell':
      return (
        <g>
          <path d={`M ${at[0] - 5} ${at[1] + 2} Q ${at[0]} ${at[1] - 7} ${at[0] + 5} ${at[1] + 2}`} fill="none" stroke={ACC} strokeWidth="3" strokeLinecap="round" />
          <circle cx={at[0]} cy={at[1] + 10} r="8" fill={ACC} />
        </g>
      )
    case 'maquina':
      return <rect x={at[0] - 9} y={at[1] - 5} width={18} height={10} rx={4} fill={ACC} />
    case 'smith':
      return (
        <g>
          <line x1={at[0]} y1={14} x2={at[0]} y2={G.FLOOR_Y - 2} stroke="var(--text-faint)" strokeWidth="1.6" />
          <circle cx={at[0]} cy={at[1]} r="10" fill="none" stroke={ACC} strokeWidth="4" />
          <circle cx={at[0]} cy={at[1]} r="2.6" fill={ACC} />
        </g>
      )
    case 'cabo':
      return (
        <g>
          <line x1={anchor[0]} y1={anchor[1]} x2={at[0]} y2={at[1]} stroke="var(--text-faint)" strokeWidth="1.6" strokeDasharray="3 3" />
          <circle cx={at[0]} cy={at[1]} r="4.5" fill={ACC} />
        </g>
      )
    case 'corda': {
      const dx = at[0] - anchor[0]
      const dy = at[1] - anchor[1]
      const L = Math.hypot(dx, dy) || 1
      const back: Point = [at[0] - (dx / L) * 12, at[1] - (dy / L) * 12]
      const px = (-dy / L) * 5
      const py = (dx / L) * 5
      return (
        <g>
          <line x1={anchor[0]} y1={anchor[1]} x2={back[0]} y2={back[1]} stroke="var(--text-faint)" strokeWidth="1.6" strokeDasharray="3 3" />
          <line x1={back[0]} y1={back[1]} x2={at[0] + px} y2={at[1] + py} stroke={ACC} strokeWidth="3.5" strokeLinecap="round" />
          <line x1={back[0]} y1={back[1]} x2={at[0] - px} y2={at[1] - py} stroke={ACC} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )
    }
    case 'elastico':
      return <line x1={anchor[0]} y1={anchor[1]} x2={at[0]} y2={at[1]} stroke={ACC} strokeWidth="2.5" strokeLinecap="round" />
    case 'roda':
      return (
        <g>
          <circle cx={at[0]} cy={at[1] + 4} r="9" fill="none" stroke={ACC} strokeWidth="4" />
          <circle cx={at[0]} cy={at[1] + 4} r="2.4" fill={ACC} />
        </g>
      )
    case 'barra':
    default:
      // Barra de perfil: vê-se a anilha. Na vista espelhada, DemoImplement liga as duas mãos.
      return (
        <g>
          <circle cx={at[0]} cy={at[1]} r="10" fill="none" stroke={ACC} strokeWidth="4" />
          <circle cx={at[0]} cy={at[1]} r="2.6" fill={ACC} />
        </g>
      )
  }
}

/** Implemento real do item. Implementos sem carga (peso corporal, banco, barra fixa) não desenham nada. */
export function DemoImplement({ demo, pose }: { demo: ResolvedDemo; pose: Pose }) {
  if (UNLOADED_GEAR.includes(demo.gear)) return null
  const at = pose[demo.implementAt] ?? pose.ha
  const anchor = demo.anchor ?? G.DEFAULT_ANCHOR

  if (demo.mirror && demo.gear === 'barra') {
    const other = mir(at)
    return (
      <g>
        <line x1={other[0] - 12} y1={other[1]} x2={at[0] + 12} y2={at[1]} stroke={ACC} strokeWidth="6" strokeLinecap="round" />
        <circle cx={other[0] - 12} cy={other[1]} r="4" fill={ACC} />
        <circle cx={at[0] + 12} cy={at[1]} r="4" fill={ACC} />
      </g>
    )
  }

  // Landmine: uma ponta da barra fica presa no apoio (`anchor`) e a outra nas mãos.
  if (demo.gear === 'barra' && demo.anchor) {
    return (
      <g>
        <line data-landmine x1={demo.anchor[0]} y1={demo.anchor[1]} x2={at[0]} y2={at[1]} stroke={ACC} strokeWidth="4" strokeLinecap="round" />
        <Single gear="barra" at={at} anchor={anchor} />
      </g>
    )
  }

  // Segunda mão: lado espelhado (vista frontal) ou braço oposto desenhado.
  const second: Point | undefined = demo.mirror
    ? mir(at)
    : demo.implementAt === 'ha' && pose.ha2 && demo.gear !== 'roda' && demo.gear !== 'maquina'
      ? pose.ha2
      : undefined
  const secondAnchor = demo.mirror ? mir(anchor) : anchor
  return (
    <g>
      <Single gear={demo.gear} at={at} anchor={anchor} />
      {second && <Single gear={demo.gear} at={second} anchor={secondAnchor} />}
    </g>
  )
}

/** Trajetória do implemento (tom neutro), do primeiro ao último keyframe. */
export function DemoRange({ demo }: { demo: ResolvedDemo }) {
  const first = demo.keyframes[0].pose
  const last = demo.keyframes[demo.keyframes.length - 1].pose
  const a = first[demo.implementAt] ?? first.ha
  const b = last[demo.implementAt] ?? last.ha
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--hairline-3)" strokeWidth="2" strokeDasharray="2 5" />
}
