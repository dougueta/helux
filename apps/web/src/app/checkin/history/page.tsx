'use client'

import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { CheckinHistoryTable } from '@/components/checkin/CheckinHistoryTable'
import { useCheckinHistory } from '@/hooks/useCheckinHistory'

function HistoryContent() {
  const { checkins, loading } = useCheckinHistory(24)

  if (loading) {
    return <p style={{ color: 'var(--text-faint)', fontSize: 14, padding: '0 16px' }}>Carregando…</p>
  }

  return <CheckinHistoryTable checkins={checkins} />
}

export default function CheckinHistoryPage() {
  return (
    <Shell>
      <div className="max-w-lg mx-auto" style={{ paddingBottom: 96 }}>
        <header style={{ padding: '48px 16px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>
              Histórico
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Check-ins</h1>
          </div>
          <Link
            href="/checkin"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              borderRadius: 'var(--r-pill)',
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            + Novo
          </Link>
        </header>
        <HistoryContent />
      </div>
    </Shell>
  )
}
