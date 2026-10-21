import { describe, it, expect } from 'vitest'
import { loadEnv } from '../config/env'

// Spec 023 / FR-003, FR-004: a API valida o ambiente na inicialização.
// Em produção, variável ausente ou inválida derruba o processo listando cada nome.

const PRODUCTION_OK = {
  NODE_ENV: 'production',
  SUPABASE_URL: 'https://abc.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  ANTHROPIC_API_KEY: 'sk-ant-test',
  CORS_ORIGIN: 'https://helux.vercel.app',
}

describe('loadEnv', () => {
  it('em produção sem variáveis, lança erro listando cada nome ausente', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrowError(
      /SUPABASE_URL.*SUPABASE_ANON_KEY.*ANTHROPIC_API_KEY.*CORS_ORIGIN/s,
    )
  })

  it('a mensagem de erro cita apenas as variáveis com problema', () => {
    const { SUPABASE_URL: _omit, ...rest } = PRODUCTION_OK
    try {
      loadEnv(rest)
      expect.unreachable('deveria ter lançado')
    } catch (err) {
      const message = (err as Error).message
      expect(message).toContain('SUPABASE_URL')
      expect(message).not.toContain('SUPABASE_ANON_KEY')
      expect(message).not.toContain('CORS_ORIGIN')
    }
  })

  it('em produção completa, retorna o objeto com padrões de PORT e HOST', () => {
    const env = loadEnv(PRODUCTION_OK)
    expect(env.NODE_ENV).toBe('production')
    expect(env.SUPABASE_URL).toBe('https://abc.supabase.co')
    expect(env.CORS_ORIGIN).toBe('https://helux.vercel.app')
    expect(env.PORT).toBe(3001)
    expect(env.HOST).toBe('0.0.0.0')
  })

  it('converte PORT para número', () => {
    expect(loadEnv({ ...PRODUCTION_OK, PORT: '8080' }).PORT).toBe(8080)
  })

  it('em produção, rejeita CORS_ORIGIN="*"', () => {
    expect(() => loadEnv({ ...PRODUCTION_OK, CORS_ORIGIN: '*' })).toThrowError(/CORS_ORIGIN/)
  })

  it('em produção, rejeita SUPABASE_URL que não seja URL', () => {
    expect(() => loadEnv({ ...PRODUCTION_OK, SUPABASE_URL: 'nao-e-url' })).toThrowError(/SUPABASE_URL/)
  })

  it('em produção, PERSONAL_API_KEY exige PERSONAL_USER_ID e SUPABASE_SERVICE_ROLE_KEY', () => {
    expect(() => loadEnv({ ...PRODUCTION_OK, PERSONAL_API_KEY: 'chave' })).toThrowError(
      /PERSONAL_USER_ID.*SUPABASE_SERVICE_ROLE_KEY/s,
    )
  })

  it('em produção, aceita o caminho X-API-Key quando as três variáveis estão presentes', () => {
    const env = loadEnv({
      ...PRODUCTION_OK,
      PERSONAL_API_KEY: 'chave',
      PERSONAL_USER_ID: 'user-1',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    })
    expect(env.PERSONAL_API_KEY).toBe('chave')
    expect(env.PERSONAL_USER_ID).toBe('user-1')
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('service-role')
  })

  it('fora de produção, sem variáveis, não lança e usa CORS_ORIGIN padrão', () => {
    const env = loadEnv({})
    expect(env.NODE_ENV).toBe('development')
    expect(env.CORS_ORIGIN).toBe('http://localhost:3000')
  })

  it('em test, sem variáveis, não lança', () => {
    expect(() => loadEnv({ NODE_ENV: 'test' })).not.toThrow()
  })

  it('fora de produção, respeita CORS_ORIGIN informado', () => {
    expect(loadEnv({ CORS_ORIGIN: 'http://localhost:4000' }).CORS_ORIGIN).toBe('http://localhost:4000')
  })
})
