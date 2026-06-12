import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../app'

describe('GET /health', () => {
  const app = buildApp()

  afterAll(async () => {
    await app.close()
  })

  it('retorna status 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })
    expect(response.statusCode).toBe(200)
  })

  it('retorna body com status ok e timestamp', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })
    const body = JSON.parse(response.body) as { status: string; timestamp: string }
    expect(body.status).toBe('ok')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('retorna 404 para rotas inexistentes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/rota-que-nao-existe',
    })
    expect(response.statusCode).toBe(404)
  })
})
