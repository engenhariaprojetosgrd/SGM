export interface Hose {
  id: string
  equip: string
  system: string
  position: string
  supplier: string
  hose_type?: string
  part_number?: string
  unit_cost: number
  install_date?: string
  install_hours: number
  expected_life?: number
  notes?: string
  status: 'active' | 'replaced'
  created_at?: string
}

export interface Failure {
  id: string
  hose_id?: string
  equip: string
  system?: string
  position?: string
  supplier_orig?: string
  fail_date?: string
  fail_hours?: number
  mtbf?: number
  fail_type?: string
  downtime: number
  root_cause?: string
  new_supplier?: string
  new_cost?: number
  notes?: string
  created_at?: string
  hose?: Hose
}

export interface AppConfig {
  id: number
  machine_cost_per_hour: number
  labor_cost_per_hour: number
  labor_hours_install: number
  fleet_name: string
}

export interface SupplierStats {
  name: string
  count: number
  avgCost: number
  avgMTBF: number
  avgDowntime: number
  matPerH: number
  labPerH: number
  dtPerH: number
  tco: number
  laborCost: number
}

export const EQUIPMENT_LIST = ['MM8301','MM8302','MM8303','MM8201','MM8202','MM7401']
export const SYSTEM_LIST = [
  'Sistema Hidráulico','Sistema de Direção','Sistema de Implementos',
  'Sistema de Lubrificação','Sistema de Arrefecimento','Sistema de Freio'
]
export const SUPPLIER_LIST = ['SOTREQ','TMH','HC Hidráulica']
export const HOSE_TYPES = ['Genuína (OEM)','Alternativa','Recondicionada']
export const FAIL_TYPES = ['Estouro','Vazamento','Desgaste','Trinca','Conexão Solta','Abrasão Externa','Falha de Terminal']
export const ROOT_CAUSES = [
  'Baixa qualidade do material','Pressão acima do nominal','Abrasão por contato',
  'Montagem incorreta','Desgaste natural','Contaminação do fluido','Vibração excessiva','A investigar'
]
