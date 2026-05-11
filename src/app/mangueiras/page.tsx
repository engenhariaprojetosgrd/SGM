'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Hose } from '@/types'
import { SYSTEM_LIST, HOSE_TYPES } from '@/types'
import { fmt } from '@/lib/calculations'

const SUPPLIERS = ['SOTREQ', 'TMH', 'Outro']

const empty: Partial<Hose> = {
  equip: '', system: '', position: '', supplier: 'SOTREQ',
  hose_type: 'Genuína (OEM)', part_number: '', unit_cost: 0,
  install_hours: 0, notes: '', status: 'active'
}

export default function MangueirasPage() {
  const [hoses,         setHoses]         = useState<Hose[]>([])
  const [form,          setForm]          = useState<Partial<Hose>>(empty)
  const [otherSupplier, setOtherSupplier] = useState('')
  const [otherSystem,   setOtherSystem]   = useState('')
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [msg,           setMsg]           = useState<{text:string;type:'ok'|'err'} | null>(null)
  const [menuOpen,      setMenuOpen]      = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [])

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function load() {
    const { data } = await supabase.from('hoses').select('*').order('created_at', { ascending: false })
    setHoses(data ?? [])
    setLoading(false)
  }

  function nextId(hoses: Hose[]) {
    const nums = hoses.map(h => parseInt(h.id.replace('H', ''))).filter(Boolean)
    return 'H' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const finalSupplier = form.supplier === 'Outro' ? otherSupplier.trim() : form.supplier
    if (!finalSupplier) { setMsg({ text: 'Informe o nome do fornecedor', type: 'err' }); return }
    const finalSystem = form.system === 'Outro' ? otherSystem.trim() : form.system
    if (!finalSystem) { setMsg({ text: 'Informe o sistema', type: 'err' }); return }
    setSaving(true)
    const payload = {
      ...form,
      supplier: finalSupplier,
      system: finalSystem,
      id: nextId(hoses),
      status: 'active'
    } as Hose
    const { error } = await supabase.from('hoses').insert(payload)
    if (error) { setMsg({ text: 'Erro: ' + error.message, type: 'err' }) }
    else { setMsg({ text: 'Mangueira cadastrada!', type: 'ok' }); setForm(empty); setOtherSupplier(''); setOtherSystem(''); load() }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  async function deleteHose(id: string, equip: string) {
    setMenuOpen(null)
    if (!confirm(
      `Excluir DEFINITIVAMENTE a mangueira ${id} (${equip})?\n\n` +
      `Esta ação NÃO pode ser desfeita. Ocorrências vinculadas a essa mangueira ` +
      `ficarão sem referência (mas o histórico delas será mantido).\n\n` +
      `Deseja continuar?`
    )) return
    const { error } = await supabase.from('hoses').delete().eq('id', id)
    if (error) { setMsg({ text: 'Erro ao excluir: ' + error.message, type: 'err' }) }
    else { setMsg({ text: `Mangueira ${id} excluída.`, type: 'ok' }); load() }
    setTimeout(() => setMsg(null), 4000)
  }

  const active   = hoses.filter(h => h.status === 'active')
  const replaced = hoses.filter(h => h.status === 'replaced')
  const archived = hoses.filter(h => h.status === 'archived')

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-[#1a3a5c]">➕ Cadastro de Mangueiras</h1>

      {msg && <div className={`alert ${msg.type === 'ok' ? 'alert-success' : 'alert-danger'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-title">Nova Mangueira Instalada</div>
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

            <div>
              <label className="lbl">Equipamento * <span className="text-gray-400 font-normal">(TAG)</span></label>
              <input
                className="inp" required
                placeholder="Ex: MM8302, PA4501..."
                value={form.equip}
                onChange={e => setForm(p => ({ ...p, equip: e.target.value.toUpperCase() }))}
              />
            </div>

            <div>
              <label className="lbl">Sistema *</label>
              <select className="inp" required value={form.system} onChange={e => setForm(p => ({ ...p, system: e.target.value }))}>
                <option value="">Selecionar...</option>
                {SYSTEM_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {form.system === 'Outro' && (
              <div>
                <label className="lbl">Nome do Sistema *</label>
                <input
                  className="inp" required
                  placeholder="Ex: Sistema de Suspensão"
                  value={otherSystem}
                  onChange={e => setOtherSystem(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="lbl">Posição / Local *</label>
              <input className="inp" required placeholder="Ex: Cil. Direção L/D" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
            </div>

            <div>
              <label className="lbl">Fornecedor *</label>
              <select className="inp" required value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}>
                {SUPPLIERS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {form.supplier === 'Outro' && (
              <div>
                <label className="lbl">Nome do Fornecedor *</label>
                <input className="inp" required placeholder="Informe o fornecedor" value={otherSupplier} onChange={e => setOtherSupplier(e.target.value)} />
              </div>
            )}

            <div>
              <label className="lbl">Tipo</label>
              <select className="inp" value={form.hose_type} onChange={e => setForm(p => ({ ...p, hose_type: e.target.value }))}>
                {HOSE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="lbl">Nº Peça / Código</label>
              <input className="inp" placeholder="Ex: CAT-7J8836" value={form.part_number} onChange={e => setForm(p => ({ ...p, part_number: e.target.value }))} />
            </div>

            <div>
              <label className="lbl">Custo Unitário (R$) *</label>
              <input className="inp" type="number" min="0" step="0.01" required value={form.unit_cost || ''} onChange={e => setForm(p => ({ ...p, unit_cost: parseFloat(e.target.value) || 0 }))} />
            </div>

            <div>
              <label className="lbl">Data de Instalação</label>
              <input className="inp" type="date" value={form.install_date ?? ''} onChange={e => setForm(p => ({ ...p, install_date: e.target.value }))} />
            </div>

            <div>
              <label className="lbl">Horímetro na Instalação (h) *</label>
              <input className="inp" type="number" min="0" required value={form.install_hours || ''} onChange={e => setForm(p => ({ ...p, install_hours: parseFloat(e.target.value) || 0 }))} />
            </div>

            <div>
              <label className="lbl">Vida Útil Esperada (h)</label>
              <input className="inp" type="number" min="0" placeholder="Ex: 2000" value={form.expected_life ?? ''} onChange={e => setForm(p => ({ ...p, expected_life: parseInt(e.target.value) || undefined }))} />
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-3">
              <label className="lbl">Observações</label>
              <textarea className="inp h-16 resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <div className="mt-4">
            <button className="btn btn-primary w-full sm:w-auto" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : '✓ Cadastrar Mangueira'}
            </button>
          </div>
        </form>
      </div>

      {loading ? <div className="text-center py-8 text-gray-400">Carregando...</div> : (
        <>
          {/* Mangueiras Ativas */}
          <div className="card">
            <div className="card-title">🟢 Mangueiras Ativas ({active.length})</div>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="tbl w-full min-w-[640px]">
                <thead>
                  <tr>
                    <th>ID</th><th>Equipamento</th><th>Sistema</th><th>Posição</th>
                    <th>Fornecedor</th><th>Tipo</th><th>Custo</th><th>Instalação</th><th>Horímetro</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {active.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-6 text-gray-400">Nenhuma mangueira ativa cadastrada</td></tr>
                  )}
                  {active.map(h => (
                    <tr key={h.id}>
                      <td><span className="badge badge-blue">{h.id}</span></td>
                      <td className="font-bold">{h.equip}</td>
                      <td>{h.system}</td>
                      <td>{h.position}</td>
                      <td><SupplierBadge s={h.supplier} /></td>
                      <td>{h.hose_type?.includes('Genuína')
                        ? <span className="badge badge-blue">OEM</span>
                        : <span className="badge badge-gray">{h.hose_type}</span>}
                      </td>
                      <td>{fmt(h.unit_cost)}</td>
                      <td>{h.install_date ?? '—'}</td>
                      <td>{h.install_hours}h</td>
                      <td className="text-center relative" ref={menuOpen === h.id ? menuRef : null}>
                        <button
                          className="px-2 py-1 rounded hover:bg-gray-100 text-gray-500 font-bold text-base leading-none"
                          title="Ações"
                          onClick={() => setMenuOpen(prev => prev === h.id ? null : h.id)}
                        >⋮</button>
                        {menuOpen === h.id && (
                          <div className="absolute right-0 top-7 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[170px] text-left">
                            <button
                              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium"
                              onClick={() => deleteHose(h.id, h.equip)}
                            >
                              🗑️ Excluir registro
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:bg-gray-50"
                              onClick={() => setMenuOpen(null)}
                            >
                              ✕ Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mangueiras Substituídas — histórico para MTBF/TCO */}
          {replaced.length > 0 && (
            <div className="card">
              <div className="card-title">🔄 Mangueiras Substituídas ({replaced.length})
                <span className="text-xs font-normal text-gray-400 ml-2">— histórico usado nos cálculos de MTBF/TCO</span>
              </div>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="tbl w-full min-w-[640px]">
                  <thead>
                    <tr>
                      <th>ID</th><th>Equipamento</th><th>Sistema</th><th>Posição</th>
                      <th>Fornecedor</th><th>Custo</th><th>Instalação</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replaced.map(h => (
                      <tr key={h.id} className="opacity-60">
                        <td><span className="badge badge-gray">{h.id}</span></td>
                        <td className="font-bold">{h.equip}</td>
                        <td>{h.system}</td>
                        <td>{h.position}</td>
                        <td><SupplierBadge s={h.supplier} /></td>
                        <td>{fmt(h.unit_cost)}</td>
                        <td>{h.install_date ?? '—'}</td>
                        <td className="text-center relative" ref={menuOpen === h.id ? menuRef : null}>
                          <button
                            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-500 font-bold text-base leading-none"
                            title="Ações"
                            onClick={() => setMenuOpen(prev => prev === h.id ? null : h.id)}
                          >⋮</button>
                          {menuOpen === h.id && (
                            <div className="absolute right-0 top-7 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[170px] text-left">
                              <button
                                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium"
                                onClick={() => deleteHose(h.id, h.equip)}
                              >
                                🗑️ Excluir registro
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:bg-gray-50"
                                onClick={() => setMenuOpen(null)}
                              >
                                ✕ Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mangueiras Arquivadas — legado; só aparece se houver alguma; permite excluir */}
          {archived.length > 0 && (
            <div className="card">
              <div className="card-title">📦 Mangueiras Arquivadas ({archived.length})
                <span className="text-xs font-normal text-gray-400 ml-2">— legado; exclua para limpar do sistema</span>
              </div>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="tbl w-full min-w-[640px]">
                  <thead>
                    <tr>
                      <th>ID</th><th>Equipamento</th><th>Sistema</th><th>Posição</th>
                      <th>Fornecedor</th><th>Custo</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archived.map(h => (
                      <tr key={h.id} className="opacity-50">
                        <td><span className="badge badge-gray">{h.id}</span></td>
                        <td className="font-bold">{h.equip}</td>
                        <td>{h.system}</td>
                        <td>{h.position}</td>
                        <td><SupplierBadge s={h.supplier} /></td>
                        <td>{fmt(h.unit_cost)}</td>
                        <td className="text-center relative" ref={menuOpen === h.id ? menuRef : null}>
                          <button
                            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-500 font-bold text-base leading-none"
                            title="Ações"
                            onClick={() => setMenuOpen(prev => prev === h.id ? null : h.id)}
                          >⋮</button>
                          {menuOpen === h.id && (
                            <div className="absolute right-0 top-7 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[170px] text-left">
                              <button
                                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium"
                                onClick={() => deleteHose(h.id, h.equip)}
                              >
                                🗑️ Excluir registro
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:bg-gray-50"
                                onClick={() => setMenuOpen(null)}
                              >
                                ✕ Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SupplierBadge({ s }: { s: string }) {
  if (s === 'SOTREQ') return <span className="badge badge-green">{s}</span>
  if (s === 'TMH')    return <span className="badge badge-red">{s}</span>
  return <span className="badge badge-orange">{s}</span>
}
