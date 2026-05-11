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

// Chart heights — reduced vs prototype to match visual target
const H  = 210   // regular charts
const HT = 250   // taller chart (TCO composition)

interface Props {
  hoses:    Hose[]
  failures: Failure[]
  stats:    SupplierStats[]
  config:   AppConfig | null
}

export default function DashboardCharts({ hoses, failures, stats }: Props) {
  if (!failures.length) {
    return (
      <div className="card text-center py-10 text-gray-400">
        <div className="text-4xl mb-3">📈</div>
        <div className="text-sm">
          Cadastre mangueiras e registre ocorrências para ver os gráficos de análise.
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

      {/* TCO por fornecedor — stacked bar (tall) */}
      {tcoData.length > 0 && (
        <div className="card">
          <div className="card-title">📊 Composição do TCO por Fornecedor (R$/h)</div>
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
      )}

      {/* MTBF + Falhas por fornecedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mtbfData.length > 0 && (
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
        )}

        {supPieData.length > 0 && (
          <div className="card">
            <div className="card-title">🔴 Falhas por Fornecedor</div>
            <ResponsiveContainer width="100%" height={H}>
              <PieChart>
                <Pie
                  data={supPieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={72}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {supPieData.map((d, i) => <Cell key={i} fill={supColor(d.name)} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Falhas por equipamento + por tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipData.length > 0 && (
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
        )}

        {typeData.length > 0 && (
          <div className="card">
            <div className="card-title">⚙️ Ocorrências por Tipo de Falha</div>
            <ResponsiveContainer width="100%" height={H}>
              <PieChart>
                <Pie
                  data={typeData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={36} outerRadius={72}
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
        )}
      </div>

    </div>
  )
}
