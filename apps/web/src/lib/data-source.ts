/**
 * Fonte de dados do app (spec 021, R-A): `mock` (fixtures locais) ou `real`
 * (Supabase + API). O override da Dev Bar fica em cookie para que o
 * middleware, as páginas de servidor e o cliente leiam o mesmo valor.
 * Em produção é sempre `real`.
 */
export type DataSourceMode = 'mock' | 'real'

export const DATA_SOURCE_COOKIE = 'helux-data-source'
export const PERSONA_COOKIE = 'helux-mock-persona'
export const DEFAULT_PERSONA_ID = 'standard-athlete'

const ONE_YEAR_S = 60 * 60 * 24 * 365

const asMode = (v: string | undefined | null): DataSourceMode | undefined => (v === 'mock' || v === 'real' ? v : undefined)

/** Precedência: produção → `real`; cookie; variável de ambiente; `real`. */
export function resolveDataSource({
  nodeEnv,
  cookie,
  envDefault,
}: {
  nodeEnv: string | undefined
  cookie: string | undefined
  envDefault: string | undefined
}): DataSourceMode {
  if (nodeEnv === 'production') return 'real'
  return asMode(cookie) ?? asMode(envDefault) ?? 'real'
}

/** Valor de um cookie em `document.cookie` (cliente). */
function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const hit = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`))
  return hit ? decodeURIComponent(hit.trim().slice(name.length + 1)) : undefined
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_S}; samesite=lax`
}

/** Modo efetivo no cliente. */
export function getDataSource(): DataSourceMode {
  return resolveDataSource({
    nodeEnv: process.env.NODE_ENV,
    cookie: readCookie(DATA_SOURCE_COOKIE),
    envDefault: process.env.NEXT_PUBLIC_DATA_SOURCE,
  })
}

export function isMockActive(): boolean {
  return getDataSource() === 'mock'
}

/** Override da Dev Bar: grava o cookie e avisa quem estiver ouvindo. */
export function setDataSource(mode: DataSourceMode): void {
  writeCookie(DATA_SOURCE_COOKIE, mode)
  window.dispatchEvent(new CustomEvent('helux:data-source-change', { detail: { mode } }))
}

export function getPersonaId(): string {
  return readCookie(PERSONA_COOKIE) || DEFAULT_PERSONA_ID
}

export function setPersonaId(id: string): void {
  writeCookie(PERSONA_COOKIE, id)
}

/** Leitura de cookies comum a `NextRequest` e `cookies()` do Next. */
export interface CookieReader {
  get(name: string): { value: string } | undefined
}

/** Modo efetivo no servidor (middleware e páginas). */
export function serverDataSource(cookies: CookieReader): DataSourceMode {
  return resolveDataSource({
    nodeEnv: process.env.NODE_ENV,
    cookie: cookies.get(DATA_SOURCE_COOKIE)?.value,
    envDefault: process.env.NEXT_PUBLIC_DATA_SOURCE,
  })
}

export function serverPersonaId(cookies: CookieReader): string {
  return cookies.get(PERSONA_COOKIE)?.value || DEFAULT_PERSONA_ID
}

/** Middleware (T007): em modo mock não exige sessão Supabase. */
export function shouldBypassAuth(request: { cookies: CookieReader }): boolean {
  return serverDataSource(request.cookies) === 'mock'
}

/** A Dev Bar e o modo mock só existem fora de produção (FR-008). */
export function showDevBar(): boolean {
  return process.env.NODE_ENV !== 'production'
}
