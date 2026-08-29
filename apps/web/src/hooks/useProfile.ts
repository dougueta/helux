'use client'

import { useState, useEffect } from 'react'
import { getProfile, upsertProfile } from '@/services/profile.service'
import type { UserTrainingProfile, UserTrainingProfileInput } from '@helux/types'

export function useProfile() {
  const [profile, setProfile] = useState<UserTrainingProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .finally(() => setLoading(false))
  }, [])

  async function save(input: UserTrainingProfileInput): Promise<UserTrainingProfile> {
    setSaving(true)
    try {
      const saved = await upsertProfile(input)
      setProfile(saved)
      return saved
    } finally {
      setSaving(false)
    }
  }

  return { profile, loading, saving, save }
}
