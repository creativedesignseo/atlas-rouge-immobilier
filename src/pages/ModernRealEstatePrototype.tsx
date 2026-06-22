import { ArrowRight, MapPin, Sparkles, Search, Star, TrendingUp, ShieldCheck } from 'lucide-react'

const stats = [
  { value: '3,500+', label: 'selected listings' },
  { value: '48h', label: 'response time' },
  { value: '92%', label: 'qualified leads' },
]

const pillars = [
  {
    icon: Search,
    title: 'Search-first',
    text: 'A clean, fast interface with location, price, and property type at the center.',
  },
  {
    icon: TrendingUp,
    title: 'Modern trust',
    text: 'Data, filters, and proof points presented with a confident product UI.',
  },
  {
    icon: ShieldCheck,
    title: 'Premium calm',
    text: 'Luxury comes from spacing and hierarchy, not from over-decoration.',
  },
]

const properties = [
  { type: 'Villa', area: 'Palm Grove', price: '€1.25M', accent: 'from-[#1D4ED8] to-[#60A5FA]' },
  { type: 'Riad', area: 'Medina', price: '€620K', accent: 'from-[#0F766E] to-[#5EEAD4]' },
  { type: 'Apartment', area: 'Gueliz', price: '€310K', accent: 'from-[#FB7185] to-[#FDBA74]' },
]

export default function ModernRealEstatePrototype() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <header className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1D4ED8]">
              <Sparkles size={14} />
              Modern real estate prototype
            </div>
            <h1 className="mt-5 max-w-3xl text-[clamp(3.1rem,7vw,6.5rem)] font-black leading-[0.92] tracking-[-0.07em] text-[#0F172A]">
              Modern, bright, and premium.
            </h1>
            <p className="mt-5 max-w-2xl text-[18px] leading-8 text-[#334155]">
              A prototype for a contemporary real-estate brand: white background, bold hierarchy,
              modern color accents, and a product-driven layout that feels fast and trustworthy.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(29,78,216,0.22)] transition hover:bg-[#1E40AF]">
                Explore listings
                <ArrowRight size={16} />
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-[#DBEAFE] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] transition hover:bg-[#F8FAFC]">
                Book a call
              </button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                  <p className="text-3xl font-black tracking-[-0.05em] text-[#0F172A]">{item.value}</p>
                  <p className="mt-2 text-sm text-[#64748B]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-[#E2E8F0] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#1D4ED8_0%,#2563EB_45%,#22C55E_100%)] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">Search preview</p>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">Find the right home</h2>
                </div>
                <div className="rounded-full bg-white/15 p-3">
                  <MapPin size={20} />
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-[24px] bg-white p-4 text-[#0F172A] shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-3 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                  <Search size={18} className="text-[#1D4ED8]" />
                  <span className="text-sm text-[#64748B]">Search by neighborhood, villa, riad, apartment...</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Prime locations', 'Sea view', 'Investment', 'Ready to move'].map((tag) => (
                    <span key={tag} className="rounded-full bg-[#E0F2FE] px-3 py-2 text-xs font-semibold text-[#0369A1]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {properties.map((item) => (
                <div key={item.type} className="flex items-center justify-between rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-[18px] bg-gradient-to-br ${item.accent}`} />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#64748B]">{item.type}</p>
                      <p className="text-lg font-bold text-[#0F172A]">{item.area}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#64748B]">from</p>
                    <p className="text-lg font-black tracking-[-0.04em] text-[#0F172A]">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[30px] border border-[#E2E8F0] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-[22px] font-black tracking-[-0.04em]">{title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-[#64748B]">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-[36px] border border-[#E2E8F0] bg-[#F8FAFC] p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Brand notes</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0F172A]">Minimal, but not cold.</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FECACA] bg-[#FFF1F2] px-4 py-2 text-sm font-semibold text-[#E11D48]">
              <Star size={16} />
              Coral accent only for energy
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              'White + deep navy base',
              'Electric blue as trust cue',
              'Coral / mint only as highlights',
            ].map((note) => (
              <div key={note} className="rounded-[22px] border border-[#E2E8F0] bg-white p-4 text-sm font-medium text-[#0F172A]">
                {note}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
