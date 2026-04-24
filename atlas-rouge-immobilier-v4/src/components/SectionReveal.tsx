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

      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger,
        delay,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: containerRef }
  )

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
