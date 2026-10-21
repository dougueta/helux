'use client'

import dynamic from 'next/dynamic'
import type { DevBarProps } from './DevBar'

/**
 * Carrega a Dev Bar só no cliente, em chunk separado. Com o NODE_ENV literal,
 * o webpack descarta o `import()` no build de produção e o chunk nem é gerado (FR-008).
 */
export const DevBarMount =
  process.env.NODE_ENV !== 'production'
    ? dynamic<DevBarProps>(() => import('./DevBar').then(m => m.DevBar), { ssr: false })
    : () => null
