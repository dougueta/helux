import { MockHealthKitAdapter } from './healthkit.adapter'
import type { IHealthKitAdapter } from './healthkit.adapter'

// NativeHealthKitAdapter is a stub — use MockAdapter until
// react-native-health native bindings are wired.
export const healthKit: IHealthKitAdapter = new MockHealthKitAdapter()
