import { describe, it, expect } from 'vitest';
import { health } from './index';

describe('health', () => {
  it('should return ok', () => {
    expect(health).toBe('ok');
  });
});
