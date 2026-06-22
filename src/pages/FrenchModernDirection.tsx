import { ArrowRight, BedDouble, Building2, MapPin, Search, SlidersHorizontal, Square, TrainFront } from 'lucide-react'

const palette = [
  { name: 'Porcelain', hex: '#F7F7F0' },
  { name: 'Carbon', hex: '#161816' },
  { name: 'Petrol', hex: '#075B52' },
  { name: 'Absinthe', hex: '#C9F24A' },
  { name: 'Brique', hex: '#A8473D' },
  { name: 'Linen Line', hex: '#DDD8CC' },
]

const listings = [
  {
    title: 'Appartement haussmannien renove',
    location: 'Paris 7e',
    price: '1 420 000 EUR',
    meta: ['4 pieces', '112 m2', 'Balcon'],
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Maison contemporaine',
    location: 'Nantes Erdre',
    price: '780 000 EUR',
    meta: ['5 pieces', '168 m2', 'Jardin'],
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80',
  },
]

const districts = ['Paris Ouest', 'Bordeaux centre', 'Lyon 6e', 'Nantes Erdre']

export default function FrenchModernDirection() {
  return (
    <main className="min-h-screen bg-[#F7F7F0] font-[Inter] text-[#161816]">
      <section className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <nav className="flex items-center justify-between border-b border-[#DDD8CC] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#161816] text-[#C9F24A]">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Maison Neuve</p>
              <p className="text-xs text-[#6E7068]">Immobilier selectionne</p>
            </div>
          </div>

          <div className="hidden items-center gap-8 text-sm text-[#4D5049] md:flex">
            <span>Acheter</span>
            <span>Louer</span>
            <span>Estimer</span>
            <span>Investir</span>
          </div>

          <button className="inline-flex h-10 items-center gap-2 rounded border border-[#161816] px-4 text-sm font-semibold">
            Contact
            <ArrowRight size={15} />
          </button>
        </nav>

        <div className="grid min-h-[620px] gap-8 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded bg-[#E8E9DF] px-3 py-2 text-xs font-semibold text-[#075B52]">
                <span className="h-2 w-2 rounded-full bg-[#C9F24A]" />
                France, patrimoine contemporain
              </p>
              <h1 className="max-w-2xl text-6xl font-semibold leading-none md:text-7xl lg:text-8xl">
                Acheter moins vite. Choisir mieux.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#4D5049]">
                Une interface calme pour trouver des biens de qualite, comparer les quartiers et parler avec un
                conseiller sans friction.
              </p>
            </div>

            <div className="mt-10 border-y border-[#DDD8CC] py-5">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <label className="flex h-12 items-center gap-3 rounded bg-[#FEFEFA] px-4">
                  <Search size={18} className="text-[#075B52]" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#7B7D74]"
                    placeholder="Ville, quartier, type de bien"
                  />
                </label>
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded bg-[#075B52] px-5 text-sm font-semibold text-[#FEFEFA]">
                  Rechercher
                  <ArrowRight size={16} />
                </button>
                <button className="inline-flex h-12 items-center justify-center rounded border border-[#DDD8CC] bg-[#FEFEFA] px-4 text-[#161816]">
                  <SlidersHorizontal size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded">
            <img
              src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=82"
              alt="Appartement contemporain lumineux en France"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 border-t border-[#FEFEFA]/40 bg-[#161816]/82 p-5 text-[#FEFEFA] backdrop-blur-sm">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-[#C9F24A]">Selection du moment</p>
                  <h2 className="mt-1 text-2xl font-semibold">Loft calme pres du Jardin du Luxembourg</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#E6E2D7]">
                    <MapPin size={15} />
                    Paris 6e, 138 m2, terrasse
                  </p>
                </div>
                <p className="text-3xl font-semibold">2 180 000 EUR</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#DDD8CC] bg-[#FEFEFA]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 lg:grid-cols-[0.34fr_0.66fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold text-[#075B52]">Direction artistique</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">Moderne francais, pas startup generique.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Typographie', 'Sans sobre, grandes masses, zero decoration inutile.'],
              ['Couleur', 'Vert petrol comme base de confiance, absinthe en signal rare.'],
              ['Produit', 'L interface ressemble a un outil de selection, pas a une affiche.'],
            ].map(([title, text]) => (
              <article key={title} className="rounded border border-[#DDD8CC] bg-[#F7F7F0] p-5">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#4D5049]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_0.42fr] lg:px-8">
        <div className="grid gap-4">
          {listings.map((item) => (
            <article key={item.title} className="grid overflow-hidden rounded border border-[#DDD8CC] bg-[#FEFEFA] md:grid-cols-[220px_1fr]">
              <img src={item.image} alt="" className="h-52 w-full object-cover md:h-full" />
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm text-[#075B52]">
                      <MapPin size={15} />
                      {item.location}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-xl font-semibold">{item.price}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.meta.map((meta, index) => {
                    const Icon = index === 0 ? BedDouble : index === 1 ? Square : TrainFront
                    return (
                      <span key={meta} className="inline-flex items-center gap-2 rounded border border-[#DDD8CC] px-3 py-2 text-sm text-[#4D5049]">
                        <Icon size={15} />
                        {meta}
                      </span>
                    )
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded border border-[#DDD8CC] bg-[#161816] p-5 text-[#FEFEFA]">
          <p className="text-xs text-[#C9F24A]">Palette proposee</p>
          <div className="mt-5 grid gap-3">
            {palette.map((color) => (
              <div key={color.hex} className="flex items-center justify-between border-b border-[#FEFEFA]/12 pb-3">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded border border-[#FEFEFA]/20" style={{ backgroundColor: color.hex }} />
                  <span className="text-sm">{color.name}</span>
                </div>
                <span className="text-xs text-[#D4D0C4]">{color.hex}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-xs text-[#C9F24A]">Quartiers</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {districts.map((district) => (
                <span key={district} className="rounded border border-[#FEFEFA]/16 px-3 py-2 text-sm text-[#E6E2D7]">
                  {district}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
