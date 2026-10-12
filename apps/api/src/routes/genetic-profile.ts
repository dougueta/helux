import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import { parseGeneraJson, parseGeneraTraits } from '@helux/genetics'
import type { GeneticProfileView } from '@helux/types'

const GENERA_PATH = path.resolve(process.cwd(), 'data', 'genetics', 'genera.json')

export async function geneticProfileRoutes(app: FastifyInstance): Promise<void> {
  app.get('/genetic-profile', async (_request, reply) => {
    if (!existsSync(GENERA_PATH)) {
      return reply.status(404).send({
        error: 'Perfil genético não encontrado. Adicione genera.json em data/genetics/',
      })
    }
    const raw: unknown = JSON.parse(readFileSync(GENERA_PATH, 'utf-8'))
    // Spec 020: o resumo segue igual; os marcadores de treino vão junto para a tela DNA.
    const profile: GeneticProfileView = { ...parseGeneraJson(raw), traits: parseGeneraTraits(raw) }
    return profile
  })
}
