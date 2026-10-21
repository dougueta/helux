'use client'

import { useEffect, useState } from 'react'
import type { NutriMarker, NutriMarkerCategory, NutriMarkerStatus } from '@helux/types'
import { TraitCard } from '@/components/dna/TraitCard'
import { Banner } from '@/components/ui/Banner'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { getGeneticProfile, type GeneticProfileResponse } from '@/services/nutrition.service'

const GROUPS: { category: NutriMarkerCategory; title: string }[] = [
  { category: 'metabolismo-sensibilidades', title: 'Metabolismo & Sensibilidades' },
  { category: 'micronutrientes-vitaminas', title: 'Micronutrientes & Vitaminas' },
  { category: 'perfil-muscular-dieta', title: 'Perfil Muscular & Dieta' },
]

const STATUS_WORD: Record<NutriMarkerStatus, string> = { atencao: 'atenção', neutro: 'neutro', favoravel: 'favorável' }

/** Seção Perfil genético da aba Nutrição (spec 018, US4). */
export function NutriProfile() {
  const [profile, setProfile] = useState<GeneticProfileResponse | null>(null)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState<NutriMarker | null>(null)

  useEffect(() => {
    getGeneticProfile().then(setProfile, () => setError(true))
  }, [])

  if (error) {
    return (
      <div style={{ marginTop: 20 }}>
        <Banner kind="err" title="Não foi possível carregar o perfil genético">
          Tente de novo em instantes.
        </Banner>
      </div>
    )
  }
  if (!profile) return <Skeleton h={220} style={{ marginTop: 20 }} />

  if (!profile.active) {
    return (
      <div style={{ marginTop: 20 }}>
        <Banner kind="warn" title="Perfil genético não carregado">
          Sem o teste genético, a nutrição segue as diretrizes esportivas padrão.
        </Banner>
      </div>
    )
  }

  return (
    <>
      {GROUPS.map(({ category, title }) => {
        const markers = profile.markers.filter(m => m.category === category)
        if (markers.length === 0) return null
        const id = `nutri-${category}`
        return (
          <section key={category} aria-labelledby={id} style={{ marginTop: 24 }}>
            <SectionHeader title={<span id={id}>{title}</span>} />
            <div style={{ display: 'grid', gap: 10 }}>
              {markers.map(m => (
                <button
                  key={`${m.gene}-${m.label}`}
                  type="button"
                  aria-label={`${m.gene} · ${m.label} · ${STATUS_WORD[m.status]}`}
                  onClick={() => setOpen(m)}
                  style={{ all: 'unset', cursor: 'pointer', display: 'block' }}
                >
                  <TraitCard
                    gene={m.gene}
                    genotype={m.genotype}
                    label={m.label}
                    status={STATUS_WORD[m.status]}
                    note={m.result}
                    warn={m.status === 'atencao'}
                  />
                </button>
              ))}
            </div>
          </section>
        )
      })}

      <Sheet open={open !== null} onClose={() => setOpen(null)} label={open ? `Conduta para ${open.gene}` : 'Conduta'}>
        {open && (
          <>
            <h2 className="t-section">
              <span className="gene">{open.gene}</span> · {open.label}
            </h2>
            <p className="t-secondary" style={{ marginTop: 6 }}>
              {open.result}
            </p>
            {open.conduct && open.conduct.recommend.length > 0 && (
              <>
                <p className="t-caption dim" style={{ marginTop: 16 }}>
                  Recomendar
                </p>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {open.conduct.recommend.map(r => (
                    <li key={r} className="t-body">
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {open.conduct && open.conduct.avoid.length > 0 && (
              <>
                <p className="t-caption dim" style={{ marginTop: 16 }}>
                  Evitar
                </p>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {open.conduct.avoid.map(r => (
                    <li key={r} className="t-body">
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {!open.conduct && (
              <p className="t-secondary" style={{ marginTop: 16 }}>
                Sem conduta específica para este marcador.
              </p>
            )}
          </>
        )}
      </Sheet>
    </>
  )
}
