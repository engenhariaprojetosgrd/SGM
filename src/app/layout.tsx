import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'SGMH – Gestão de Mangueiras Hidráulicas',
  description: 'Sistema de controle, análise e comparativo de fornecedores de mangueiras hidráulicas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <main className="max-w-7xl mx-auto px-4 py-5">{children}</main>
      </body>
    </html>
  )
}
