import type { ActiveSession, StorageAdapter } from './types'

const SESSION_KEY = 'helux:active-session'

export async function saveSession(session: ActiveSession, adapter: StorageAdapter): Promise<void> {
  await adapter.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function loadSession(adapter: StorageAdapter): Promise<ActiveSession | null> {
  const raw = await adapter.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ActiveSession
  } catch {
    return null
  }
}

export async function clearSession(adapter: StorageAdapter): Promise<void> {
  await adapter.removeItem(SESSION_KEY)
}
