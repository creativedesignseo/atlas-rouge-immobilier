import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search } from 'lucide-react'

// ============================================================================
// Lista de países priorizada para el target Atlas Rouge — público inversor
// europeo + diáspora marroquí + algunos países del Golfo + LATAM por idioma.
// Cada país: ISO2 (para la bandera emoji), nombre, prefijo internacional.
// ============================================================================

interface Country {
  iso: string
  name: string
  dial: string
}

// Banderas via emoji (regional indicators) — modernas, ligeras, sin imagen.
// Renderiza correctamente en iOS/macOS/Windows 11/Android 10+. En Linux/Chrome
// puede caer a texto "FR" — se cubre con un fallback CSS.
function flag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

const COUNTRIES: Country[] = [
  // Top: target principal Atlas Rouge — francófonos, hispanohablantes y MRE
  { iso: 'FR', name: 'France', dial: '+33' },
  { iso: 'ES', name: 'España', dial: '+34' },
  { iso: 'MA', name: 'Maroc', dial: '+212' },
  { iso: 'BE', name: 'Belgique', dial: '+32' },
  { iso: 'CH', name: 'Suisse', dial: '+41' },
  { iso: 'NL', name: 'Nederland', dial: '+31' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44' },
  { iso: 'DE', name: 'Deutschland', dial: '+49' },
  { iso: 'IT', name: 'Italia', dial: '+39' },
  { iso: 'PT', name: 'Portugal', dial: '+351' },
  // Resto Europa
  { iso: 'IE', name: 'Ireland', dial: '+353' },
  { iso: 'LU', name: 'Luxembourg', dial: '+352' },
  { iso: 'AT', name: 'Österreich', dial: '+43' },
  { iso: 'DK', name: 'Danmark', dial: '+45' },
  { iso: 'SE', name: 'Sverige', dial: '+46' },
  { iso: 'NO', name: 'Norge', dial: '+47' },
  { iso: 'FI', name: 'Suomi', dial: '+358' },
  { iso: 'PL', name: 'Polska', dial: '+48' },
  { iso: 'CZ', name: 'Česko', dial: '+420' },
  { iso: 'GR', name: 'Ελλάδα', dial: '+30' },
  { iso: 'HR', name: 'Hrvatska', dial: '+385' },
  // Magreb + Golfo
  { iso: 'DZ', name: 'Algérie', dial: '+213' },
  { iso: 'TN', name: 'Tunisie', dial: '+216' },
  { iso: 'AE', name: 'الإمارات', dial: '+971' },
  { iso: 'SA', name: 'السعودية', dial: '+966' },
  { iso: 'QA', name: 'قطر', dial: '+974' },
  { iso: 'KW', name: 'الكويت', dial: '+965' },
  { iso: 'BH', name: 'البحرين', dial: '+973' },
  { iso: 'OM', name: 'عُمان', dial: '+968' },
  { iso: 'EG', name: 'مصر', dial: '+20' },
  { iso: 'JO', name: 'الأردن', dial: '+962' },
  { iso: 'LB', name: 'لبنان', dial: '+961' },
  // Américas
  { iso: 'US', name: 'United States', dial: '+1' },
  { iso: 'CA', name: 'Canada', dial: '+1' },
  { iso: 'MX', name: 'México', dial: '+52' },
  { iso: 'AR', name: 'Argentina', dial: '+54' },
  { iso: 'BR', name: 'Brasil', dial: '+55' },
  { iso: 'CL', name: 'Chile', dial: '+56' },
  { iso: 'CO', name: 'Colombia', dial: '+57' },
  { iso: 'PE', name: 'Perú', dial: '+51' },
  { iso: 'VE', name: 'Venezuela', dial: '+58' },
  { iso: 'UY', name: 'Uruguay', dial: '+598' },
  // Otros
  { iso: 'AU', name: 'Australia', dial: '+61' },
  { iso: 'NZ', name: 'New Zealand', dial: '+64' },
  { iso: 'JP', name: '日本', dial: '+81' },
  { iso: 'KR', name: '대한민국', dial: '+82' },
  { iso: 'CN', name: '中国', dial: '+86' },
  { iso: 'IN', name: 'India', dial: '+91' },
  { iso: 'TR', name: 'Türkiye', dial: '+90' },
  { iso: 'IL', name: 'ישראל', dial: '+972' },
  { iso: 'ZA', name: 'South Africa', dial: '+27' },
]

// Mapeo del idioma activo al país por defecto
const LANG_TO_DEFAULT_COUNTRY: Record<string, string> = {
  fr: 'FR',
  es: 'ES',
  en: 'GB',
}

// ============================================================================
// Componente PhoneField
// ============================================================================

export interface PhoneFieldProps {
  /** Valor completo en formato E.164 (ej. "+34666123456") */
  value: string
  /** Recibe el valor en formato E.164 al cambiar */
  onChange: (e164: string) => void
  placeholder?: string
  required?: boolean
  /** ID HTML para asociar con un <label> externo */
  id?: string
  /** ISO2 del país por defecto si value está vacío. Default: detecta del i18n */
  defaultCountry?: string
  /** Tamaño del input (default 'md') */
  size?: 'md' | 'lg'
  className?: string
}

export default function PhoneField({
  value,
  onChange,
  placeholder,
  required,
  id,
  defaultCountry,
  size = 'md',
  className = '',
}: PhoneFieldProps) {
  const { i18n } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // País por defecto: prop > idioma > FR
  const initialCountry = useMemo(() => {
    if (defaultCountry) {
      const found = COUNTRIES.find((c) => c.iso === defaultCountry.toUpperCase())
      if (found) return found
    }
    const lang = i18n.language?.slice(0, 2) || 'fr'
    const isoFromLang = LANG_TO_DEFAULT_COUNTRY[lang] || 'FR'
    return COUNTRIES.find((c) => c.iso === isoFromLang) || COUNTRIES[0]
  }, [defaultCountry, i18n.language])

  // Inferir país del value si empieza por +XX
  function inferCountry(v: string): Country {
    if (!v.startsWith('+')) return initialCountry
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
    return sorted.find((c) => v.startsWith(c.dial)) || initialCountry
  }

  const [country, setCountry] = useState<Country>(() => inferCountry(value))
  const [localNumber, setLocalNumber] = useState(() =>
    value.startsWith(country.dial) ? value.slice(country.dial.length).trim() : '',
  )
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Focus en el search al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 30)
    } else {
      setSearch('')
    }
  }, [open])

  // Notificar cambios al padre en formato E.164
  function emit(newCountry: Country, newLocal: string) {
    const cleaned = newLocal.replace(/[^\d]/g, '')
    onChange(cleaned ? `${newCountry.dial}${cleaned}` : '')
  }

  function handleLocalChange(v: string) {
    setLocalNumber(v)
    emit(country, v)
  }

  function pickCountry(c: Country) {
    setCountry(c)
    setOpen(false)
    emit(c, localNumber)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q),
    )
  }, [search])

  const heightClass = size === 'lg' ? 'h-[52px]' : 'h-12'
  const flagFontSize = size === 'lg' ? 'text-[20px]' : 'text-[18px]'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex ${heightClass} border-2 border-border-warm rounded-xl bg-white overflow-hidden focus-within:border-terracotta focus-within:ring-2 focus-within:ring-terracotta/15 transition-colors`}
      >
        {/* Botón selector país */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 pl-3 pr-2 border-r border-border-warm hover:bg-cream-warm/50 transition-colors"
          aria-label="Select country"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={`${flagFontSize} leading-none select-none`} aria-hidden>
            {flag(country.iso)}
          </span>
          <span className="font-inter text-[14px] text-text-primary font-medium tabular-nums">
            {country.dial}
          </span>
          <ChevronDown
            size={14}
            className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Input del número local */}
        <input
          ref={inputRef}
          id={id}
          type="tel"
          required={required}
          value={localNumber}
          onChange={(e) => handleLocalChange(e.target.value)}
          placeholder={placeholder || '600 00 00 00'}
          className="flex-1 min-w-0 px-3 bg-transparent font-inter text-[15px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none"
          autoComplete="tel"
          inputMode="tel"
        />
      </div>

      {/* Dropdown countries */}
      {open && (
        <div
          className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-border-warm rounded-xl shadow-card-hover overflow-hidden"
          role="listbox"
        >
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border-warm">
            <Search size={15} className="text-text-secondary shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país…"
              className="flex-1 min-w-0 bg-transparent font-inter text-[14px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none"
            />
          </div>
          <ul className="max-h-[280px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-[13px] font-inter text-text-secondary text-center">
                Sin resultados
              </li>
            ) : (
              filtered.map((c) => (
                <li key={c.iso}>
                  <button
                    type="button"
                    onClick={() => pickCountry(c)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-cream-warm transition-colors ${
                      c.iso === country.iso ? 'bg-cream-warm/60' : ''
                    }`}
                    role="option"
                    aria-selected={c.iso === country.iso}
                  >
                    <span className={`${flagFontSize} leading-none select-none shrink-0`} aria-hidden>
                      {flag(c.iso)}
                    </span>
                    <span className="font-inter text-[14px] text-text-primary truncate flex-1">
                      {c.name}
                    </span>
                    <span className="font-inter text-[13px] text-text-secondary tabular-nums">
                      {c.dial}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
