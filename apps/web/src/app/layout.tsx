import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import './helux-v2.css'
import { NavBar } from '@/components/layout/NavBar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DevBarMount } from '@/components/dev/DevBarMount'

// Pesos da v2 (research V1): Grotesk 400–700; Mono 400–600 + itálico (genes).
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Helux',
  description: 'Seu treino personalizado',
}

// No Next 14, `metadata.viewport` é ignorado ("Unsupported metadata viewport").
// Sem viewport-fit=cover, env(safe-area-inset-bottom) vale 0 no iPhone (R6).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <main style={{ paddingBottom: 80 }}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <NavBar />
        {/* NODE_ENV literal: o build de produção descarta a Dev Bar (FR-008). */}
        {process.env.NODE_ENV !== 'production' && <DevBarMount initialCollapsed />}
      </body>
    </html>
  )
}
