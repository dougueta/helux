import { vi } from 'vitest'

// Supabase falso para os testes da spec 018: cada tabela tem linhas; select
// aplica os filtros `eq`/`gte` e a ordenação; insert/update/upsert/delete
// gravam na memória e ficam registrados em `calls` para asserções.

type Row = Record<string, unknown>

export interface FakeCall {
  table: string
  op: 'insert' | 'update' | 'upsert' | 'delete'
  values?: unknown
  filters: [string, unknown][]
}

type Builder = any

export interface FakeSupabase {
  client: { from: (table: string) => Builder }
  db: Record<string, Row[]>
  calls: FakeCall[]
}

export function fakeSupabase(tables: Record<string, Row[]> = {}): FakeSupabase {
  const db: Record<string, Row[]> = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.map((r) => ({ ...r }))]))
  const calls: FakeCall[] = []
  let seq = 0

  function builder(table: string): Builder {
    const filters: [string, unknown][] = []
    const gtes: [string, unknown][] = []
    let order: { col: string; asc: boolean } | null = null
    let limit: number | null = null
    let op: FakeCall['op'] | null = null
    let values: unknown = null
    let wantSingle = false
    let onConflict: string[] = []

    const rows = () => {
      let out = (db[table] ?? []).filter((r) => filters.every(([c, v]) => r[c] === v) && gtes.every(([c, v]) => String(r[c]) >= String(v)))
      if (order) {
        const { col, asc } = order
        out = [...out].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0) * (asc ? 1 : -1))
      }
      if (limit !== null) out = out.slice(0, limit)
      return out
    }

    const run = () => {
      if (!op) {
        const data = rows()
        return { data: wantSingle ? (data[0] ?? null) : data, error: null }
      }
      calls.push({ table, op, values, filters: [...filters] })
      db[table] ??= []
      if (op === 'upsert' && onConflict.length > 0) {
        const list = (Array.isArray(values) ? values : [values]) as Row[]
        const saved = list.map((v) => {
          const hit = db[table].find((r) => onConflict.every((c) => r[c] === v[c]))
          if (hit) return Object.assign(hit, v)
          const row = { id: `${table}-${++seq}`, created_at: new Date(2026, 9, 13, 12, seq).toISOString(), ...v }
          db[table].push(row)
          return row
        })
        return { data: wantSingle ? saved[0] : saved, error: null }
      }
      if (op === 'insert' || op === 'upsert') {
        const list = (Array.isArray(values) ? values : [values]) as Row[]
        const saved = list.map((v) => ({ id: v.id ?? `${table}-${++seq}`, created_at: v.created_at ?? new Date(2026, 9, 13, 12, seq).toISOString(), ...v }))
        db[table].push(...saved)
        return { data: wantSingle ? saved[0] : saved, error: null }
      }
      if (op === 'update') {
        const hit = rows()
        for (const r of hit) Object.assign(r, values as Row)
        return { data: wantSingle ? (hit[0] ?? null) : hit, error: null }
      }
      db[table] = db[table].filter((r) => !filters.every(([c, v]) => r[c] === v))
      return { data: null, error: null }
    }

    const b = {
      select: vi.fn(() => b),
      eq: vi.fn((c: string, v: unknown) => (filters.push([c, v]), b)),
      gte: vi.fn((c: string, v: unknown) => (gtes.push([c, v]), b)),
      order: vi.fn((col: string, opts?: { ascending?: boolean }) => ((order = { col, asc: opts?.ascending ?? true }), b)),
      limit: vi.fn((n: number) => ((limit = n), b)),
      insert: vi.fn((v: unknown) => ((op = 'insert'), (values = v), b)),
      upsert: vi.fn((v: unknown, opts?: { onConflict?: string }) => {
        op = 'upsert'
        values = v
        onConflict = opts?.onConflict ? opts.onConflict.split(',').map((c) => c.trim()) : []
        return b
      }),
      update: vi.fn((v: unknown) => ((op = 'update'), (values = v), b)),
      delete: vi.fn(() => ((op = 'delete'), b)),
      single: vi.fn(() => ((wantSingle = true), Promise.resolve(run()))),
      maybeSingle: vi.fn(() => ((wantSingle = true), Promise.resolve(run()))),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(run()).then(resolve, reject),
    }
    return b
  }

  return { client: { from: vi.fn((t: string) => builder(t)) }, db, calls }
}
