interface Props {
  value: string
  label: string
  sub?: string
  color?: 'green' | 'red' | 'orange' | 'purple'
  icon?: string
}

export default function KpiCard({ value, label, sub, color, icon }: Props) {
  return (
    <div className={`kpi${color ? ` kpi-${color}` : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xl sm:text-2xl font-bold text-[#1a3a5c] truncate">{value}</div>
          <div className="text-xs font-semibold text-gray-600 mt-0.5">{label}</div>
          {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
        </div>
        {icon && <div className="text-2xl shrink-0">{icon}</div>}
      </div>
    </div>
  )
}
