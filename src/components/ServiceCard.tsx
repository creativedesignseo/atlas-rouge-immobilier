import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

interface ServiceCardProps {
  icon: ReactNode
  title: string
  description: string
  /** Si se provee, la card se vuelve clicable y navega a esta ruta. */
  to?: string
}

const baseClasses =
  'group block bg-white rounded-card p-8 border border-border-warm shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250'

export default function ServiceCard({ icon, title, description, to }: ServiceCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 text-terracotta">{icon}</div>
        {to && (
          <ArrowUpRight
            size={20}
            className="text-text-secondary group-hover:text-terracotta group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
          />
        )}
      </div>
      <h3 className="font-display text-[20px] font-semibold text-text-primary mb-2 group-hover:text-terracotta transition-colors">
        {title}
      </h3>
      <p className="text-text-secondary text-[14px] font-inter leading-relaxed">
        {description}
      </p>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={baseClasses}>
        {content}
      </Link>
    )
  }

  return <div className={baseClasses}>{content}</div>
}
