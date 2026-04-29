import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'terracotta' | 'palm' | 'gold' | 'midnight'
}

const colorClasses = {
  terracotta: 'bg-terracotta/10 text-terracotta',
  palm: 'bg-palm/10 text-palm',
  gold: 'bg-gold/10 text-gold',
  midnight: 'bg-midnight/10 text-midnight',
}

export default function StatCard({ title, value, icon: Icon, color = 'terracotta' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}
