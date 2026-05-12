'use client'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import type { Hose, Failure, AppConfig } from '@/types'
import { fmt, fmtN } from '@/lib/calculations'

type MenuKind = 'hose' | 'failure'
type MenuState = { kind: MenuKind; id: string; label: string; x: number; y: number }

export default function HistoricoPage() {
  const [hoses,    setHoses]    = useState<Hose[]>([])
  const [failures, setFailures] = useState<Failure[]>([])
  const [config,   setConfig]   = useState<AppConfig | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [fEq,  setFEq]  = useState('')
  const [fSup, setFSup] = useState('')
  const [fSta, setFSta] = useState('')
  const [fTyp, setFTyp] = useState('')
  const [msg, setMsg] = useState<{text:string;type:'ok'|'err'} | null>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { load(); setMounted(true) }, [])

  async function load() {
    setLoading(true)
    const [{ data: h }, { data: f }, { data: c }] = await Promise.all([
      supabase.from('hoses').select('*').order('created_at',{ascending:false}),
      supabase.from('failures').select('*').order('fail_date',{ascending:false}),
      supabase.from('app_config').select('*').eq('id',1).single(),
    ])
    setHoses(h??[]); setFailures(f??[]); setConfig(c); setLoading(false)
  }

  // Fechar menu ao clicar fora / rolar / redimensionar
  useEffect(() => {
    if (!menu) return
    function close(e?: Event) {
      if (e && menuRef.current && menuRef.current.contains(e.target as Node)) return
      setMenu(null)
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menu])

  function openMenu(kind: MenuKind, id: string, label: string, e: React.MouseEvent<HTMLButtonElement>) {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
    if (menu?.kind === kind && menu?.id === id) { setMenu(null); return }
    setMenu({ kind, id, label, x: rect.right - 180, y: rect.bottom + 4 })
  }

  async function deleteHose(id: string, label: string) {
    setMenu(null)
    if (!confirm(`Excluir DEFINITIVAMENTE a mangueira ${id} (${label})?\n\nEsta ação NÃO pode ser desfeita. Ocorrências vinculadas ficarão sem referência.`)) return
    const { error } = await supabase.from('hoses').delete().eq('id', id)
    if (error) setMsg({ text: 'Erro ao excluir: ' + error.message, type: 'err' })
    else { setMsg({ text: `Mangueira ${id} excluída.`, type: 'ok' }); load() }
    setTimeout(() => setMsg(null), 4000)
  }

  async function deleteFailure(id: string, label: string) {
    setMenu(null)
    if (!confirm(`Excluir DEFINITIVAMENTE a ocorrência ${id} (${label})?\n\nEsta ação NÃO pode ser desfeita. Os cálculos de MTBF/TCO serão recalculados sem este registro.`)) return
    const { error } = await supabase.from('failures').delete().eq('id', id)
    if (error) setMsg({ text: 'Erro ao excluir: ' + error.message, type: 'err' })
    else { setMsg({ text: `Ocorrência ${id} excluída.`, type: 'ok' }); load() }
    setTimeout(() => setMsg(null), 4000)
  }

  const filteredHoses = hoses.filter(h => {
    // não exibir mangueiras 'archived' no histórico — são registros legados
    if (h.status === 'archived') return false
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

      {msg && <div className={`alert ${msg.type === 'ok' ? 'alert-success' : 'alert-danger'}`}>{msg.text}</div>}

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
              <th className="text-center">Ações</th>
            </tr></thead>
            <tbody>
              {filteredHoses.length===0 && <tr><td colSpan={13} className="text-center py-6 text-gray-400">Nenhum registro encontrado</td></tr>}
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
                    <td className="text-center">
                      <button
                        className="px-2 py-1 rounded hover:bg-gray-100 text-gray-500 font-bold text-base leading-none"
                        title="Ações"
                        onClick={(e) => openMenu('hose', h.id, `${h.equip} ${h.position}`, e)}
                      >⋮</button>
                    </td>
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
              <th className="text-center">Ações</th>
            </tr></thead>
            <tbody>
              {filteredFails.length===0 && <tr><td colSpan={10} className="text-center py-6 text-gray-400">Nenhuma ocorrência</td></tr>}
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
                  <td className="text-center">
                    <button
                      className="px-2 py-1 rounded hover:bg-gray-100 text-gray-500 font-bold text-base leading-none"
                      title="Ações"
                      onClick={(e) => openMenu('failure', f.id, `${f.equip} ${f.fail_date}`, e)}
                    >⋮</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown global via portal — não é cortado pelo overflow das tabelas */}
      {mounted && menu && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-[180px] text-left"
          style={{ left: Math.max(8, menu.x), top: menu.y }}
        >
          <button
            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium"
            onClick={() => menu.kind === 'hose' ? deleteHose(menu.id, menu.label) : deleteFailure(menu.id, menu.label)}
          >
            🗑️ Excluir registro
          </button>
          <button
            className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:bg-gray-50"
            onClick={() => setMenu(null)}
          >
            ✕ Cancelar
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

function SupBadge({ s }: { s: string }) {
  if (s==='SOTREQ') return <span className="badge badge-green">{s}</span>
  if (s==='TMH')    return <span className="badge badge-red">{s}</span>
  if (s==='—')      return <span>—</span>
  return <span className="badge badge-orange">{s}</span>
}
