'use client'
import type { Hose, Failure, AppConfig, SupplierStats } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { fmtN } from '@/lib/calculations'

const PALETTE = ['#2e6da4','#dc2626','#ea580c','#16a34a','#7c3aed','#0891b2','#ca8a04','#be185d']
const SUP_COLOR: Record<string, string> = { SOTREQ: '#16a34a', TMH: '#dc2626' }
const supColor = (s: string) => SUP_COLOR[s] ?? '#ea580c'

// Chart heights — matching prototype (chart-wrap 240px regular, 200px small)
const H  = 200   // regular charts (small cards top/bottom)
const HT = 220   // TCO composition (slightly taller, full width)

interface Props {
  hoses:    Hose[]
  failures: Failure[]
  stats:    SupplierStats[]
  config:   AppConfig | null
}

function EmptyChart({ title, msg = 'Sem dados ainda' }: { title: string; msg?: string }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="flex items-center justify-center h-[200px] text-gray-300 text-sm border border-dashed border-gray-200 rounded">
        {msg}
      </div>
    </div>
  )
}

export default function DashboardCharts({ hoses, failures, stats }: Props) {
  // No failures yet → render the same prototype layout, but with empty placeholders
  if (!failures.length) {
    return (
      <div className="space-y-4">
        {/* Linha 1: MTBF + Falhas por Fornecedor (ordem do protótipo) */}
        <div className="grid grid-cols-2 gap-4">
          <EmptyChart title="⏱️ MTBF Médio por Fornecedor (h)" />
          <EmptyChart title="🔴 Falhas por Fornecedor" />
        </div>
        {/* Linha 2: TCO empilhado (full width) */}
        <div className="card">
          <div className="card-title">📊 TCO por Fornecedor – Custo Total por Hora (R$/h) <small className="font-normal text-gray-400">Material + Mão de Obra + Parada Produtiva</small></div>
          <div className="flex items-center justify-center h-[220px] text-gray-300 text-sm border border-dashed border-gray-200 rounded">
            Registre ocorrências para ver a composição do TCO
          </div>
        </div>
        {/* Linha 3: Falhas por Equipamento + Tipo de Falha */}
        <div className="grid grid-cols-2 gap-4">
          <EmptyChart title="🚧 Falhas por Equipamento" />
          <EmptyChart title="⚙️ Ocorrências por Tipo de Falha" />
        </div>
      </div>
    )
  }

  /* ── derived data ── */
  const tcoData = stats.map(s => ({
    name: s.name,
    'Material':        +s.matPerH.toFixed(4),
    'Mão de Obra':     +s.labPerH.toFixed(4),
    'Parada Produtiva':+s.dtPerH.toFixed(4),
  }))

  const mtbfData = stats.map(s => ({ name: s.name, MTBF: +s.avgMTBF.toFixed(0) }))

  const failsBySup: Record<string, number> = {}
  failures.forEach(f => {
    const sup = hoses.find(h => h.id === f.hose_id)?.supplier ?? f.supplier_orig ?? 'Desconhecido'
    failsBySup[sup] = (failsBySup[sup] ?? 0) + 1
  })
  const supPieData = Object.entries(failsBySup).map(([name, value]) => ({ name, value }))

  const failsByEquip: Record<string, number> = {}
  failures.forEach(f => { failsByEquip[f.equip] = (failsByEquip[f.equip] ?? 0) + 1 })
  const equipData = Object.entries(failsByEquip)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const failsByType: Record<string, number> = {}
  failures.forEach(f => { if (f.fail_type) failsByType[f.fail_type] = (failsByType[f.fail_type] ?? 0) + 1 })
  const typeData = Object.entries(failsByType).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-4">

      {/* Linha 1 — MTBF + Falhas por Fornecedor (igual protótipo) */}
      <div className="grid grid-cols-2 gap-4">
        {mtbfData.length > 0 ? (
          <div className="card">
            <div className="card-title">⏱️ MTBF Médio por Fornecedor (h)</div>
            <ResponsiveContainer width="100%" height={H}>
              <BarChart data={mtbfData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtN(v) + 'h'} />
                <Tooltip formatter={(v: number) => [fmtN(v) + 'h', 'MTBF']} />
                <Bar dataKey="MTBF" radius={[4, 4, 0, 0]}>
                  {mtbfData.map((d, i) => <Cell key={i} fill={supColor(d.name)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart title="⏱️ MTBF Médio por Fornecedor (h)" />}

        {supPieData.length > 0 ? (
          <div className="card">
            <div className="card-title">🔴 Falhas por Fornecedor</div>
            <ResponsiveContainer width="100%" height={H}>
              <PieChart>
                <Pie
                  data={supPieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={62}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {supPieData.map((d, i) => <Cell key={i} fill={supColor(d.name)} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart title="🔴 Falhas por Fornecedor" />}
      </div>

      {/* Linha 2 — TCO empilhado (full width, igual protótipo) */}
      {tcoData.length > 0 ? (
        <div className="card">
          <div className="card-title">📊 TCO por Fornecedor – Custo Total por Hora (R$/h) <small className="font-normal text-gray-400">Material + Mão de Obra + Parada Produtiva</small></div>
          <ResponsiveContainer width="100%" height={HT}>
            <BarChart data={tcoData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number, name) => [`R$ ${(+v).toFixed(4)}/h`, name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Material"          stackId="a" fill="#2e6da4" />
              <Bar dataKey="Mão de Obra"       stackId="a" fill="#4a9fd4" />
              <Bar dataKey="Parada Produtiva"  stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card">
          <div className="card-title">📊 TCO por Fornecedor – Custo Total por Hora (R$/h)</div>
          <div className="flex items-center justify-center h-[220px] text-gray-300 text-sm border border-dashed border-gray-200 rounded">
            Sem dados ainda
          </div>
        </div>
      )}

      {/* Linha 3 — Falhas por Equipamento + Tipo de Falha */}
      <div className="grid grid-cols-2 gap-4">
        {equipData.length > 0 ? (
          <div className="card">
            <div className="card-title">🚧 Falhas por Equipamento</div>
            <ResponsiveContainer width="100%" height={H}>
              <BarChart data={equipData} layout="vertical" margin={{ top: 4, right: 16, left: 44, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={44} />
                <Tooltip />
                <Bar dataKey="value" name="Falhas" radius={[0, 4, 4, 0]}>
                  {equipData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart title="🚧 Falhas por Equipamento" />}

        {typeData.length > 0 ? (
          <div className="card">
            <div className="card-title">⚙️ Ocorrências por Tipo de Falha</div>
            <ResponsiveContainer width="100%" height={H}>
              <PieChart>
                <Pie
                  data={typeData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={30} outerRadius={62}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {typeData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart title="⚙️ Ocorrências por Tipo de Falha" />}
      </div>

    </div>
  )
}
