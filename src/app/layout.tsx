import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'SGM – Gestão de Mangueiras Hidráulicas',
  description: 'Sistema de controle, análise e comparativo de fornecedores de mangueiras hidráulicas',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-5">{children}</main>
      </body>
    </html>
  )
}
