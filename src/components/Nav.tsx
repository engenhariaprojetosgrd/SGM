'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',               label: '📊 Dashboard' },
  { href: '/mangueiras',     label: '➕ Mangueiras' },
  { href: '/ocorrencias',    label: '⚠️ Ocorrências' },
  { href: '/fornecedores',   label: '🏭 Fornecedores' },
  { href: '/historico',      label: '📋 Histórico' },
  { href: '/configuracoes',  label: '⚙️ Config.' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav className="bg-[#1a3a5c] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-13 gap-1">
        <span className="text-white font-bold text-sm mr-4 whitespace-nowrap py-3">
          ⚙️ <span className="text-[#4a9fd4]">SGMH</span> · Mangueiras Hidráulicas
        </span>
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
    </nav>
  )
}
