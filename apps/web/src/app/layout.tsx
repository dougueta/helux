import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { NavBar } from '@/components/layout/NavBar'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Helux',
  description: 'Seu treino personalizado',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-helux-dark text-white antialiased">
        <main className="pb-20">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <NavBar />
      </body>
    </html>
  )
}
