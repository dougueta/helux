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

  it('continua liberando GET, POST e DELETE', async () => {
    const res = await preflight('GET')
    const methods = String(res.headers['access-control-allow-methods'])
    for (const m of ['GET', 'POST', 'DELETE']) expect(methods).toMatch(new RegExp(`\\b${m}\\b`))
  })
})
