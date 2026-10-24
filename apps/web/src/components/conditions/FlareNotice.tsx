'use client'

import { useEffect, useState } from 'react'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { endFlare, getConditions, type ConditionView } from '@/services/conditions.service'

/** Crise de gota que passou do prazo informado (spec 024, FR-009): orienta procurar o médico. */
export function FlareNotice() {
  const [expired, setExpired] = useState<ConditionView[]>([])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    getConditions()
      .then(({ conditions }) => setExpired(conditions.filter(c => c.flare && c.flare.until < today)))
      .catch(() => setExpired([]))
  }, [])

  if (expired.length === 0) return null
  const c = expired[0]
  return (
    <div style={{ marginTop: 12 }}>
      <Banner
        kind="warn"
        title={`A crise no ${c.flare!.region} passou do prazo`}
        action={
          <Button
            kind="secondary"
            onClick={() => {
              void endFlare(c.id).then(() => setExpired(list => list.filter(x => x.id !== c.id)))
            }}
          >
            A crise acabou
          </Button>
        }
      >
        Se ainda dói ou está inchado, procure seu médico. O treino continua poupando a articulação até você encerrar a crise.
      </Banner>
    </div>
  )
}
