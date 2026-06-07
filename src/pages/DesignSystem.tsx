import { useState } from 'react'
import {
  Check, Minus, Plus, ChevronDown, ArrowRight, Search,
  SlidersHorizontal, Star, X, Phone, MessageCircle,
} from 'lucide-react'

/**
 * Internal design-system reference page (route: /design-system).
 *
 * Adapts the "Milray Park" editorial/pill design language to the Atlas Rouge
 * brand: cream background, serif display headings, TERRACOTTA as the primary
 * action (kept from the brand, not black), generous pill shapes. This is the
 * living spec we align the rest of the site to — it does not affect any
 * existing page.
 */

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-border-subtle p-6 md:p-7 ${className}`}>
      <p className="text-[12px] font-inter font-medium uppercase tracking-[1.5px] text-text-secondary mb-5">{title}</p>
      {children}
    </div>
  )
}

function Swatch({ name, hex, text = '#fff' }: { name: string; hex: string; text?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-16 rounded-2xl flex items-end p-2.5" style={{ background: hex }}>
        <span className="text-[10px] font-inter font-medium" style={{ color: text }}>{hex}</span>
      </div>
      <span className="text-[12px] font-inter text-text-secondary">{name}</span>
    </div>
  )
}

export default function DesignSystem() {
  const [accordionOpen, setAccordionOpen] = useState<number | null>(1)
  const [segment, setSegment] = useState('grid')
  const [checks, setChecks] = useState({ a: true, b: false })
  const [radio, setRadio] = useState('a')
  const [tab, setTab] = useState('all')

  return (
    <div className="min-h-screen bg-cream py-12 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-display text-[40px] md:text-[52px] font-medium text-midnight">Design System</h1>
          <p className="font-inter text-[15px] text-text-secondary mt-2">Atlas Rouge · lenguaje editorial cálido · acento terracota</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

          {/* Colors */}
          <Card title="Colores de marca" className="lg:col-span-2">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <Swatch name="Terracota (primario)" hex="#B35A3D" />
              <Swatch name="Midnight" hex="#172033" />
              <Swatch name="Palm" hex="#315C45" />
              <Swatch name="Gold" hex="#C8A96A" text="#3a2f17" />
              <Swatch name="Sand" hex="#D8C3A5" text="#3a2f17" />
              <Swatch name="Cream" hex="#FAF7F1" text="#6E6259" />
              <Swatch name="Cream warm" hex="#F8F3EA" text="#6E6259" />
              <Swatch name="Texto" hex="#1E1E1E" />
              <Swatch name="Texto sec." hex="#6E6259" />
              <Swatch name="Borde" hex="#E8DED2" text="#6E6259" />
            </div>
          </Card>

          {/* Buttons */}
          <Card title="Botones">
            <div className="flex flex-wrap items-center gap-3">
              <button className="h-11 px-7 rounded-full bg-terracotta text-white font-inter text-[14px] font-semibold hover:opacity-90 active:scale-[0.98] transition">Primario</button>
              <button className="h-11 px-7 rounded-full border border-midnight text-midnight font-inter text-[14px] font-semibold hover:bg-midnight hover:text-white transition">Secundario</button>
              <button className="h-11 px-7 rounded-full bg-cream-warm text-text-primary font-inter text-[14px] font-medium hover:bg-sand/40 transition">Terciario</button>
              <button className="h-11 w-11 rounded-full bg-cream-warm text-text-primary flex items-center justify-center hover:bg-sand/40 transition"><ChevronDown size={18} /></button>
              <button className="h-11 w-11 rounded-full bg-cream-warm text-text-primary flex items-center justify-center hover:bg-sand/40 transition"><SlidersHorizontal size={18} /></button>
              <button className="h-11 px-5 rounded-full bg-terracotta text-white flex items-center justify-center hover:opacity-90 transition"><ArrowRight size={18} /></button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button className="h-9 px-5 rounded-full bg-terracotta text-white font-inter text-[13px] font-semibold">Pequeño</button>
              <button disabled className="h-9 px-5 rounded-full bg-cream-warm text-text-secondary/50 font-inter text-[13px] font-medium cursor-not-allowed">Desactivado</button>
            </div>
          </Card>

          {/* Tags & Badges */}
          <Card title="Tags & Badges">
            <div className="flex flex-wrap items-center gap-2.5">
              {['all', 'moodboard', 'ratings'].map(k => (
                <button key={k} onClick={() => setTab(k)} className={`h-9 px-4 rounded-full font-inter text-[13px] font-medium transition ${tab === k ? 'bg-terracotta text-white' : 'bg-cream-warm text-text-primary hover:bg-sand/40'}`}>
                  {k === 'all' ? 'TODO' : k === 'moodboard' ? 'Destacados' : 'Valoración'}{k === 'ratings' && <ChevronDown size={14} className="inline ml-1 -mt-0.5" />}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-3">
              <button className="h-8 px-3.5 rounded-full bg-cream-warm text-text-primary font-inter text-[12.5px] font-medium flex items-center gap-1.5">Limpiar todo <X size={13} /></button>
              <span className="h-7 px-3 rounded-full bg-sand/30 text-stone font-inter text-[11px] font-semibold uppercase tracking-[1px] flex items-center">Villa</span>
              <span className="h-7 px-3 rounded-full bg-sand/30 text-stone font-inter text-[11px] font-semibold uppercase tracking-[1px] flex items-center">Exclusiva</span>
              <span className="h-7 px-3 rounded-full bg-palm/15 text-palm font-inter text-[11px] font-semibold uppercase tracking-[1px] flex items-center">En venta</span>
              <span className="h-7 px-3 rounded-full bg-gold/25 text-[#7a5d1f] font-inter text-[11px] font-semibold uppercase tracking-[1px] flex items-center">Gold</span>
            </div>
          </Card>

          {/* Breadcrumb + Bullets */}
          <Card title="Breadcrumb & Bullets">
            <nav className="flex items-center gap-2 font-inter text-[13.5px]">
              <a className="text-text-secondary hover:text-terracotta cursor-pointer">Inicio</a>
              <span className="text-border-warm">·</span>
              <span className="h-7 px-3 rounded-full bg-cream-warm text-text-primary font-medium flex items-center">Detalle del inmueble</span>
            </nav>
            <div className="mt-5 space-y-2">
              {['Trato 100% en francés', 'Acompañamiento integral'].map(b => (
                <div key={b} className="flex items-center gap-2.5 bg-cream-warm rounded-full px-4 py-2.5">
                  <span className="w-5 h-5 rounded-full bg-terracotta flex items-center justify-center flex-shrink-0"><Check size={12} className="text-white" /></span>
                  <span className="font-inter text-[14px] text-text-primary">{b}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Accordion */}
          <Card title="Acordeón">
            <div className="space-y-3">
              {[
                { q: '¿Qué es Atlas Rouge?', a: 'Una agencia inmobiliaria de lujo en Marrakech con acompañamiento en francés de principio a fin.' },
                { q: '¿Qué hace única a Atlas Rouge?', a: 'En Atlas Rouge accedes a más de 3.500 propiedades con un conserje francófono que gestiona todo el proceso por ti.' },
              ].map((item, i) => {
                const open = accordionOpen === i
                return (
                  <div key={i} className={`rounded-2xl border transition ${open ? 'bg-cream-warm border-border-warm' : 'border-border-subtle'}`}>
                    <button onClick={() => setAccordionOpen(open ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                      <span className="font-display text-[17px] text-midnight">{item.q}</span>
                      <span className="flex-shrink-0 text-terracotta">{open ? <Minus size={20} /> : <Plus size={20} />}</span>
                    </button>
                    {open && (
                      <p className="px-5 pb-4 font-inter text-[14px] text-text-secondary leading-relaxed">
                        {item.a.split('Atlas Rouge').map((part, idx, arr) => (
                          <span key={idx}>{part}{idx < arr.length - 1 && <span className="text-terracotta font-medium">Atlas Rouge</span>}</span>
                        ))}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Checkboxes & Radios */}
          <Card title="Checkboxes & Radios">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                {([['a', 'Marcado'], ['b', 'Sin marcar']] as const).map(([k, label]) => {
                  const on = checks[k]
                  return (
                    <button key={k} onClick={() => setChecks(c => ({ ...c, [k]: !c[k] }))} className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${on ? 'bg-terracotta border-terracotta' : 'border-border-warm'}`}>{on && <Check size={13} className="text-white" />}</span>
                      <span className="font-inter text-[14px] text-text-primary">{label}</span>
                    </button>
                  )
                })}
                <div className="flex items-center gap-2.5 opacity-40">
                  <span className="w-5 h-5 rounded-md bg-sand/40 border border-border-warm" />
                  <span className="font-inter text-[14px]">Desactivado</span>
                </div>
              </div>
              <div className="space-y-3">
                {([['a', 'Comprar'], ['b', 'Alquilar']] as const).map(([k, label]) => {
                  const on = radio === k
                  return (
                    <button key={k} onClick={() => setRadio(k)} className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${on ? 'border-terracotta' : 'border-border-warm'}`}>{on && <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />}</span>
                      <span className="font-inter text-[14px] text-text-primary">{label}</span>
                    </button>
                  )
                })}
                <div className="flex items-center gap-2.5 opacity-40">
                  <span className="w-5 h-5 rounded-full border border-border-warm" />
                  <span className="font-inter text-[14px]">Desactivado</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Text inputs */}
          <Card title="Inputs" className="lg:col-span-2">
            <div className="space-y-4 max-w-[640px]">
              <div className="flex items-center gap-2 h-13 pl-5 pr-2 py-2 rounded-full border border-border-warm bg-white">
                <Search size={18} className="text-text-secondary" />
                <input className="flex-1 bg-transparent outline-none font-inter text-[15px] placeholder:text-text-secondary" placeholder="Buscar barrio, tipo, precio…" />
                <button className="h-9 px-4 rounded-full bg-cream-warm text-text-primary font-inter text-[13px] font-medium flex items-center gap-1.5">Presupuesto <ChevronDown size={15} /></button>
              </div>
              <div className="flex items-center gap-2 h-13 pl-5 pr-2 py-2 rounded-full border border-border-warm bg-white max-w-[420px]">
                <Search size={18} className="text-text-secondary" />
                <input className="flex-1 bg-transparent outline-none font-inter text-[15px] placeholder:text-text-secondary" placeholder="Buscar…" />
                <button className="h-9 w-9 rounded-full bg-cream-warm flex items-center justify-center"><SlidersHorizontal size={16} /></button>
              </div>
              <div className="flex flex-wrap gap-3">
                <input className="h-12 px-4 rounded-xl border border-border-warm bg-cream-warm/40 font-inter text-[15px] placeholder:text-text-secondary outline-none focus:border-terracotta" placeholder="Tu nombre" />
                <input className="h-12 px-4 rounded-xl border border-border-warm bg-cream-warm/40 font-inter text-[15px] placeholder:text-text-secondary outline-none focus:border-terracotta" placeholder="Tu email" />
              </div>
            </div>
          </Card>

          {/* Info block + Segmented */}
          <Card title="Info block">
            <div className="flex gap-3 bg-cream-warm rounded-2xl p-4">
              <span className="w-6 h-6 rounded-full bg-terracotta flex items-center justify-center flex-shrink-0 mt-0.5"><Check size={13} className="text-white" /></span>
              <p className="font-inter text-[13.5px] text-text-secondary leading-relaxed">
                <span className="font-semibold text-text-primary">¿Una zona preferida?</span> Indícasela a tu asesor. Si no, él seleccionará las mejores opciones según tu perfil de inversión.
              </p>
            </div>
          </Card>

          <Card title="Segmented controls">
            <div className="inline-flex p-1 rounded-full bg-cream-warm">
              {(['grid', 'list', 'map'] as const).map(s => (
                <button key={s} onClick={() => setSegment(s)} className={`h-9 px-5 rounded-full font-inter text-[13px] font-medium capitalize transition ${segment === s ? 'bg-terracotta text-white' : 'text-text-primary'}`}>
                  {s === 'grid' ? 'Cuadrícula' : s === 'list' ? 'Lista' : 'Mapa'}
                </button>
              ))}
            </div>
          </Card>

          {/* Cell */}
          <Card title="Tarjeta / Cell" className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-cream-warm rounded-2xl p-3 max-w-[560px]">
              <div className="w-full sm:w-28 h-24 rounded-xl bg-sand/40 flex-shrink-0 flex items-center justify-center text-stone font-inter text-[11px]">Foto</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-terracotta mb-0.5">{[1, 2, 3, 4].map(i => <Star key={i} size={13} fill="currentColor" />)}<Star size={13} className="text-sand" /></div>
                <h3 className="font-display text-[18px] text-midnight leading-tight">Appartement haut standing</h3>
                <p className="font-inter text-[13px] text-text-secondary">Guéliz, Marrakech · <span className="text-palm font-medium">Disponible</span></p>
              </div>
              <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2">
                <span className="font-display text-[18px] text-terracotta">295 000 €</span>
                <div className="flex gap-2">
                  <a className="h-9 w-9 rounded-full border border-border-warm flex items-center justify-center text-midnight cursor-pointer"><Phone size={16} /></a>
                  <a className="h-9 w-9 rounded-full border border-border-warm flex items-center justify-center text-[#0A8F57] cursor-pointer"><MessageCircle size={16} /></a>
                </div>
              </div>
            </div>
          </Card>

        </div>

        <div className="text-center mt-10">
          <span className="inline-flex h-9 px-5 rounded-full bg-cream-warm text-text-secondary font-inter text-[13px] items-center">Y más…</span>
        </div>
      </div>
    </div>
  )
}
