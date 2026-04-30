'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { Hose, Failure, SupplierStats, AppConfig } from '@/types'

const COLORS = ['#16a34a','#dc2626','#ea580c','#7c3aed','#0284c7','#d97706']

interface Props {
  hoses: Hose[]
  failures: Failure[]
  stats: SupplierStats[]
  config: AppConfig | null
}

export default function DashboardCharts({ hoses, failures, stats }: Props) {
  // MTBF by supplier
  const mtbfData = stats.map(s => ({ name: s.name, 'MTBF (h)': Math.round(s.avgMTBF) }))

  // TCO stacked
  const tcoData = stats.map(s => ({
    name: s.name,
    'Material': +s.matPerH.toFixed(3),
    'Mão de Obra': +s.labPerH.toFixed(3),
    'Parada Produtiva': +s.dtPerH.toFixed(3),
  }))

  // Failures by supplier
  const supCounts: Record<string, number> = {}
  failures.forEach(f => {
    const sup = hoses.find(h => h.id === f.hose_id)?.supplier ?? f.supplier_orig ?? 'Outro'
    supCounts[sup] = (supCounts[sup] ?? 0) + 1
  })
  const pieData = Object.entries(supCounts).map(([name, value]) => ({ name, value }))

  // Failures by equipment
  const equipCounts: Record<string, number> = {}
  failures.forEach(f => { equipCounts[f.equip] = (equipCounts[f.equip] ?? 0) + 1 })
  const equipData = Object.entries(equipCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // Failure types
  const typeCount: Record<string, number> = {}
  failures.forEach(f => { if (f.fail_type) typeCount[f.fail_type] = (typeCount[f.fail_type] ?? 0) + 1 })
  const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-4">
      {/* TCO full width */}
      <div className="card">
        <div className="card-title">💰 TCO por Fornecedor – Custo Total por Hora (R$/h) <span className="text-gray-400 font-normal text-xs">Material + MO + Parada</span></div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={tcoData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
            <Tooltip formatter={(v: number) => `R$ ${v.toFixed(3)}/h`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Material"          stackId="a" fill="#2e6da4" />
            <Bar dataKey="Mão de Obra"       stackId="a" fill="#4a9fd4" />
            <Bar dataKey="Parada Produtiva"  stackId="a" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MTBF */}
        <div className="card">
          <div className="card-title">📈 MTBF Médio por Fornecedor</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mtbfData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v + 'h'} />
              <Tooltip formatter={(v: number) => v + 'h'} />
              <Bar dataKey="MTBF (h)" radius={[4,4,0,0]}>
                {mtbfData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Failures by supplier */}
        <div className="card">
          <div className="card-title">🥧 Falhas por Fornecedor</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Failures by equipment */}
        <div className="card">
          <div className="card-title">🚧 Falhas por Equipamento</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={equipData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
              <Tooltip />
              <Bar dataKey="value" name="Falhas" fill="#7c3aed" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Failure types */}
        <div className="card">
          <div className="card-title">🔥 Tipos de Falha</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
