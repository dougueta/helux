import { z } from 'zod'

// Spec 023 / FR-003, FR-004: validação do ambiente na inicialização da API.
// Fora de produção é permissiva (testes e `pnpm dev`); em produção, variável
// ausente ou inválida derruba o processo listando cada nome.

const DEFAULT_CORS_ORIGIN = 'http://localhost:3000'

/** Variável vazia (`FOO=`) conta como ausente. */
const text = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional())

const baseSchema = z.object({
  NODE_ENV: z.preprocess((v) => (v === '' ? undefined : v), z.string().default('development')),
  PORT: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().int().positive().default(3001)),
  HOST: z.preprocess((v) => (v === '' ? undefined : v), z.string().default('0.0.0.0')),
  SUPABASE_URL: text,
  SUPABASE_ANON_KEY: text,
  ANTHROPIC_API_KEY: text,
  CORS_ORIGIN: text,
  PERSONAL_API_KEY: text,
  PERSONAL_USER_ID: text,
  SUPABASE_SERVICE_ROLE_KEY: text,
})

export type AppEnv = Omit<z.infer<typeof baseSchema>, 'CORS_ORIGIN'> & { CORS_ORIGIN: string }

const REQUIRED_IN_PRODUCTION = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ANTHROPIC_API_KEY', 'CORS_ORIGIN'] as const
const REQUIRED_WITH_PERSONAL_API_KEY = ['PERSONAL_USER_ID', 'SUPABASE_SERVICE_ROLE_KEY'] as const

function isUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function loadEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = baseSchema.safeParse(env)
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))]
    throw new Error(`Variáveis de ambiente inválidas: ${names.join(', ')}`)
  }

  const values = parsed.data

  if (values.NODE_ENV === 'production') {
    const invalid: string[] = []

    for (const name of REQUIRED_IN_PRODUCTION) {
      if (!values[name]) invalid.push(name)
    }
    if (values.SUPABASE_URL && !isUrl(values.SUPABASE_URL)) invalid.push('SUPABASE_URL')
    if (values.CORS_ORIGIN && (values.CORS_ORIGIN === '*' || !isUrl(values.CORS_ORIGIN))) {
      invalid.push('CORS_ORIGIN')
    }

    if (values.PERSONAL_API_KEY) {
      for (const name of REQUIRED_WITH_PERSONAL_API_KEY) {
        if (!values[name]) invalid.push(name)
      }
    }

    if (invalid.length > 0) {
      throw new Error(`Variáveis de ambiente inválidas: ${[...new Set(invalid)].join(', ')}`)
    }
  }

  return { ...values, CORS_ORIGIN: values.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN }
}
