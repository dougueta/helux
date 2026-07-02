'use client'

import { useState, useEffect } from 'react'
import { getCheckins, upsertCheckin } from '@/services/checkin.service'
import type { BodyCheckin, CheckinInput } from '@helux/types'

function currentMonthSlug(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function useCheckin() {
  const [current, setCurrent] = useState<BodyCheckin | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCheckins(1)
      .then(([c]) => {
        const month = currentMonthSlug()
        setCurrent(c?.month === month ? c : null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function save(input: Omit<CheckinInput, 'month'>): Promise<BodyCheckin> {
    setSaving(true)
    try {
      const saved = await upsertCheckin({ ...input, month: currentMonthSlug() })
      setCurrent(saved)
      return saved
    } finally {
      setSaving(false)
    }
  }

  return { current, loading, saving, save }
}
