import type { ReactNode } from 'react'

interface ServiceCardProps {
  icon: ReactNode
  title: string
  description: string
}

export default function ServiceCard({ icon, title, description }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-card p-8 border border-border-warm shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250">
      <div className="w-10 h-10 text-terracotta mb-4">{icon}</div>
      <h3 className="font-playfair text-[20px] font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-text-secondary text-[14px] font-inter leading-relaxed">
        {description}
      </p>
    </div>
  )
}
