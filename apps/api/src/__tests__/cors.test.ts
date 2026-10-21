import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../app'

// Spec 011 / FR-016: o navegador faz preflight antes do PUT /api/tiredness-today.
describe('CORS', () => {
  const app = buildApp()

  afterAll(async () => {
    await app.close()
  })

  async function preflight(method: string) {
    return app.inject({
      method: 'OPTIONS',
      url: '/api/tiredness-today',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': method,
      },
    })
  }

  it('libera PUT no preflight de /api/tiredness-today', async () => {
    const res = await preflight('PUT')
    expect(res.statusCode).toBeLessThan(300)
    expect(String(res.headers['access-control-allow-methods'])).toMatch(/\bPUT\b/)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000')
  })

  it('libera PATCH (spec 022: edição manual de sessão e relatos)', async () => {
    const res = await preflight('PATCH')
    expect(String(res.headers['access-control-allow-methods']).split(', ')).toContain('PATCH')
  })

  it('continua liberando GET, POST e DELETE', async () => {
    const res = await preflight('GET')
    const methods = String(res.headers['access-control-allow-methods'])
    for (const m of ['GET', 'POST', 'DELETE']) expect(methods).toMatch(new RegExp(`\\b${m}\\b`))
  })
})

// Spec 023 / FR-004: em produção só a origem configurada em CORS_ORIGIN é liberada.
describe('CORS em produção', () => {
  const allowed = 'https://helux.vercel.app'
  const app = buildApp({ CORS_ORIGIN: allowed })

  afterAll(async () => {
    await app.close()
  })

  function request(origin: string) {
    return app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin },
    })
  }

  it('libera a origem igual a CORS_ORIGIN', async () => {
    const res = await request(allowed)
    expect(res.statusCode).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe(allowed)
  })

  // Com `origin` fixo, o plugin devolve sempre CORS_ORIGIN; o navegador bloqueia
  // qualquer origem diferente porque o cabeçalho não coincide com a dela.
  it('nunca ecoa uma origem diferente de CORS_ORIGIN', async () => {
    const res = await request('https://outro-site.example')
    expect(res.headers['access-control-allow-origin']).toBe(allowed)
    expect(res.headers['access-control-allow-origin']).not.toBe('https://outro-site.example')
  })

  it('não libera a origem de desenvolvimento em produção', async () => {
    const res = await request('http://localhost:3000')
    expect(res.headers['access-control-allow-origin']).toBe(allowed)
    expect(res.headers['access-control-allow-origin']).not.toBe('http://localhost:3000')
  })
})
