import { describe, it, expect } from 'vitest'
import { MOTION_CATALOG, GENERIC_MOTION, type MotionKey } from '../motion'

const EXPECTED_KEYS: MotionKey[] = [
  'press-flat', 'press-incline', 'push-up', 'press-overhead',
  'squat', 'lunge', 'leg-press', 'hinge', 'hip-thrust',
  'row', 'upright-row', 'pull-vertical',
  'plank', 'crunch', 'leg-raise', 'rollout', 'cable-rotation',
  'curl', 'pushdown', 'ext-lying', 'ext-overhead', 'dip', 'fly',
  'raise-lateral', 'raise-front', 'shrug', 'leg-ext', 'hip-abduction', 'leg-curl', 'calf-raise',
]

describe('MOTION_CATALOG (spec 013)', () => {
  it('tem as 30 animações do contrato', () => {
    expect(Object.keys(MOTION_CATALOG).sort()).toEqual([...EXPECTED_KEYS].sort())
  })

  it('a animação genérica (último recurso) é o supino reto', () => {
    expect(GENERIC_MOTION).toBe('press-flat')
    expect(MOTION_CATALOG[GENERIC_MOTION].patterns).toEqual(['empurrar-horizontal'])
  })

  it('toda animação declara ao menos um padrão; isolamentos declaram os grupos musculares', () => {
    for (const [key, entry] of Object.entries(MOTION_CATALOG)) {
      expect(entry.patterns.length, key).toBeGreaterThan(0)
      if (entry.patterns.includes('isolamento')) {
        expect(entry.muscleGroups?.length ?? 0, key).toBeGreaterThan(0)
      }
    }
  })
})
