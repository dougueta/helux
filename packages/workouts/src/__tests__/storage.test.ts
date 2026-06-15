import { describe, it, expect, beforeEach } from 'vitest'
import { saveSession, loadSession, clearSession } from '../storage'
import type { ActiveSession, StorageAdapter } from '../types'

// Mock StorageAdapter em memória
class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, string> = new Map()

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value)
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key)
  }
}

// Fixture mínima para ActiveSession
const mockSession: ActiveSession = {
  workoutId: 'push-a',
  workoutName: 'Push A',
  exercises: [],
  sets: {},
  variantById: {},
  startedAt: 1000000,
}

describe('saveSession', () => {
  let adapter: StorageAdapter

  beforeEach(() => {
    adapter = new MemoryStorageAdapter()
  })

  it('persists the session as JSON under the key "helux:active-session"', async () => {
    await saveSession(mockSession, adapter)
    const raw = await adapter.getItem('helux:active-session')
    expect(raw).toBeDefined()
    expect(typeof raw).toBe('string')
    const parsed = JSON.parse(raw!)
    expect(parsed.workoutId).toBe('push-a')
    expect(parsed.workoutName).toBe('Push A')
  })

  it('overwrites a previous session with the new session', async () => {
    const session1: ActiveSession = { ...mockSession, workoutId: 'session-1' }
    const session2: ActiveSession = { ...mockSession, workoutId: 'session-2' }

    await saveSession(session1, adapter)
    const raw1 = await adapter.getItem('helux:active-session')
    expect(JSON.parse(raw1!).workoutId).toBe('session-1')

    await saveSession(session2, adapter)
    const raw2 = await adapter.getItem('helux:active-session')
    expect(JSON.parse(raw2!).workoutId).toBe('session-2')
  })
})

describe('loadSession', () => {
  let adapter: StorageAdapter

  beforeEach(() => {
    adapter = new MemoryStorageAdapter()
  })

  it('returns null when no session is saved', async () => {
    const result = await loadSession(adapter)
    expect(result).toBeNull()
  })

  it('returns the deserialized ActiveSession when it exists', async () => {
    const session: ActiveSession = {
      ...mockSession,
      workoutId: 'test-workout',
      workoutName: 'Test Workout',
      startedAt: 1234567,
    }

    await saveSession(session, adapter)
    const loaded = await loadSession(adapter)

    expect(loaded).not.toBeNull()
    expect(loaded!.workoutId).toBe('test-workout')
    expect(loaded!.workoutName).toBe('Test Workout')
    expect(loaded!.startedAt).toBe(1234567)
  })

  it('returns null if the JSON is invalid (corrupted)', async () => {
    // Simulate corrupted JSON by directly setting invalid data
    await adapter.setItem('helux:active-session', '{invalid json}')
    const result = await loadSession(adapter)
    expect(result).toBeNull()
  })
})

describe('clearSession', () => {
  let adapter: StorageAdapter

  beforeEach(() => {
    adapter = new MemoryStorageAdapter()
  })

  it('removes the session from the adapter storage', async () => {
    await saveSession(mockSession, adapter)
    await clearSession(adapter)
    const raw = await adapter.getItem('helux:active-session')
    expect(raw).toBeNull()
  })

  it('does not affect other keys in storage', async () => {
    // Save a session and another unrelated key
    await saveSession(mockSession, adapter)
    await adapter.setItem('other-key', 'other-value')

    // Clear only the active session
    await clearSession(adapter)

    // Verify the session key is gone
    expect(await adapter.getItem('helux:active-session')).toBeNull()

    // Verify the other key is still there
    expect(await adapter.getItem('other-key')).toBe('other-value')
  })
})
