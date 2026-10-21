import type { UserTrainingProfile } from '@helux/types'
import { isoDaysAgo } from './clock'

export function profileFixture(): UserTrainingProfile {
  return {
    goal: 'hipertrofia',
    level: 'intermediario',
    trainingTime: '3 anos',
    timeOff: 'nenhum',
    currentInjury: null,
    heightCm: 180,
    birthDate: '1991-01-10',
    sex: 'masculino',
    updatedAt: isoDaysAgo(40),
  }
}
