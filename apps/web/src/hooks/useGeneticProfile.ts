'use client'

import { useState, useEffect } from 'react'
import { getGeneticProfile } from '@/services/genetics.service'

export function useGeneticProfile() {
  const [profile, setProfile] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getGeneticProfile()
      .then(setProfile)
      .catch(e => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  return { profile, loading, error }
}
