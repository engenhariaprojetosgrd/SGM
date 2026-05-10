'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const links = [
  { href: '/',              label: '📊 Dashboard' },
  { href: '/mangueiras',    label: '➕ Mangueiras' },
  { href: '/ocorrencias',   label: '⚠️ Ocorrências' },
  { href: '/fornecedores',  label: '🏭 Fornecedores' },
  { href: '/historico',     label: '📋 Histórico' },
  { href: '/configuracoes', label: '⚙️ Config.' },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-[#1a3a5c] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-12">
          <span className="text-white font-bold text-sm whitespace-nowrap">
            ⚙️ <span className="text-[#4a9fd4]">SGM</span>
            <span className="hidden sm:inline"> · Mangueiras Hidráulicas</span>
          </span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap
                  ${pathname === l.href
                    ? 'text-white border-[#4a9fd4] bg-white/10'
                    : 'text-white/70 border-transparent hover:text-white hover:bg-white/5'
                  }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Hamburger button (mobile) */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-white/10 py-2">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 text-sm font-medium rounded-lg mb-1 transition-all
                  ${pathname === l.href
                    ? 'text-white bg-white/20'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
