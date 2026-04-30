'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSupplierStats, fmt, fmtN } from '@/lib/calculations'
import type { Hose, Failure, AppConfig } from '@/types'
import KpiCard from '@/components/KpiCard'
import DashboardCharts from '@/components/charts/DashboardCharts'

export default function Dashboard() {
  const [hoses,    setHoses]    = useState<Hose[]>([])
  const [failures, setFailures] = useState<Failure[]>([])
  const [config,   setConfig]   = useState<AppConfig | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: h }, { data: f }, { data: c }] = await Promise.all([
        supabase.from('hoses').select('*'),
        supabase.from('failures').select('*').order('fail_date', { ascending: false }),
        supabase.from('app_config').select('*').eq('id', 1).single(),
      ])
      setHoses(h ?? [])
      setFailures(f ?? [])
      setConfig(c)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando dados...</div>

  const stats       = config ? getSupplierStats(hoses, failures, config) : []
  const activeCount = hoses.filter(h => h.status === 'active').length
  const totalDTCost = failures.reduce((a, f) => a + (f.downtime * (config?.machine_cost_per_hour ?? 800)), 0)
  const avgMTBF     = failures.length ? failures.reduce((a, f) => a + (f.mtbf ?? 0), 0) / failures.length : 0
  const tmhFails    = failures.filter(f => hoses.find(h => h.id === f.hose_id)?.supplier === 'TMH').length

  const alertsList: string[] = []
  const failByEquip: Record<string, number> = {}
  failures.forEach(f => { failByEquip[f.equip] = (failByEquip[f.equip] ?? 0) + 1 })
  Object.entries(failByEquip).forEach(([e, c]) => { if (c >= 3) alertsList.push(`🔴 ${e} possui ${c} falhas registradas — avalie manutenção preventiva completa.`) })
  if (tmhFails >= 4) alertsList.push(`⚠️ Fornecedor TMH responde por ${tmhFails} das ${failures.length} falhas (${Math.round(tmhFails/failures.length*100)}%). Reavalie o contrato.`)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#1a3a5c]">📊 Dashboard – Visão Geral da Frota</h1>
        <span className="text-xs text-gray-400">{config?.fleet_name}</span>
      </div>

      {alertsList.length > 0 && (
        <div className="space-y-2">
          {alertsList.map((a, i) => <div key={i} className="alert alert-warning font-medium">{a}</div>)}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard value={String(activeCount)}       label="Mangueiras Ativas"       sub={`${hoses.length} cadastradas no total`} color="green" icon="🔩" />
        <KpiCard value={String(failures.length)}   label="Ocorrências Registradas" sub="Falhas e substituições"                  color="red"   icon="⚠️" />
        <KpiCard value={fmtN(avgMTBF) + 'h'}      label="MTBF Médio Geral"         sub="Meta: 1.500h+"                         color="orange" icon="⏱️" />
        <KpiCard value={fmt(totalDTCost, 0)}       label="Custo Total de Downtime"  sub="Horas produtivas perdidas"             color="purple" icon="💰" />
      </div>

      <DashboardCharts hoses={hoses} failures={failures} stats={stats} config={config} />
    </div>
  )
}
