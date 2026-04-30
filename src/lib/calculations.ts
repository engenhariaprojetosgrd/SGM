import type { Hose, Failure, AppConfig, SupplierStats } from '@/types'

export function getSupplierStats(
  hoses: Hose[],
  failures: Failure[],
  config: AppConfig
): SupplierStats[] {
  const laborCost = config.labor_cost_per_hour * config.labor_hours_install
  const map: Record<string, { costs: number[]; mtbfs: number[]; downtimes: number[]; count: number }> = {}

  failures.forEach(f => {
    const hose = hoses.find(h => h.id === f.hose_id)
    const sup = hose?.supplier ?? f.supplier_orig ?? 'Desconhecido'
    if (!map[sup]) map[sup] = { costs: [], mtbfs: [], downtimes: [], count: 0 }
    if (hose) map[sup].costs.push(hose.unit_cost)
    map[sup].mtbfs.push(f.mtbf ?? 0)
    map[sup].downtimes.push(f.downtime)
    map[sup].count++
  })

  return Object.entries(map).map(([name, s]) => {
    const avgCost     = s.costs.length  ? avg(s.costs)     : 0
    const avgMTBF     = s.mtbfs.length  ? avg(s.mtbfs)     : 1
    const avgDowntime = s.downtimes.length ? avg(s.downtimes) : 0
    const matPerH = avgMTBF > 0 ? avgCost / avgMTBF      : 0
    const labPerH = avgMTBF > 0 ? laborCost / avgMTBF    : 0
    const dtPerH  = avgMTBF > 0 ? (avgDowntime * config.machine_cost_per_hour) / avgMTBF : 0
    return { name, count: s.count, avgCost, avgMTBF, avgDowntime, matPerH, labPerH, dtPerH, tco: matPerH+labPerH+dtPerH, laborCost }
  }).sort((a, b) => a.tco - b.tco)
}

export function calcRealCostComparison(
  stats: SupplierStats[],
  config: AppConfig,
  qty = 10
) {
  if (stats.length < 2) return null
  const best  = stats[0]
  const worst = stats[stats.length - 1]
  const laborCost = config.labor_cost_per_hour * config.labor_hours_install
  const opsHours   = qty * best.avgMTBF
  const qtyWorst   = opsHours / (worst.avgMTBF || 1)
  const costBest   = qty * (best.avgCost  + laborCost + best.avgDowntime  * config.machine_cost_per_hour)
  const costWorst  = qtyWorst * (worst.avgCost + laborCost + worst.avgDowntime * config.machine_cost_per_hour)
  const perceivedSave = (worst.avgCost - best.avgCost) * qty
  return { best, worst, opsHours, qty, qtyWorst, costBest, costWorst, perceivedSave, realDiff: costWorst - costBest }
}

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

export const fmt   = (n: number, dec = 2) => 'R$ ' + n.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export const fmtN  = (n: number, dec = 0) => n.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export const fmtH  = (n: number)         => fmtN(n, 0) + 'h'
