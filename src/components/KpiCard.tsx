interface KpiCardProps {
  value: string
  label: string
  sub?: string
  color?: 'blue' | 'red' | 'green' | 'orange' | 'purple'
  icon?: string
}

const colorMap: Record<string, string> = {
  blue:   'border-l-[#2e6da4] text-[#1a3a5c]',
  red:    'border-l-red-600   text-red-700',
  green:  'border-l-green-600 text-green-700',
  orange: 'border-l-orange-500 text-orange-700',
  purple: 'border-l-purple-600 text-purple-700',
}

export default function KpiCard({ value, label, sub, color = 'blue', icon }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-2xl font-bold leading-none ${colorMap[color].split(' ')[1]}`}>{value}</div>
          <div className="text-xs text-gray-500 mt-1.5 font-medium">{label}</div>
          {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
        </div>
        {icon && <span className="text-2xl opacity-60">{icon}</span>}
      </div>
    </div>
  )
}
