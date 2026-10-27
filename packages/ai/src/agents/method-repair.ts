import type { HardConstraints, MesocycleSession, MethodPrescription, PlannedExercise } from '@helux/types'
import { estimateSessionMinutes, findBankExercise } from './constraints'
import { isStrength, MAIN_MUSCLE_GROUPS } from './method-validation'

// Spec 024 (R17, B): contas que a IA erra com facilidade (séries por grupo e
// minutos por sessão) são corrigidas por código depois da geração e antes da
// validação. Frequência, estrutura, cardio e mobilidade continuam com a IA.

const MIN_SETS = 2
const MAX_SETS = 5

type Slot = { session: MesocycleSession; exercise: PlannedExercise; group: string }

const isStrengthSession = (s: MesocycleSession) => (s.kind ?? 'forca') === 'forca'
const groupOf = (e: PlannedExercise) => findBankExercise(e.name)?.muscleGroup ?? null

/** Exercícios de força dos dias de força, com o grupo de cada um. */
function slots(sessions: MesocycleSession[]): Slot[] {
  return sessions.filter(isStrengthSession).flatMap(session =>
    session.exercises.filter(isStrength).flatMap(exercise => {
      const group = groupOf(exercise)
      return group ? [{ session, exercise, group }] : []
    }),
  )
}

function weeklySets(all: Slot[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of all) out[s.group] = (out[s.group] ?? 0) + s.exercise.sets
  return out
}

const fits = (session: MesocycleSession, c: HardConstraints) => c.maxSessionMinutes === null || estimateSessionMinutes(session) <= c.maxSessionMinutes

/** Ajusta séries por grupo e duração da semana-modelo ao método e ao tempo; não muda exercícios nem dias. */
export function fitPlanToMethod(template: MesocycleSession[], method: MethodPrescription, c: HardConstraints): MesocycleSession[] {
  const sessions = template.map(s => ({ ...s, exercises: s.exercises.map(e => ({ ...e })) }))
  const counted = MAIN_MUSCLE_GROUPS.filter(g => !method.exemptGroups?.includes(g)) as readonly string[]
  const { min, max } = method.weeklySetsPerGroup

  // 1. Duração: corta primeiro dos grupos acessórios, depois dos grupos acima do mínimo do método.
  for (const session of sessions.filter(isStrengthSession)) {
    while (!fits(session, c)) {
      const sets = weeklySets(slots(sessions))
      const own = slots([session]).filter(s => s.exercise.sets > MIN_SETS)
      const pick =
        own.filter(s => !counted.includes(s.group)).sort((a, b) => b.exercise.sets - a.exercise.sets)[0] ??
        own.filter(s => (sets[s.group] ?? 0) > min).sort((a, b) => b.exercise.sets - a.exercise.sets)[0]
      if (!pick) break
      pick.exercise.sets -= 1
    }
  }

  // 2. Volume por grupo: uma série por vez, só nos grupos que já têm exercício.
  for (const group of counted) {
    for (;;) {
      const all = slots(sessions).filter(s => s.group === group)
      const total = all.reduce((n, s) => n + s.exercise.sets, 0)
      if (all.length === 0 || (total >= min && total <= max)) break
      if (total > max) {
        const pick = all.filter(s => s.exercise.sets > MIN_SETS).sort((a, b) => b.exercise.sets - a.exercise.sets)[0]
        if (!pick) break
        pick.exercise.sets -= 1
      } else {
        const pick = all
          .filter(s => s.exercise.sets < MAX_SETS)
          .sort((a, b) => a.exercise.sets - b.exercise.sets)
          .find(s => {
            s.exercise.sets += 1
            const ok = fits(s.session, c)
            s.exercise.sets -= 1
            return ok
          })
        if (!pick) break
        pick.exercise.sets += 1
      }
    }
  }
  return sessions
}
