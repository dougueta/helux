import type { MockDataset } from '../types'
import { checkinsFixture } from './checkins.fixture'
import { geneticsFixture, NO_NUTRITION_GENETICS, nutritionGeneticsFixture } from './genetics.fixture'
import { nutritionFixture } from './nutrition.fixture'
import { profileFixture } from './profile.fixture'
import { recoveryFixture, tirednessFixture } from './tiredness.fixture'
import { analyticsFixture, EMPTY_ANALYTICS, latestPlanFixture, workoutHistoryFixture } from './workouts.fixture'

export interface TestPersona {
  id: string
  name: string
  description: string
  build: () => MockDataset
}

function standard(): MockDataset {
  const profile = profileFixture()
  const bodyCheckins = checkinsFixture()
  const workoutHistory = workoutHistoryFixture()
  const tirednessToday = tirednessFixture(null, 62)
  return {
    profile,
    latestPlan: latestPlanFixture(tirednessToday, 1),
    workoutHistory,
    workoutAnalytics: analyticsFixture(workoutHistory),
    tirednessToday,
    recovery: recoveryFixture(62, 7.5),
    bodyCheckins,
    genetics: geneticsFixture(),
    nutrition: nutritionFixture({ profile, weightKg: bodyCheckins[0].weight_kg!, genetics: nutritionGeneticsFixture() }),
  }
}

/** Personas canônicas (data-model §4 + R-H). Cada `build` devolve um dataset novo. */
export const PERSONAS: TestPersona[] = [
  {
    id: 'standard-athlete',
    name: 'Atleta padrão',
    description: 'Sessão B pendente hoje, 12 treinos no mês, cansaço normal, genética completa e fase de dieta ativa.',
    build: standard,
  },
  {
    id: 'rest-day-athlete',
    name: 'Dia de descanso',
    description: 'Mesociclo concluído sem treino hoje; a nutrição trata o dia como descanso.',
    build: () => {
      const d = standard()
      return {
        ...d,
        latestPlan: latestPlanFixture(d.tirednessToday, null),
        recovery: recoveryFixture(74, 8.5),
        nutrition: { ...d.nutrition, dayTypeOverride: 'descanso' },
      }
    },
  },
  {
    id: 'exhausted-athlete',
    name: 'Fadiga extrema',
    description: 'Cansaço exausto com HRV baixo: treino reduzido e card de recuperação na nutrição.',
    build: () => {
      const d = standard()
      const tirednessToday = tirednessFixture('exausto', 34)
      return { ...d, tirednessToday, latestPlan: latestPlanFixture(tirednessToday, 1), recovery: recoveryFixture(34, 5) }
    },
  },
  {
    id: 'zero-state',
    name: 'Novo usuário (zero-state)',
    description: 'Sem plano, histórico, check-ins, perfil, fase de dieta nem teste genético.',
    build: () => ({
      profile: null,
      latestPlan: null,
      workoutHistory: [],
      workoutAnalytics: EMPTY_ANALYTICS,
      tirednessToday: tirednessFixture(null, null),
      recovery: null,
      bodyCheckins: [],
      genetics: null,
      nutrition: { phase: null, calibrations: [], dayTypeOverride: null, swaps: [], history: [], genetics: NO_NUTRITION_GENETICS },
    }),
  },
  {
    id: 'network-error',
    name: 'Erro de comunicação',
    description: 'Toda leitura falha com HTTP 503, para ver os estados de erro e de nova tentativa.',
    build: () => ({ ...standard(), failReads: true }),
  },
]

/** Dataset inicial de uma persona; id desconhecido → atleta padrão. */
export function datasetForPersona(personaId: string): MockDataset {
  return (PERSONAS.find(p => p.id === personaId) ?? PERSONAS[0]).build()
}
