'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Hose, Failure, AppConfig } from '@/types'
import { fmt, fmtN } from '@/lib/calculations'

export default function HistoricoPage() {
  const [hoses,    setHoses]    = useState<Hose[]>([])
  const [failures, setFailures] = useState<Failure[]>([])
  const [config,   setConfig]   = useState<AppConfig | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [fEq,  setFEq]  = useState('')
  const [fSup, setFSup] = useState('')
  const [fSta, setFSta] = useState('')
  const [fTyp, setFTyp] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: h }, { data: f }, { data: c }] = await Promise.all([
        supabase.from('hoses').select('*').order('created_at',{ascending:false}),
        supabase.from('failures').select('*').order('fail_date',{ascending:false}),
        supabase.from('app_config').select('*').eq('id',1).single(),
      ])
      setHoses(h??[]); setFailures(f??[]); setConfig(c); setLoading(false)
    }
    load()
  }, [])

  const filteredHoses = hoses.filter(h => {
    if (fEq  && h.equip    !== fEq)  return false
    if (fSup && h.supplier !== fSup) return false
    if (fSta && h.status   !== fSta) return false
    return true
  })

  const filteredFails = failures.filter(f => {
    if (fEq  && f.equip         !== fEq)  return false
    if (fSup && f.supplier_orig !== fSup) return false
    if (fTyp && f.fail_type     !== fTyp) return false
    return true
  })

  // Dynamic lists from actual data (works with free-text equipment names)
  const equipOptions = [...new Set([...hoses.map(h=>h.equip), ...failures.map(f=>f.equip)])].filter(Boolean).sort()
  const supOptions   = [...new Set([...hoses.map(h=>h.supplier), ...failures.map(f=>f.supplier_orig??'').filter(s=>s)])].sort()
  const failTypes    = [...new Set(failures.map(f=>f.fail_type).filter(Boolean))]
  const machineCost  = config?.machine_cost_per_hour ?? 800

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando histórico...</div>

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-[#1a3a5c]">📋 Histórico Completo</h1>

      <div className="card">
        <div className="card-title">🔍 Filtros</div>
        <div className="flex gap-3 flex-wrap items-end">
          <div><label className="lbl">Equipamento</label>
            <select className="inp text-xs py-1.5" value={fEq} onChange={e=>setFEq(e.target.value)}>
              <option value="">Todos</option>
              {equipOptions.map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <div><label className="lbl">Fornecedor</label>
            <select className="inp text-xs py-1.5" value={fSup} onChange={e=>setFSup(e.target.value)}>
              <option value="">Todos</option>
              {supOptions.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="lbl">Status</label>
            <select className="inp text-xs py-1.5" value={fSta} onChange={e=>setFSta(e.target.value)}>
              <option value="">Todos</option>
              <option value="active">Ativa</option>
              <option value="replaced">Substituída</option>
            </select>
          </div>
          <div><label className="lbl">Tipo de Falha</label>
            <select className="inp text-xs py-1.5" value={fTyp} onChange={e=>setFTyp(e.target.value)}>
              <option value="">Todos</option>
              {failTypes.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn btn-outline btn-sm" onClick={()=>{setFEq('');setFSup('');setFSta('');setFTyp('')}}>Limpar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">🔩 Mangueiras <span className="text-gray-400 font-normal">({filteredHoses.length})</span></div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead><tr>
              <th>ID</th><th>Equipamento</th><th>Sistema</th><th>Posição</th>
              <th>Fornecedor</th><th>Tipo</th><th>Custo Unit.</th>
              <th>Instalação</th><th>Horímetro</th><th>Status</th><th>Falhas</th><th>MTBF Médio</th>
            </tr></thead>
            <tbody>
              {filteredHoses.length===0 && <tr><td colSpan={12} className="text-center py-6 text-gray-400">Nenhum registro encontrado</td></tr>}
              {filteredHoses.map(h => {
                const hFails = failures.filter(f=>f.hose_id===h.id)
                const avgMTBF = hFails.length ? hFails.reduce((a,f)=>a+(f.mtbf??0),0)/hFails.length : null
                return (
                  <tr key={h.id}>
                    <td><span className="badge badge-blue">{h.id}</span></td>
                    <td className="font-bold">{h.equip}</td>
                    <td>{h.system}</td><td>{h.position}</td>
                    <td><SupBadge s={h.supplier}/></td>
                    <td>{h.hose_type?.includes('Genuína')?<span className="badge badge-blue text-[10px]">OEM</span>:<span className="badge badge-gray text-[10px]">Alt.</span>}</td>
                    <td>{fmt(h.unit_cost)}</td>
                    <td>{h.install_date??'—'}</td>
                    <td>{fmtN(h.install_hours)}h</td>
                    <td>{h.status==='active'?<span className="badge badge-green">Ativa</span>:<span className="badge badge-orange">Substituída</span>}</td>
                    <td className="text-center">{hFails.length}</td>
                    <td>{avgMTBF!==null?<strong>{fmtN(avgMTBF!)}h</strong>:'—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">⚠️ Ocorrências <span className="text-gray-400 font-normal">({filteredFails.length})</span></div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead><tr>
              <th>Data</th><th>Equipamento</th><th>Posição</th><th>Fornecedor</th>
              <th>Tipo Falha</th><th>MTBF</th><th>Downtime</th><th>Custo Parada</th><th>Causa Raiz</th>
            </tr></thead>
            <tbody>
              {filteredFails.length===0 && <tr><td colSpan={9} className="text-center py-6 text-gray-400">Nenhuma ocorrência</td></tr>}
              {filteredFails.map(f=>(
                <tr key={f.id}>
                  <td>{f.fail_date}</td>
                  <td className="font-bold">{f.equip}</td>
                  <td>{f.position}</td>
                  <td><SupBadge s={f.supplier_orig??'—'}/></td>
                  <td><span className={`badge ${f.fail_type==='Estouro'?'badge-red':f.fail_type==='Vazamento'?'badge-orange':'badge-gray'}`}>{f.fail_type??'—'}</span></td>
                  <td className="font-bold">{f.mtbf!=null?fmtN(f.mtbf)+'h':'—'}</td>
                  <td>{f.downtime?.toFixed(1)}h</td>
                  <td className="text-red-600 font-bold">{fmt((f.downtime??0)*machineCost,0)}</td>
                  <td className="text-gray-500">{f.root_cause??'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SupBadge({ s }: { s: string }) {
  if (s==='SOTREQ') return <span className="badge badge-green">{s}</span>
  if (s==='TMH')    return <span className="badge badge-red">{s}</span>
  if (s==='—')      return <span>—</span>
  return <span className="badge badge-orange">{s}</span>
}
