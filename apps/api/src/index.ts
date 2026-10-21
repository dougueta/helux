import { buildApp } from './app'
import { loadEnv } from './config/env'

// Spec 023 / FR-003: valida o ambiente antes de subir; em produção, variável
// ausente ou inválida encerra o processo com o nome de cada uma.
let env: ReturnType<typeof loadEnv>
try {
  env = loadEnv()
} catch (err) {
  console.error((err as Error).message)
  process.exit(1)
}

const app = buildApp(env)

app.listen({ port: env.PORT, host: env.HOST }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
