'use client'
import { useEffect, useState } from 'react'
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
  const [hoses,        setHoses]        = useState<Hose[]>([])
  const [form,         setForm]         = useState<Partial<Hose>>(empty)
  const [otherSupplier,setOtherSupplier]= useState('')
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [msg,          setMsg]          = useState<{text:string;type:'ok'|'err'} | null>(null)

  useEffect(() => { load() }, [])

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
    setSaving(true)
    const payload = { ...form, supplier: finalSupplier, id: nextId(hoses), status: 'active' } as Hose
    const { error } = await supabase.from('hoses').insert(payload)
    if (error) { setMsg({ text: 'Erro: ' + error.message, type: 'err' }) }
    else { setMsg({ text: 'Mangueira cadastrada!', type: 'ok' }); setForm(empty); setOtherSupplier(''); load() }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  const active   = hoses.filter(h => h.status === 'active')
  const replaced = hoses.filter(h => h.status === 'replaced')

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-[#1a3a5c]">➕ Cadastro de Mangueiras</h1>

      {msg && <div className={`alert ${msg.type === 'ok' ? 'alert-success' : 'alert-danger'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-title">Nova Mangueira Instalada</div>
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

            {/* Equipamento – campo livre */}
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

            <div>
              <label className="lbl">Posição / Local *</label>
              <input className="inp" required placeholder="Ex: Cil. Direção L/D" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
            </div>

            {/* Fornecedor – TMH / SOTREQ / Outro */}
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
          <div className="card">
            <div className="card-title">🟢 Mangueiras Ativas ({active.length})</div>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="tbl w-full min-w-[600px]">
                <thead>
                  <tr><th>ID</th><th>Equipamento</th><th>Sistema</th><th>Posição</th><th>Fornecedor</th><th>Tipo</th><th>Custo</th><th>Instalação</th><th>Horímetro</th></tr>
                </thead>
                <tbody>
                  {active.length === 0 && <tr><td colSpan={9} className="text-center py-6 text-gray-400">Nenhuma mangueira ativa cadastrada</td></tr>}
                  {active.map(h => (
                    <tr key={h.id}>
                      <td><span className="badge badge-blue">{h.id}</span></td>
                      <td className="font-bold">{h.equip}</td>
                      <td>{h.system}</td>
                      <td>{h.position}</td>
                      <td><SupplierBadge s={h.supplier} /></td>
                      <td>{h.hose_type?.includes('Genuína') ? <span className="badge badge-blue">{h.hose_type}</span> : <span className="badge badge-gray">{h.hose_type}</span>}</td>
                      <td>{fmt(h.unit_cost)}</td>
                      <td>{h.install_date ?? '—'}</td>
                      <td>{h.install_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🔄 Mangueiras Substituídas ({replaced.length})</div>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="tbl w-full min-w-[500px]">
                <thead>
                  <tr><th>ID</th><th>Equipamento</th><th>Sistema</th><th>Posição</th><th>Fornecedor</th><th>Custo</th><th>Instalação</th></tr>
                </thead>
                <tbody>
                  {replaced.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-gray-400">Nenhuma</td></tr>}
                  {replaced.map(h => (
                    <tr key={h.id} className="opacity-60">
                      <td><span className="badge badge-gray">{h.id}</span></td>
                      <td className="font-bold">{h.equip}</td>
                      <td>{h.system}</td>
                      <td>{h.position}</td>
                      <td><SupplierBadge s={h.supplier} /></td>
                      <td>{fmt(h.unit_cost)}</td>
                      <td>{h.install_date ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
