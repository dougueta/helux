import { describe, it, expect } from 'vitest'
import { formatDuration } from '@/lib/format-duration'

describe('formatDuration', () => {
  it('returns an em dash for null', () => {
    expect(formatDuration(null)).toBe('—')
  })

  it('returns an em dash for zero', () => {
    expect(formatDuration(0)).toBe('—')
  })

  it('formats under an hour as minutes', () => {
    expect(formatDuration(47 * 60)).toBe('47min')
  })

  it('formats an hour or more as hours and minutes', () => {
    expect(formatDuration(90 * 60)).toBe('1h 30m')
  })
})
