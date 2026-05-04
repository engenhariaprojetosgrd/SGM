'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Hose, Failure } from '@/types'
import { FAIL_TYPES, ROOT_CAUSES } from '@/types'
import { fmt, fmtN } from '@/lib/calculations'

const SUPPLIERS = ['SOTREQ', 'TMH', 'Outro']

const emptyForm = {
  equip: '', hose_id: '',
  fail_date: new Date().toISOString().split('T')[0],
  fail_hours: 0, fail_type: '', downtime: 0, root_cause: '',
  new_supplier: 'SOTREQ', new_cost: 0, notes: ''
}

export default function OcorrenciasPage() {
  const [hoses,        setHoses]        = useState<Hose[]>([])
  const [failures,     setFailures]     = useState<Failure[]>([])
  const [form,         setForm]         = useState({ ...emptyForm })
  const [otherSupplier,setOtherSupplier]= useState('')
  const [mtbfPrev,     setMtbfPrev]     = useState<number | null>(null)
  const [earlyAlert,   setEarlyAlert]   = useState('')
  const [saving,       setSaving]       = useState(false)
  const [msg,          setMsg]          = useState<{text:string;type:'ok'|'err'} | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: h }, { data: f }] = await Promise.all([
      supabase.from('hoses').select('*').eq('status', 'active'),
      supabase.from('failures').select('*').order('fail_date', { ascending: false }).limit(20),
    ])
    setHoses(h ?? [])
    setFailures(f ?? [])
  }

  // Equipamentos únicos com mangueiras ativas cadastradas
  const equipmentOptions = Array.from(new Set(hoses.map(h => h.equip))).sort()
  const activeForEquip   = hoses.filter(h => h.equip === form.equip)

  function onHoursChange(val: number) {
    setForm(p => ({ ...p, fail_hours: val }))
    const hose = hoses.find(h => h.id === form.hose_id)
    if (!hose || !val) { setMtbfPrev(null); setEarlyAlert(''); return }
    const mtbf = val - hose.install_hours
    if (mtbf <= 0) { setMtbfPrev(null); return }
    setMtbfPrev(mtbf)
    if (hose.expected_life && mtbf < hose.expected_life * 0.6) {
      setEarlyAlert(`⚠️ Falha precoce: ${hose.supplier} atingiu apenas ${Math.round(mtbf / hose.expected_life * 100)}% da vida útil esperada (${hose.expected_life}h).`)
    } else setEarlyAlert('')
  }

  function nextId(failures: Failure[]) {
    const nums = failures.map(f => parseInt(f.id.replace('F', ''))).filter(Boolean)
    return 'F' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const hose = hoses.find(h => h.id === form.hose_id)
    if (!hose) { setMsg({ text: 'Selecione uma mangueira válida', type: 'err' }); return }
    const mtbf = form.fail_hours - hose.install_hours
    if (mtbf <= 0) { setMsg({ text: 'Horímetro da falha deve ser maior que o da instalação', type: 'err' }); return }

    const finalSupplier = form.new_supplier === 'Outro' ? otherSupplier.trim() : form.new_supplier
    if (!finalSupplier) { setMsg({ text: 'Informe o fornecedor da substituição', type: 'err' }); return }

    setSaving(true)
    const allFails = (await supabase.from('failures').select('id')).data ?? []
    const payload: Partial<Failure> = {
      id: nextId(allFails as Failure[]),
      hose_id: form.hose_id,
      equip: hose.equip,
      system: hose.system,
      position: hose.position,
      supplier_orig: hose.supplier,
      fail_date: form.fail_date,
      fail_hours: form.fail_hours,
      mtbf,
      fail_type: form.fail_type,
      downtime: form.downtime,
      root_cause: form.root_cause,
      new_supplier: finalSupplier,
      new_cost: form.new_cost,
      notes: form.notes,
    }
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('failures').insert(payload),
      supabase.from('hoses').update({ status: 'replaced' }).eq('id', hose.id),
    ])
    if (e1 || e2) { setMsg({ text: 'Erro: ' + (e1?.message ?? e2?.message), type: 'err' }) }
    else {
      setMsg({ text: 'Ocorrência registrada!', type: 'ok' })
      setForm({ ...emptyForm })
      setOtherSupplier('')
      setMtbfPrev(null)
      setEarlyAlert('')
      load()
    }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  const machineCost = 800

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-[#1a3a5c]">⚠️ Registrar Ocorrência / Substituição</h1>
      {msg && <div className={`alert ${msg.type === 'ok' ? 'alert-success' : 'alert-danger'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-title">Nova Ocorrência</div>
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

            {/* Equipamento — lista dos que têm mangueiras cadastradas */}
            <div>
              <label className="lbl">Equipamento *</label>
              {equipmentOptions.length === 0 ? (
                <div className="inp bg-gray-50 text-gray-400 text-xs flex items-center">
                  Nenhuma mangueira cadastrada ainda
                </div>
              ) : (
                <select
                  className="inp" required
                  value={form.equip}
                  onChange={e => setForm(p => ({ ...p, equip: e.target.value, hose_id: '' }))}
                >
                  <option value="">Selecionar equipamento...</option>
                  {equipmentOptions.map(eq => <option key={eq}>{eq}</option>)}
                </select>
              )}
            </div>

            <div className="sm:col-span-1 md:col-span-2">
              <label className="lbl">Mangueira Afetada *</label>
              <select
                className="inp" required
                value={form.hose_id}
                onChange={e => setForm(p => ({ ...p, hose_id: e.target.value }))}
              >
                <option value="">{form.equip ? 'Selecione a mangueira...' : '← Selecione o equipamento primeiro'}</option>
                {activeForEquip.map(h => (
                  <option key={h.id} value={h.id}>
                    [{h.id}] {h.system} – {h.position} ({h.supplier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="lbl">Data da Falha *</label>
              <input className="inp" type="date" required value={form.fail_date} onChange={e => setForm(p => ({ ...p, fail_date: e.target.value }))} />
            </div>

            <div>
              <label className="lbl">Horímetro na Falha (h) *</label>
              <input className="inp" type="number" min="0" required value={form.fail_hours || ''} onChange={e => onHoursChange(parseFloat(e.target.value) || 0)} />
            </div>

            <div>
              <label className="lbl">MTBF Calculado</label>
              <input className="inp bg-slate-50 font-bold text-[#1a3a5c]" readOnly value={mtbfPrev !== null ? fmtN(mtbfPrev) + 'h' : '—'} />
            </div>

            <div>
              <label className="lbl">Tipo de Falha *</label>
              <select className="inp" required value={form.fail_type} onChange={e => setForm(p => ({ ...p, fail_type: e.target.value }))}>
                <option value="">Selecionar...</option>
                {FAIL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="lbl">Horas de Equipamento Parado *</label>
              <input className="inp" type="number" min="0" step="0.01" required value={form.downtime || ''} onChange={e => setForm(p => ({ ...p, downtime: parseFloat(e.target.value) || 0 }))} />
            </div>

            <div>
              <label className="lbl">Custo de Parada Estimado</label>
              <input className="inp bg-red-50 text-red-700 font-bold" readOnly value={form.downtime > 0 ? fmt(form.downtime * machineCost, 0) : '—'} />
            </div>

            <div>
              <label className="lbl">Causa Raiz</label>
              <select className="inp" value={form.root_cause} onChange={e => setForm(p => ({ ...p, root_cause: e.target.value }))}>
                <option value="">Selecionar...</option>
                {ROOT_CAUSES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Fornecedor da substituição */}
            <div>
              <label className="lbl">Fornecedor da Substituição</label>
              <select className="inp" value={form.new_supplier} onChange={e => setForm(p => ({ ...p, new_supplier: e.target.value }))}>
                {SUPPLIERS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {form.new_supplier === 'Outro' && (
              <div>
                <label className="lbl">Nome do Fornecedor *</label>
                <input className="inp" required placeholder="Informe o fornecedor" value={otherSupplier} onChange={e => setOtherSupplier(e.target.value)} />
              </div>
            )}

            <div>
              <label className="lbl">Custo da Nova Mangueira (R$)</label>
              <input className="inp" type="number" min="0" step="0.01" value={form.new_cost || ''} onChange={e => setForm(p => ({ ...p, new_cost: parseFloat(e.target.value) || 0 }))} />
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-3">
              <label className="lbl">Observações / Análise</label>
              <textarea className="inp h-16 resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          {earlyAlert && <div className="alert alert-warning mt-3">{earlyAlert}</div>}

          <div className="mt-4">
            <button className="btn btn-primary w-full sm:w-auto" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : '✓ Registrar Ocorrência'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">📋 Últimas Ocorrências Registradas</div>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="tbl w-full min-w-[600px]">
            <thead>
              <tr><th>Data</th><th>Equipamento</th><th>Posição</th><th>Fornecedor</th><th>Tipo</th><th>MTBF</th><th>Downtime</th><th>Custo Parada</th></tr>
            </thead>
            <tbody>
              {failures.length === 0 && <tr><td colSpan={8} className="text-center py-6 text-gray-400">Nenhuma ocorrência registrada</td></tr>}
              {failures.map(f => (
                <tr key={f.id}>
                  <td>{f.fail_date}</td>
                  <td className="font-bold">{f.equip}</td>
                  <td>{f.position}</td>
                  <td>{f.supplier_orig ? <span className={`badge ${f.supplier_orig === 'SOTREQ' ? 'badge-green' : f.supplier_orig === 'TMH' ? 'badge-red' : 'badge-orange'}`}>{f.supplier_orig}</span> : '—'}</td>
                  <td><span className={`badge ${f.fail_type === 'Estouro' ? 'badge-red' : f.fail_type === 'Vazamento' ? 'badge-orange' : 'badge-gray'}`}>{f.fail_type ?? '—'}</span></td>
                  <td className="font-bold">{f.mtbf != null ? fmtN(f.mtbf) + 'h' : '—'}</td>
                  <td>{f.downtime?.toFixed(1)}h</td>
                  <td className="text-red-600 font-bold">{fmt((f.downtime ?? 0) * machineCost, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
