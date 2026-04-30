import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const hoses = [
    {id:'H001',equip:'MM8302',system:'Sistema Hidráulico',position:'Cil. Direção L/D',supplier:'SOTREQ',hose_type:'Genuína (OEM)',part_number:'CAT-7J8836',unit_cost:450,install_date:'2025-01-10',install_hours:4820,expected_life:2000,notes:'Mangueira alta pressão genuína CAT',status:'replaced'},
    {id:'H002',equip:'MM8302',system:'Sistema Hidráulico',position:'Cil. Lâmina L/E',supplier:'TMH',hose_type:'Alternativa',part_number:'TMH-8302-02',unit_cost:180,install_date:'2025-02-01',install_hours:5100,expected_life:1500,notes:'',status:'replaced'},
    {id:'H003',equip:'MM8202',system:'Sistema de Direção',position:'Cil. Direção L/E',supplier:'TMH',hose_type:'Alternativa',part_number:'TMH-8202-01',unit_cost:180,install_date:'2025-01-15',install_hours:3200,expected_life:1500,notes:'',status:'replaced'},
    {id:'H004',equip:'MM8202',system:'Sistema Hidráulico',position:'Cil. Implemento Dianteiro',supplier:'SOTREQ',hose_type:'Genuína (OEM)',part_number:'CAT-8202-04',unit_cost:380,install_date:'2025-03-10',install_hours:3800,expected_life:2000,notes:'',status:'replaced'},
    {id:'H005',equip:'MM8201',system:'Sistema Hidráulico',position:'Cil. Escarificador Traseiro',supplier:'TMH',hose_type:'Alternativa',part_number:'TMH-8201-05',unit_cost:210,install_date:'2025-03-01',install_hours:6100,expected_life:1500,notes:'Terminal diferente do especificado',status:'replaced'},
    {id:'H006',equip:'MM8301',system:'Sistema Hidráulico',position:'Cil. Direção L/D',supplier:'SOTREQ',hose_type:'Genuína (OEM)',part_number:'CAT-7J8836',unit_cost:450,install_date:'2025-04-20',install_hours:2100,expected_life:2000,notes:'',status:'active'},
    {id:'H007',equip:'MM8303',system:'Sistema Hidráulico',position:'Cil. Lâmina Niveladora',supplier:'HC Hidráulica',hose_type:'Alternativa',part_number:'HC-83-07',unit_cost:250,install_date:'2025-05-01',install_hours:4500,expected_life:1200,notes:'',status:'replaced'},
    {id:'H008',equip:'MM8302',system:'Sistema Hidráulico',position:'Cil. Implemento L/E',supplier:'TMH',hose_type:'Alternativa',part_number:'TMH-8302-08',unit_cost:190,install_date:'2025-06-01',install_hours:6900,expected_life:1500,notes:'',status:'replaced'},
    {id:'H009',equip:'MM8202',system:'Sistema Hidráulico',position:'Cil. Escarificador',supplier:'SOTREQ',hose_type:'Genuína (OEM)',part_number:'CAT-8202-09',unit_cost:520,install_date:'2025-06-15',install_hours:4200,expected_life:2000,notes:'',status:'active'},
    {id:'H010',equip:'MM8201',system:'Sistema de Direção',position:'Cil. Direção L/D',supplier:'HC Hidráulica',hose_type:'Alternativa',part_number:'HC-82-10',unit_cost:260,install_date:'2025-07-01',install_hours:6600,expected_life:1200,notes:'',status:'active'},
    {id:'H011',equip:'MM8303',system:'Sistema Hidráulico',position:'Cil. Nivelamento Vertical',supplier:'TMH',hose_type:'Alternativa',part_number:'TMH-8303-11',unit_cost:160,install_date:'2025-08-01',install_hours:4900,expected_life:1500,notes:'Dimensão diferente do especificado',status:'replaced'},
    {id:'H012',equip:'MM8302',system:'Sistema de Direção',position:'Cil. Direção R/D',supplier:'TMH',hose_type:'Alternativa',part_number:'TMH-8302-12',unit_cost:180,install_date:'2025-10-01',install_hours:7850,expected_life:1500,notes:'',status:'replaced'},
    {id:'H013',equip:'MM8301',system:'Sistema Hidráulico',position:'Cil. Lâmina Dianteiro',supplier:'SOTREQ',hose_type:'Genuína (OEM)',part_number:'CAT-8301-13',unit_cost:410,install_date:'2025-09-01',install_hours:2400,expected_life:2000,notes:'',status:'active'},
    {id:'H014',equip:'MM8201',system:'Sistema Hidráulico',position:'Cil. Implemento Traseiro',supplier:'HC Hidráulica',hose_type:'Alternativa',part_number:'HC-82-14',unit_cost:240,install_date:'2025-10-01',install_hours:7100,expected_life:1200,notes:'',status:'active'},
  ]

  const failures = [
    {id:'F001',hose_id:'H001',equip:'MM8302',system:'Sistema Hidráulico',position:'Cil. Direção L/D',supplier_orig:'SOTREQ',fail_date:'2025-09-27',fail_hours:6820,mtbf:2000,fail_type:'Desgaste',downtime:3.26,root_cause:'Desgaste natural',new_supplier:'SOTREQ',new_cost:450,notes:'Substituição por desgaste natural ao final da vida útil'},
    {id:'F002',hose_id:'H002',equip:'MM8302',system:'Sistema Hidráulico',position:'Cil. Lâmina L/E',supplier_orig:'TMH',fail_date:'2025-03-05',fail_hours:5700,mtbf:600,fail_type:'Estouro',downtime:8.74,root_cause:'Baixa qualidade do material',new_supplier:'SOTREQ',new_cost:450,notes:'Mangueira estourou em plena operação. 8.74h parado'},
    {id:'F003',hose_id:'H003',equip:'MM8202',system:'Sistema de Direção',position:'Cil. Direção L/E',supplier_orig:'TMH',fail_date:'2025-02-03',fail_hours:3650,mtbf:450,fail_type:'Estouro',downtime:11.14,root_cause:'Baixa qualidade do material',new_supplier:'TMH',new_cost:180,notes:'Estouro no cil. de direção. 13 mangueiras erradas no 1º pedido'},
    {id:'F004',hose_id:'H004',equip:'MM8202',system:'Sistema Hidráulico',position:'Cil. Implemento Dianteiro',supplier_orig:'SOTREQ',fail_date:'2025-08-15',fail_hours:5600,mtbf:1800,fail_type:'Vazamento',downtime:2.0,root_cause:'Desgaste natural',new_supplier:'SOTREQ',new_cost:380,notes:'Vazamento lento. Identificado em inspeção preventiva'},
    {id:'F005',hose_id:'H005',equip:'MM8201',system:'Sistema Hidráulico',position:'Cil. Escarificador Traseiro',supplier_orig:'TMH',fail_date:'2025-04-17',fail_hours:6420,mtbf:320,fail_type:'Estouro',downtime:1.69,root_cause:'Montagem incorreta',new_supplier:'SOTREQ',new_cost:410,notes:'Terminal não compatível. Falha precoce'},
    {id:'F006',hose_id:'H007',equip:'MM8303',system:'Sistema Hidráulico',position:'Cil. Lâmina Niveladora',supplier_orig:'HC Hidráulica',fail_date:'2025-07-10',fail_hours:5300,mtbf:800,fail_type:'Estouro',downtime:4.0,root_cause:'Abrasão por contato',new_supplier:'HC Hidráulica',new_cost:250,notes:'Abrasão no ponto de passagem'},
    {id:'F007',hose_id:'H008',equip:'MM8302',system:'Sistema Hidráulico',position:'Cil. Implemento L/E',supplier_orig:'TMH',fail_date:'2025-09-10',fail_hours:7800,mtbf:900,fail_type:'Vazamento',downtime:3.5,root_cause:'Baixa qualidade do material',new_supplier:'SOTREQ',new_cost:450,notes:'Vazamento no fitting. 2º pedido TMH: 11 de 11 erradas'},
    {id:'F008',hose_id:'H011',equip:'MM8303',system:'Sistema Hidráulico',position:'Cil. Nivelamento Vertical',supplier_orig:'TMH',fail_date:'2025-09-15',fail_hours:5300,mtbf:400,fail_type:'Estouro',downtime:5.2,root_cause:'Baixa qualidade do material',new_supplier:'SOTREQ',new_cost:410,notes:'Estouro precoce. Dimensão incorreta'},
    {id:'F009',hose_id:'H012',equip:'MM8302',system:'Sistema de Direção',position:'Cil. Direção R/D',supplier_orig:'TMH',fail_date:'2025-11-10',fail_hours:8450,mtbf:600,fail_type:'Estouro',downtime:3.9,root_cause:'Baixa qualidade do material',new_supplier:'SOTREQ',new_cost:450,notes:'3ª falha TMH no MM8302 em 11 meses'},
  ]

  await supabase.from('hoses').delete().neq('id','__none__')
  await supabase.from('failures').delete().neq('id','__none__')
  const { error: e1 } = await supabase.from('hoses').insert(hoses)
  const { error: e2 } = await supabase.from('failures').insert(failures)

  if (e1 || e2) return NextResponse.json({ error: e1?.message ?? e2?.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
