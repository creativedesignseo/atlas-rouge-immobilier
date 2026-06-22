import { ArrowRight, Sparkles, Shield, Leaf, CircleDollarSign, House } from 'lucide-react'

const palette = [
  { name: 'Ivory', hex: '#FBF8F2', note: 'Base calm background' },
  { name: 'Surface', hex: '#FFFFFF', note: 'Cards and panels' },
  { name: 'Ink', hex: '#172033', note: 'Primary text' },
  { name: 'Terracotta', hex: '#B35A3D', note: 'Brand accent' },
  { name: 'Terracotta Soft', hex: '#E7C5B8', note: 'Soft emphasis' },
  { name: 'Border', hex: '#E8E1D8', note: 'Hairline borders' },
  { name: 'Muted', hex: '#6F6A63', note: 'Secondary text' },
  { name: 'Sage', hex: '#7F8F84', note: 'Optional subtle accent' },
]

const cards = [
  { icon: House, title: 'Home', text: 'One hero, one message, one calm visual rhythm.' },
  { icon: Shield, title: 'Trust', text: 'Premium, restrained, editorial. Not noisy, not touristy.' },
  { icon: Leaf, title: 'Marrakech', text: 'A warm hint of place, not a loud theme.' },
]

const typeScale = [
  { label: 'Display', sample: 'Marrakech, but quieter.', meta: 'Hero / major statement', className: 'font-[Manrope] text-[clamp(3.15rem,6.4vw,5.9rem)] font-extrabold leading-[0.92] tracking-[-0.06em]' },
  { label: 'Heading', sample: 'Minimal, modern, premium.', meta: 'Section title / card heading', className: 'font-[Manrope] text-[28px] font-semibold leading-[1.05] tracking-[-0.045em] md:text-[34px]' },
  { label: 'Body', sample: 'Clean editorial layout, subtle accent colors, and strong hierarchy create a calm premium feel for European buyers.', meta: 'Paragraph / explanation', className: 'font-[Inter] text-[16px] leading-7 text-[#6F6A63]' },
  { label: 'UI', sample: 'Search, CTA, badge, filters, navigation.', meta: 'Buttons / labels / microcopy', className: 'font-[Inter] text-[12px] font-semibold uppercase tracking-[0.22em] text-[#172033]' },
]

const buttons = [
  { label: 'Primary CTA', className: 'bg-[#172033] text-white hover:bg-[#23314B] shadow-[0_10px_30px_rgba(23,32,51,0.10)]' },
  { label: 'Secondary', className: 'bg-white text-[#172033] border border-[#E8E1D8] hover:border-[#DCCFC4] hover:bg-[#FCFBF8]' },
  { label: 'Ghost', className: 'bg-transparent text-[#172033] hover:bg-[#FBF8F2]' },
]

export default function MiniDesignDirection() {
  return (
    <div className="min-h-screen bg-white text-[#172033]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-10 flex items-center justify-between gap-4 border-b border-[#E8E1D8] pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6F6A63]">Atlas Rouge</p>
            <h1 className="mt-3 font-[Manrope] text-4xl font-extrabold leading-[0.94] tracking-[-0.055em] text-[#172033] md:text-7xl">
              Mini Design Direction
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#6F6A63] md:text-[18px]">
              Clean editorial luxury with a subtle Marrakech accent. The goal is to feel premium, calm,
              and European, with a white background and restrained color use.
            </p>
          </div>
          <div className="hidden rounded-full border border-[#E8E1D8] bg-white px-4 py-2 text-sm text-[#6F6A63] lg:block">
            Preview only
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[34px] border border-[#E8E1D8] bg-white shadow-[0_30px_80px_rgba(23,32,51,0.06)]">
            <div className="relative min-h-[480px] bg-white p-8 md:p-12">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E1D8] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F6A63]">
                  <Sparkles size={14} className="text-[#B35A3D]" />
                  Editorial luxury
                </div>
                <h2 className="mt-8 max-w-xl font-[Manrope] text-[clamp(3rem,6vw,5.8rem)] font-extrabold leading-[0.92] tracking-[-0.06em]">
                  Marrakech, but quieter.
                </h2>
                <p className="mt-6 max-w-lg text-[17px] leading-8 text-[#6F6A63]">
                  The brand should feel like a premium European agency with a warm, Moroccan signature. The
                  accent color stays soft, the layout stays calm, and the message stays clear.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {buttons.map((button) => (
                    <button
                      key={button.label}
                      type="button"
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${button.className}`}
                    >
                      {button.label}
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-12 grid gap-4 md:grid-cols-3">
                {cards.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-[24px] border border-[#E8E1D8] bg-white/90 p-5 backdrop-blur">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF8F2] text-[#B35A3D]">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-4 font-[Manrope] text-[20px] font-semibold tracking-[-0.03em]">{title}</h3>
                    <p className="mt-2 text-[14px] leading-6 text-[#6F6A63]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="grid gap-6">
            <div className="rounded-[34px] border border-[#E8E1D8] bg-white p-6 shadow-[0_20px_60px_rgba(23,32,51,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F6A63]">Palette</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {palette.map((item) => (
                  <div key={item.name} className="rounded-[20px] border border-[#E8E1D8] bg-[#FBF8F2] p-3">
                    <div className="h-16 rounded-[16px]" style={{ background: item.hex }} />
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#172033]">{item.name}</p>
                        <p className="text-xs text-[#6F6A63]">{item.note}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#6F6A63]">{item.hex}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-[#E8E1D8] bg-white p-6 shadow-[0_20px_60px_rgba(23,32,51,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F6A63]">Type hierarchy</p>
              <div className="mt-5 grid gap-5">
                {typeScale.map((item) => (
                  <div key={item.label} className="border-t border-[#F0E9E1] pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B35A3D]">{item.label}</p>
                        <p className={`mt-2 max-w-md text-[#172033] ${item.className}`}>{item.sample}</p>
                        <p className="mt-2 text-xs text-[#6F6A63]">{item.meta}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-[#E8E1D8] bg-[#FCFBF8] p-6 shadow-[0_20px_60px_rgba(23,32,51,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F6A63]">Rule of thumb</p>
              <p className="mt-4 font-[Manrope] text-3xl font-semibold leading-tight tracking-[-0.04em]">
                80% neutral, 15% terracotta, 5% accent.
              </p>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#6F6A63]">
                If the Marrakech colors start dominating the page, the site feels local and loud. If they stay
                subtle, the brand feels premium and European.
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-[22px] border border-[#E8E1D8] bg-white p-4">
                <CircleDollarSign size={20} className="text-[#E7C5B8]" />
                <div>
                  <p className="text-sm font-semibold">Primary CTA stays soft</p>
                  <p className="text-xs text-[#6F6A63]">Terracotta, not red.</p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
