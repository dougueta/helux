import { MockHealthKitAdapter, NativeHealthKitAdapter } from './healthkit.adapter'
import type { IHealthKitAdapter } from './healthkit.adapter'

// Platform is not available in Node test env. Guard with typeof.
const isNativeIOS =
  typeof navigator !== 'undefined' &&
  typeof __DEV__ !== 'undefined' &&
  !__DEV__

export const healthKit: IHealthKitAdapter = isNativeIOS
  ? new NativeHealthKitAdapter()
  : new MockHealthKitAdapter()
