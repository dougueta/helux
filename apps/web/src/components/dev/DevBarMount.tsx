'use client'

import dynamic from 'next/dynamic'

/** Carrega a Dev Bar só no cliente e em chunk separado (o layout não a importa em produção). */
export const DevBarMount = dynamic(() => import('./DevBar').then(m => m.DevBar), { ssr: false })
