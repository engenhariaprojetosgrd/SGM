'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AppConfig } from '@/types'

const defaults: AppConfig = { id:1, machine_cost_per_hour:800, labor_cost_per_hour:45, labor_hours_install:1.5, fleet_name:'MRN – Motoniveladora' }

export default function ConfigPage() {
  const [cfg,    setCfg]    = useState<AppConfig>(defaults)
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState<{text:string;type:'ok'|'err'} | null>(null)

  useEffect(() => {
    supabase.from('app_config').select('*').eq('id',1).single()
      .then(({ data }) => { if (data) setCfg(data) })
  }, [])

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('app_config').upsert({ ...cfg, id:1, updated_at: new Date().toISOString() })
    setMsg(error ? { text:'Erro: '+error.message, type:'err' } : { text:'Configurações salvas!', type:'ok' })
    setSaving(false)
    setTimeout(()=>setMsg(null),3000)
  }

  const laborCost = cfg.labor_cost_per_hour * cfg.labor_hours_install

  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="text-lg font-bold text-[#1a3a5c]">⚙️ Configurações</h1>
      {msg && <div className={`alert ${msg.type==='ok'?'alert-success':'alert-danger'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-title">💰 Parâmetros de Custo</div>
        <div className="text-xs text-gray-500 mb-4">Estes valores são usados para calcular o TCO e o custo real de cada fornecedor.</div>
        <div className="space-y-4">
          <div>
            <label className="lbl">Custo Hora Máquina Parada (R$/h)</label>
            <input className="inp" type="number" min="0" step="10" value={cfg.machine_cost_per_hour} onChange={e=>setCfg(p=>({...p,machine_cost_per_hour:parseFloat(e.target.value)||0}))}/>
            <p className="text-xs text-gray-400 mt-1">Perda total por hora de equipamento fora de operação (produção + aluguel + impacto operacional)</p>
          </div>
          <div>
            <label className="lbl">Custo Hora Mão de Obra (R$/h)</label>
            <input className="inp" type="number" min="0" step="5" value={cfg.labor_cost_per_hour} onChange={e=>setCfg(p=>({...p,labor_cost_per_hour:parseFloat(e.target.value)||0}))}/>
          </div>
          <div>
            <label className="lbl">Horas Médias por Instalação (h)</label>
            <input className="inp" type="number" min="0" step="0.25" value={cfg.labor_hours_install} onChange={e=>setCfg(p=>({...p,labor_hours_install:parseFloat(e.target.value)||0}))}/>
          </div>
          <div>
            <label className="lbl">Nome da Frota / Empresa</label>
            <input className="inp" type="text" value={cfg.fleet_name} onChange={e=>setCfg(p=>({...p,fleet_name:e.target.value}))}/>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
          <strong>Custo de MO por instalação:</strong> {cfg.labor_cost_per_hour.toFixed(0)} R$/h × {cfg.labor_hours_install.toFixed(1)}h = <strong>R$ {laborCost.toFixed(2)}</strong>
        </div>

        <div className="mt-4">
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Salvando...':'✓ Salvar Configurações'}</button>
        </div>
      </div>

      <div className="card border-red-200">
        <div className="card-title text-red-600">⚠️ Zona de Perigo</div>
        <p className="text-xs text-gray-500 mb-3">Atenção: ações irreversíveis abaixo.</p>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-outline btn-sm" onClick={async()=>{
            if(!confirm('Restaurar dados de demonstração?')) return
            const res = await fetch('/api/seed', { method:'POST' })
            if(res.ok) setMsg({text:'Dados de demonstração restaurados!',type:'ok'})
            else setMsg({text:'Erro ao restaurar dados',type:'err'})
            setTimeout(()=>setMsg(null),3000)
          }}>🔄 Restaurar dados de demonstração</button>
        </div>
      </div>
    </div>
  )
}
