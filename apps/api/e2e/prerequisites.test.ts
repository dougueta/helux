import { describe, it, expect } from 'vitest'
import { parseStatusEnv, assertLocalUrl, resolveAiMode } from './prerequisites'

describe('parseStatusEnv', () => {
  it('extrai as credenciais da saída KEY="valor" de `supabase status -o env`', () => {
    const output = [
      'Stopped services: [supabase_studio_helux]',
      'API_URL="http://127.0.0.1:54321"',
      'ANON_KEY="anon.jwt"',
      'SERVICE_ROLE_KEY="service.jwt"',
      'DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"',
    ].join('\n')

    expect(parseStatusEnv(output)).toEqual({
      apiUrl: 'http://127.0.0.1:54321',
      anonKey: 'anon.jwt',
      serviceRoleKey: 'service.jwt',
    })
  })

  it('retorna null quando faltam credenciais (Supabase fora do ar)', () => {
    expect(parseStatusEnv('failed to inspect container health')).toBeNull()
  })
})

describe('assertLocalUrl', () => {
  it.each(['http://127.0.0.1:54321', 'http://localhost:54321'])('aceita %s', (url) => {
    expect(() => assertLocalUrl(url)).not.toThrow()
  })

  it('rejeita um projeto remoto', () => {
    expect(() => assertLocalUrl('https://abc.supabase.co')).toThrow('[e2e] SUPABASE_URL não é local')
  })
})

describe('resolveAiMode', () => {
  it('usa a IA simulada por padrão, mesmo com chave real presente', () => {
    expect(resolveAiMode({ ANTHROPIC_API_KEY: 'sk-real' })).toBe('fake')
  })

  it('usa a IA real com E2E_REAL_AI=1 e chave', () => {
    expect(resolveAiMode({ E2E_REAL_AI: '1', ANTHROPIC_API_KEY: 'sk-real' })).toBe('real')
  })

  it('falha cedo com E2E_REAL_AI=1 sem chave', () => {
    expect(() => resolveAiMode({ E2E_REAL_AI: '1' })).toThrow('[e2e] E2E_REAL_AI=1 exige ANTHROPIC_API_KEY')
  })
})
