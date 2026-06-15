import { describe, it, expect } from 'vitest';
import { processSync, HealthSyncPayloadSchema } from './index';

describe('index exports', () => {
  it('exports processSync', () => {
    expect(typeof processSync).toBe('function');
  });

  it('exports HealthSyncPayloadSchema', () => {
    expect(HealthSyncPayloadSchema).toBeDefined();
  });
});
