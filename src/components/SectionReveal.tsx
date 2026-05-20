import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ReactNode } from 'react'

gsap.registerPlugin(ScrollTrigger)

interface SectionRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  stagger?: number
  selector?: string
}

export default function SectionReveal({
  children,
  className = '',
  delay = 0,
  y = 30,
  stagger = 0.1,
  selector,
}: SectionRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!containerRef.current) return
      const targets = selector
        ? containerRef.current.querySelectorAll(selector)
        : containerRef.current.children

      if (!targets.length) return

      // fromTo + clearProps → si ScrollTrigger no se dispara, los elementos
      // NUNCA se quedan en opacity:0. Bug que dejaba secciones invisibles.
      gsap.fromTo(
        targets,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger,
          delay,
          clearProps: 'transform',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 95%',
            once: true,
          },
        },
      )
    },
    { scope: containerRef },
  )

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
