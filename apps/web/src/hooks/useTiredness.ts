'use client'

import { useState } from 'react'
import { markTiredToday, clearTiredToday } from '@/services/tiredness.service'

export function useTiredness() {
  const [active, setActive] = useState(false)

  async function toggle(): Promise<void> {
    const result = active ? await clearTiredToday() : await markTiredToday()
    setActive(result.active)
  }

  return { active, toggle }
}
