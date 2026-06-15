import type { HealthSyncPayload } from '@helux/health'
import type { RecoveryData } from '@helux/types'

export interface IHealthKitAdapter {
  requestPermissions(): Promise<void>
  readSamples(from: Date, to: Date): Promise<HealthSyncPayload>
  readRecovery(from: Date, to: Date): Promise<RecoveryData>
}

export class MockHealthKitAdapter implements IHealthKitAdapter {
  async requestPermissions(): Promise<void> {}

  async readSamples(from: Date, to: Date): Promise<HealthSyncPayload> {
    const startDate = from.toISOString()
    const endDate = to.toISOString()
    return {
      heartRate: [
        { uuid: '00000000-0000-4000-8000-000000000001', value: 62, unit: 'bpm', startDate, endDate },
        { uuid: '00000000-0000-4000-8000-000000000002', value: 58, unit: 'bpm', startDate, endDate },
        { uuid: '00000000-0000-4000-8000-000000000003', value: 71, unit: 'bpm', startDate, endDate },
      ],
      steps: [
        { uuid: '00000000-0000-4000-8000-000000000004', value: 3240, unit: 'count', startDate, endDate },
      ],
      hrv: [
        { uuid: '00000000-0000-4000-8000-000000000005', value: 52, unit: 'ms', startDate, endDate },
        { uuid: '00000000-0000-4000-8000-000000000006', value: 48, unit: 'ms', startDate, endDate },
      ],
    }
  }

  async readRecovery(from: Date, to: Date): Promise<RecoveryData> {
    return {
      date: from.toISOString().split('T')[0],
      hrv: 52,
      restingHR: 58,
      activeCalories: 420,
      source: 'healthkit',
    }
  }
}

// NativeHealthKitAdapter is a stub — same data as Mock.
// Replace with react-native-health when building natively.
export class NativeHealthKitAdapter extends MockHealthKitAdapter {}
