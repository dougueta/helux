'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BodyDataFields, bodyDataFrom, bodyDataToInput } from '@/components/perfil/BodyDataFields'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { upsertProfile } from '@/services/profile.service'
import type { MissingField } from '@/services/nutrition.service'

/**
 * Pré-requisitos da nutrição (spec 018): altura, nascimento e sexo no perfil
 * e um check-in com peso. Enquanto o onboarding não existe, pede aqui mesmo.
 */
export function ProfileGate({ missing, onDone }: { missing: MissingField[]; onDone: () => void }) {
  const needsProfile = missing.some(m => m !== 'checkinWeight')
  const [body, setBody] = useState(() => bodyDataFrom(null))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await upsertProfile(bodyDataToInput(body))
      onDone()
    } catch {
      setError('Não foi possível salvar. Confira os valores e tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  if (!needsProfile) {
    return (
      <section style={{ marginTop: 24 }}>
        <h2 className="t-section">Falta um check-in com peso</h2>
        <p className="t-secondary" style={{ marginTop: 6 }}>
          As metas da fase partem do seu peso atual. Registre o check-in do mês e volte aqui.
        </p>
        <Link href="/checkin" className="hx-btn hx-btn--primary hx-btn--block" style={{ marginTop: 16 }}>
          Fazer check-in
        </Link>
      </section>
    )
  }

  return (
    <form onSubmit={save} noValidate style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 className="t-section">Seus dados corporais</h2>
        <p className="t-secondary" style={{ marginTop: 6 }}>
          Altura, idade e sexo entram no cálculo das calorias e do % de gordura pela fita métrica.
        </p>
      </div>
      <BodyDataFields value={body} onChange={setBody} />
      {error && (
        <Banner kind="err" title="Não foi possível salvar">
          {error}
        </Banner>
      )}
      <Button type="submit" kind="primary" size="lg" block loading={saving}>
        Salvar dados
      </Button>
    </form>
  )
}
