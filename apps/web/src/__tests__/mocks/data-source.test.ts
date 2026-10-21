import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  resolveDataSource,
  getDataSource,
  setDataSource,
  getPersonaId,
  setPersonaId,
  isMockActive,
  shouldBypassAuth,
  DATA_SOURCE_COOKIE,
  PERSONA_COOKIE,
} from '@/lib/data-source'

function clearCookies() {
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim()
    if (name) document.cookie = `${name}=; path=/; max-age=0`
  }
}

describe('resolveDataSource (R-A)', () => {
  it('produção é sempre real', () => {
    expect(resolveDataSource({ nodeEnv: 'production', cookie: 'mock', envDefault: 'mock' })).toBe('real')
  })
  it('cookie > env > real', () => {
    expect(resolveDataSource({ nodeEnv: 'development', cookie: 'real', envDefault: 'mock' })).toBe('real')
    expect(resolveDataSource({ nodeEnv: 'development', cookie: 'mock', envDefault: 'real' })).toBe('mock')
    expect(resolveDataSource({ nodeEnv: 'development', cookie: undefined, envDefault: 'mock' })).toBe('mock')
    expect(resolveDataSource({ nodeEnv: 'development', cookie: undefined, envDefault: undefined })).toBe('real')
  })
  it('valores inválidos são ignorados', () => {
    expect(resolveDataSource({ nodeEnv: 'test', cookie: 'xpto', envDefault: 'mock' })).toBe('mock')
    expect(resolveDataSource({ nodeEnv: 'test', cookie: 'xpto', envDefault: 'abc' })).toBe('real')
  })
})

describe('modo no navegador', () => {
  beforeEach(() => {
    clearCookies()
    vi.unstubAllEnvs()
  })

  it('setDataSource grava o cookie, dispara o evento e getDataSource lê', () => {
    const listener = vi.fn()
    window.addEventListener('helux:data-source-change', listener)
    setDataSource('mock')
    expect(document.cookie).toContain(`${DATA_SOURCE_COOKIE}=mock`)
    expect(getDataSource()).toBe('mock')
    expect(isMockActive()).toBe(true)
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ mode: 'mock' })
    setDataSource('real')
    expect(isMockActive()).toBe(false)
    window.removeEventListener('helux:data-source-change', listener)
  })

  it('sem cookie usa NEXT_PUBLIC_DATA_SOURCE', () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_SOURCE', 'mock')
    expect(getDataSource()).toBe('mock')
  })

  it('persona: padrão standard-athlete; setPersonaId grava o cookie', () => {
    expect(getPersonaId()).toBe('standard-athlete')
    setPersonaId('zero-state')
    expect(document.cookie).toContain(`${PERSONA_COOKIE}=zero-state`)
    expect(getPersonaId()).toBe('zero-state')
  })
})

describe('shouldBypassAuth (middleware, T007)', () => {
  const req = (cookie?: string) => ({ cookies: { get: (n: string) => (n === DATA_SOURCE_COOKIE && cookie ? { value: cookie } : undefined) } })

  beforeEach(() => vi.unstubAllEnvs())

  it('mock pelo cookie → pula a autenticação', () => {
    expect(shouldBypassAuth(req('mock'))).toBe(true)
  })
  it('real ou sem cookie e sem env → exige autenticação', () => {
    expect(shouldBypassAuth(req('real'))).toBe(false)
    expect(shouldBypassAuth(req())).toBe(false)
  })
  it('env mock sem cookie → pula', () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_SOURCE', 'mock')
    expect(shouldBypassAuth(req())).toBe(true)
  })
  it('em produção nunca pula', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(shouldBypassAuth(req('mock'))).toBe(false)
  })
})
