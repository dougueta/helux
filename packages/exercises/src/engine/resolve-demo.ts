import type { DemoSpec, MovementBase, Pose, ResolvedDemo } from './types'

/** Aplica a base e os ajustes por keyframe de uma demonstração. Sem a base, retorna null. */
export function resolveDemoSpec(id: string, spec: DemoSpec, bases: Record<string, MovementBase>): ResolvedDemo | null {
  const base = bases[spec.base]
  if (!base) return null
  const keyframes = base.keyframes.map((kf, i) => {
    const override = spec.poseOverrides?.[i]
    return { at: kf.at, pose: override ? ({ ...kf.pose, ...override } as Pose) : kf.pose }
  })
  return {
    id,
    view: base.view,
    mirror: base.mirror ?? false,
    loop: base.loop,
    durationMs: base.durationMs,
    root: base.root,
    fixed: base.fixed,
    keyframes,
    gear: spec.gear,
    scene: spec.scene,
    implementAt: spec.implementAt,
    ...(spec.anchor ? { anchor: spec.anchor } : {}),
    ...(spec.caption ? { caption: spec.caption } : {}),
  }
}
