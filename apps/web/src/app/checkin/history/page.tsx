'use client'

import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { CheckinHistoryTable } from '@/components/checkin/CheckinHistoryTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCheckinHistory } from '@/hooks/useCheckinHistory'

function HistoryContent() {
  const { checkins, loading } = useCheckinHistory(13)

  if (loading) {
    return (
      <div aria-busy="true" aria-label="carregando histórico">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} h={120} style={{ marginTop: 16 }} />
        ))}
      </div>
    )
  }

  return <CheckinHistoryTable checkins={checkins} />
}

export default function CheckinHistoryPage() {
  return (
    <Shell>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
        <div>
          <p className="t-secondary">Histórico</p>
          <h1 className="t-display" style={{ marginTop: 4 }}>
            Check-ins
          </h1>
        </div>
        <Link href="/checkin" className="hx-btn hx-btn--secondary">
          Novo check-in
        </Link>
      </header>
      <HistoryContent />
    </Shell>
  )
}
