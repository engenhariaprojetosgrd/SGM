'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSupplierStats, calcRealCostComparison, fmt, fmtN } from '@/lib/calculations'
import type { Hose, Failure, AppConfig, SupplierStats } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, CartesianGrid } from 'recharts'

const MEDALS = ['🥇','🥈','🥉']
const RANK_STYLES = [
  'border-green-400 bg-gradient-to-br from-green-50 to-emerald-100',
  'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-100',
  'border-red-400   bg-gradient-to-br from-red-50   to-rose-100',
]
const TCO_COLOR = ['text-green-700','text-amber-700','text-red-700']

export default function FornecedoresPage() {
  const [hoses,    setHoses]    = useState<Hose[]>([])
  const [failures, setFailures] = useState<Failure[]>([])
  const [config,   setConfig]   = useState<AppConfig | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: h }, { data: f }, { data: c }] = await Promise.all([
        supabase.from('hoses').select('*'),
        supabase.from('failures').select('*'),
        supabase.from('app_config').select('*').eq('id',1).single(),
      ])
      setHoses(h??[]); setFailures(f??[]); setConfig(c); setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando análise...</div>

  // Use default config values when none saved yet — page always renders
  const effectiveConfig: AppConfig = config ?? {
    id: 1,
    machine_cost_per_hour: 800,
    labor_cost_per_hour: 45,
    labor_hours_install: 1.5,
    fleet_name: 'MRN – Motoniveladora',
  }

  const stats = getSupplierStats(hoses, failures, effectiveConfig)
  const comparison = calcRealCostComparison(stats, effectiveConfig)
  const tcoChartData = stats.map(s=>({ name:s.name, 'Material':+s.matPerH.toFixed(4), 'Mão de Obra':+s.labPerH.toFixed(4), 'Parada Produtiva':+s.dtPerH.toFixed(4) }))
  const scatterData  = stats.map(s=>({ name:s.name, custo:+s.avgCost.toFixed(0), mtbf:+s.avgMTBF.toFixed(0) }))

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-[#1a3a5c]">🏭 Análise de Fornecedores – TCO Real</h1>

      {!config && (
        <div className="alert alert-warning">
          ⚙️ Usando valores padrão de custo. Acesse <strong>Config</strong> para personalizar os parâmetros da sua frota.
        </div>
      )}

      <div className="alert alert-info">
        <strong>💡 Como ler esta análise:</strong> O TCO (Custo Total por Hora) considera <strong>material + mão de obra + custo da parada produtiva</strong>. Uma mangueira barata que falha com frequência pode custar <strong>5 a 7× mais</strong> do que uma genuína.
      </div>

      {/* Empty state when no failure data yet */}
      {stats.length === 0 && (
        <div className="card text-center py-10 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-base font-bold text-gray-500 mb-1">Nenhuma ocorrência registrada ainda</div>
          <div className="text-sm">Registre ocorrências na aba <strong>⚠️ Ocorrências</strong> para ver a análise comparativa de fornecedores por TCO real.</div>
        </div>
      )}

      {/* All data-dependent content — only renders when we have failures */}
      {stats.length > 0 && <>

      {/* Supplier ranking cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s,i) => (
          <div key={s.name} className={`rounded-xl p-5 border-2 ${RANK_STYLES[i]??RANK_STYLES[2]}`}>
            <div className="text-3xl mb-2">{MEDALS[i]??'🔴'}</div>
            <div className="text-base font-bold text-[#1a3a5c] mb-1">{s.name}</div>
            <div className={`text-2xl font-bold ${TCO_COLOR[i]??'text-red-700'} mb-1`}>{fmt(s.tco,3)}<span className="text-sm font-normal text-gray-500">/h</span></div>
            <div className="text-xs text-gray-500 mb-3">Custo Total por Hora (TCO)</div>
            <div className="space-y-1 text-xs">
              <Row label="MTBF Médio"     value={fmtN(s.avgMTBF)+'h'} />
              <Row label="Custo Unitário" value={fmt(s.avgCost)} />
              <Row label="Downtime Médio" value={s.avgDowntime.toFixed(1)+'h/falha'} />
              <Row label="Nº de Falhas"   value={String(s.count)} />
              {i > 0 && stats[0] && (
                <div className="mt-2 pt-2 border-t border-black/10 flex justify-between font-bold">
                  <span>TCO vs. melhor</span>
                  <span className="text-red-600">+{((s.tco/stats[0].tco-1)*100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* TCO table */}
      <div className="card">
        <div className="card-title">📊 Tabela Comparativa Detalhada</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead><tr className="bg-[#1a3a5c] text-white">
              <th className="px-3 py-2 text-left">Fornecedor</th>
              <th className="px-3 py-2 text-center">Rank</th>
              <th className="px-3 py-2 text-center">MTBF Médio</th>
              <th className="px-3 py-2 text-center">Custo Unit. Médio</th>
              <th className="px-3 py-2 text-center">Material /h</th>
              <th className="px-3 py-2 text-center">MO /h</th>
              <th className="px-3 py-2 text-center text-red-300">Parada /h</th>
              <th className="px-3 py-2 text-center font-bold">TCO /h</th>
              <th className="px-3 py-2 text-center">vs. Melhor</th>
            </tr></thead>
            <tbody>
              {stats.map((s,i) => (
                <tr key={s.name} className={i===0?'bg-green-50':i===stats.length-1?'bg-red-50':''}>
                  <td className="px-3 py-2 font-bold border-b">{s.name}</td>
                  <td className="px-3 py-2 text-center border-b text-xl">{MEDALS[i]??'🔴'}</td>
                  <td className="px-3 py-2 text-center border-b font-bold">{fmtN(s.avgMTBF)}h</td>
                  <td className="px-3 py-2 text-center border-b">{fmt(s.avgCost)}</td>
                  <td className="px-3 py-2 text-center border-b">{fmt(s.matPerH,3)}</td>
                  <td className="px-3 py-2 text-center border-b">{fmt(s.labPerH,3)}</td>
                  <td className="px-3 py-2 text-center border-b text-red-600 font-bold">{fmt(s.dtPerH,3)}</td>
                  <td className={`px-3 py-2 text-center border-b font-bold text-base ${TCO_COLOR[i]??'text-red-700'}`}>{fmt(s.tco,3)}</td>
                  <td className="px-3 py-2 text-center border-b">
                    {i===0 ? <span className="badge badge-green">Referência</span>
                           : <span className="badge badge-red">+{((s.tco/(stats[0]?.tco??1)-1)*100).toFixed(0)}%</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real vs Perceived saving */}
      {comparison && (
        <div className="card">
          <div className="card-title">💸 Save Percebido vs. Custo Real <span className="font-normal text-gray-400 text-xs">(base: 10 mangueiras compradas)</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl p-5 bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">💬 "Save" percebido pelo Suprimentos</div>
              <div className={`text-3xl font-bold mb-1 ${comparison.perceivedSave < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                {comparison.perceivedSave < 0 ? fmt(-comparison.perceivedSave,0)+' mais caro' : fmt(comparison.perceivedSave,0)+' economizado'}
              </div>
              <div className="text-xs text-gray-600">Comprando {comparison.qty}× <strong>{comparison.worst.name}</strong> vs <strong>{comparison.best.name}</strong><br/>Apenas custo unitário de material</div>
            </div>
            <div className="rounded-xl p-5 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">✅ Custo REAL para {fmtN(comparison.opsHours)}h de operação</div>
              <div className="text-3xl font-bold text-red-600 mb-1">-{fmt(comparison.realDiff,0)}</div>
              <div className="text-xs text-gray-600">
                <strong>{comparison.worst.name}</strong> precisa de <strong>{comparison.qtyWorst.toFixed(1)} mangueiras</strong><br/>
                Custo total: <strong>{fmt(comparison.costWorst,0)}</strong> vs <strong>{fmt(comparison.costBest,0)}</strong> ({comparison.best.name})
              </div>
            </div>
          </div>
          <div className="alert alert-danger">
            🔴 <strong>Conclusão para a gestão:</strong> O fornecedor <strong>{comparison.worst.name}</strong> gera um custo real de <strong>{fmt(comparison.realDiff,0)} a mais</strong> do que o <strong>{comparison.best.name}</strong> para a mesma operação de {fmtN(comparison.opsHours)}h — principalmente por paradas produtivas não contabilizadas pelo Suprimentos. O "save" de material se transforma em prejuízo operacional.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">📊 Composição do TCO por Fornecedor</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tcoChartData}>
              <XAxis dataKey="name" tick={{fontSize:12}}/>
              <YAxis tick={{fontSize:11}} tickFormatter={v=>`R$${v}`}/>
              <Tooltip formatter={(v:number)=>`R$ ${v.toFixed(4)}/h`}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <Bar dataKey="Material"         stackId="a" fill="#2e6da4"/>
              <Bar dataKey="Mão de Obra"      stackId="a" fill="#4a9fd4"/>
              <Bar dataKey="Parada Produtiva" stackId="a" fill="#dc2626"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">📈 MTBF vs Custo Unitário</div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="custo" name="Custo (R$)" tick={{fontSize:11}} label={{value:'Custo Unit. (R$)',position:'insideBottom',offset:-5,fontSize:11}}/>
              <YAxis dataKey="mtbf"  name="MTBF (h)"  tick={{fontSize:11}} label={{value:'MTBF (h)',angle:-90,position:'insideLeft',fontSize:11}}/>
              <Tooltip cursor={{strokeDasharray:'3 3'}} content={({payload})=>{
                if(!payload?.length) return null
                const d = payload[0]?.payload
                return <div className="bg-white border rounded p-2 text-xs shadow"><strong>{d?.name}</strong><br/>MTBF: {d?.mtbf}h<br/>Custo: R$ {d?.custo}</div>
              }}/>
              {scatterData.map((d,i)=>(
                <Scatter key={d.name} name={d.name} data={[d]}
                  fill={['#16a34a','#dc2626','#ea580c'][i]??'#888'}
                  shape={(props: {cx?: number; cy?: number}) => <circle cx={props.cx} cy={props.cy} r={16} fill={['#16a34a','#dc2626','#ea580c'][i]??'#888'} opacity={0.85}/>}
                />
              ))}
              <Legend wrapperStyle={{fontSize:12}}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      </>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
