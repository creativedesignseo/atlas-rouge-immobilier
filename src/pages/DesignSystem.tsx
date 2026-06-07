import { useState } from 'react'

/**
 * Living spec of the "Atlas" design system, ported 1:1 from
 * document/atlas-landing/styles.css (the owner's design system) so the tokens
 * and component looks are faithful — NOT a re-interpretation.
 *
 * Route: /design-system. Self-contained: a scoped <style> block holds the
 * system's tokens/classes (prefixed .ads-*) so it never clashes with the app's
 * Tailwind. This is the reference we align the real site to next.
 */

const CSS = `
.ads {
  --bg:#EFF1F3; --surface:#FCFCFA; --soft:#EEEAE3; --soft-2:#F6F4EF;
  --text:#1F1F1F; --muted:#6F6A63; --border:#1F1F1F;
  --primary:#B35A3D; --primary-soft:#E7C5B8;
  --r-sm:12px; --r-md:22px; --r-lg:34px; --pill:999px;
  --title:Georgia,"Times New Roman",serif;
  --body:Inter,Arial,Helvetica,sans-serif;
  background:var(--bg); color:var(--text); font-family:var(--body);
  min-height:100vh; padding:40px 16px;
}
.ads * { box-sizing:border-box; }
.ads .wrap { width:min(1180px,100%); margin:0 auto; }
.ads h1.title { font-family:var(--title); font-weight:500; font-size:clamp(40px,6vw,72px); letter-spacing:-0.03em; text-align:center; margin:0 0 6px; }
.ads .sub { text-align:center; color:var(--muted); font-size:15px; margin:0 0 36px; }
.ads .grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.ads .card { background:var(--surface); border:1.5px solid var(--border); border-radius:var(--r-lg); padding:26px; }
.ads .card.full { grid-column:1 / -1; }
.ads .label { font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); margin:0 0 18px; }
.ads .row { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
.ads .stack { display:flex; flex-direction:column; gap:12px; }

/* buttons */
.ads .btn { border:none; border-radius:var(--pill); padding:13px 24px; font-size:14px; font-weight:700; min-height:46px; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-family:var(--body); }
.ads .btn-dark { background:var(--text); color:#fff; }
.ads .btn-outline { background:transparent; border:1.5px solid var(--text); color:var(--text); }
.ads .btn-primary { background:var(--primary); color:#fff; }
.ads .btn-soft { background:var(--soft); color:var(--text); }
.ads .btn-icon { width:46px; height:46px; padding:0; border-radius:50%; }

/* eyebrow */
.ads .eyebrow { display:inline-flex; align-items:center; gap:8px; background:var(--soft); border-radius:var(--pill); padding:9px 16px; font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; }
.ads .dot { width:8px; height:8px; border-radius:50%; background:var(--primary); }

/* tags */
.ads .tag { border-radius:var(--pill); padding:8px 16px; font-size:13px; font-weight:700; background:var(--soft); color:var(--text); border:none; }
.ads .tag.active { background:var(--primary); color:#fff; }
.ads .tag.mini { font-size:11px; letter-spacing:0.08em; text-transform:uppercase; padding:6px 12px; }

/* stat */
.ads .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.ads .stat { background:var(--soft-2); border-radius:var(--r-md); padding:18px; }
.ads .stat strong { display:block; font-family:var(--title); font-size:32px; font-weight:500; }
.ads .stat span { color:var(--muted); font-size:13px; }

/* input pill */
.ads .input-pill { display:flex; align-items:center; gap:10px; background:var(--surface); border:1.5px solid var(--border); border-radius:var(--pill); padding:6px 8px 6px 18px; }
.ads .input-pill input { flex:1; border:none; outline:none; background:transparent; font-size:15px; color:var(--text); }
.ads .field { background:var(--soft-2); border:1.5px solid var(--border); border-radius:var(--r-sm); padding:13px 16px; font-size:15px; outline:none; }

/* accordion */
.ads .acc { border:1.5px solid var(--border); border-radius:var(--r-md); overflow:hidden; }
.ads .acc + .acc { margin-top:12px; }
.ads .acc-head { width:100%; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 20px; background:transparent; border:none; text-align:left; font-family:var(--title); font-size:18px; color:var(--text); }
.ads .acc.open { background:var(--soft-2); }
.ads .acc-body { padding:0 20px 18px; color:var(--muted); font-size:14px; line-height:1.6; }
.ads .acc-body .hl { color:var(--primary); font-weight:600; }
.ads .plus { color:var(--primary); font-size:22px; line-height:1; }

/* checks / radios */
.ads .opt { display:flex; align-items:center; gap:10px; background:none; border:none; padding:0; font-size:14px; color:var(--text); }
.ads .box { width:20px; height:20px; border-radius:6px; border:1.5px solid var(--border); display:grid; place-items:center; }
.ads .box.on { background:var(--primary); border-color:var(--primary); }
.ads .box.rad { border-radius:50%; }
.ads .box .tick { width:10px; height:10px; border-radius:2px; background:#fff; }
.ads .box.rad .tick { border-radius:50%; }

/* segmented */
.ads .segmented { display:inline-flex; gap:6px; background:var(--soft); border-radius:var(--pill); padding:5px; }
.ads .segmented .seg { border:none; background:transparent; border-radius:var(--pill); padding:9px 18px; font-size:13px; font-weight:700; color:var(--text); }
.ads .segmented .seg.on { background:var(--primary); color:#fff; }

/* cell */
.ads .cell { display:flex; gap:14px; align-items:center; background:var(--soft-2); border-radius:var(--r-md); padding:14px; }
.ads .cell .ph { width:90px; height:74px; border-radius:var(--r-sm); background:var(--soft); display:grid; place-items:center; color:var(--muted); font-size:11px; flex-shrink:0; }
.ads .cell h3 { font-family:var(--title); font-size:18px; margin:0; }
.ads .cell .price { font-family:var(--title); font-size:18px; color:var(--primary); }

.ads .swatch { height:60px; border-radius:var(--r-sm); display:flex; align-items:flex-end; padding:8px; }
.ads .swatch span { font-size:10px; font-weight:700; }
.ads .swgrid { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
.ads .swname { font-size:11px; color:var(--muted); margin-top:6px; display:block; }

@media (max-width:760px){ .ads .grid { grid-template-columns:1fr; } }
`

function Plus() { return <span className="plus">+</span> }
function MinusIcon() { return <span className="plus">−</span> }

export default function DesignSystem() {
  const [open, setOpen] = useState<number | null>(1)
  const [seg, setSeg] = useState('grid')
  const [chk, setChk] = useState({ a: true, b: false })
  const [rad, setRad] = useState('a')
  const [tag, setTag] = useState('all')

  const swatches: [string, string, string][] = [
    ['Primario', '#B35A3D', '#fff'], ['Texto / borde', '#1F1F1F', '#fff'],
    ['Fondo', '#EFF1F3', '#1F1F1F'], ['Superficie', '#FCFCFA', '#6F6A63'],
    ['Beige', '#EEEAE3', '#6F6A63'], ['Beige 2', '#F6F4EF', '#6F6A63'],
    ['Primary soft', '#E7C5B8', '#1F1F1F'], ['Muted', '#6F6A63', '#fff'],
  ]

  return (
    <div className="ads">
      <style>{CSS}</style>
      <div className="wrap">
        <h1 className="title">Sistema de Diseño Atlas</h1>
        <p className="sub">Tokens reales · serif Georgia · primario terracota · bordes finos · píldoras</p>

        <div className="grid">
          {/* Colors */}
          <div className="card full">
            <p className="label">Colores</p>
            <div className="swgrid">
              {swatches.map(([n, hex, tx]) => (
                <div key={n}>
                  <div className="swatch" style={{ background: hex }}><span style={{ color: tx }}>{hex}</span></div>
                  <span className="swname">{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="card">
            <p className="label">Botones</p>
            <div className="row">
              <button className="btn btn-primary">Primario</button>
              <button className="btn btn-dark">Oscuro</button>
              <button className="btn btn-outline">Outline</button>
              <button className="btn btn-soft">Soft</button>
              <button className="btn btn-soft btn-icon">→</button>
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <p className="label">Tags & Badges</p>
            <div className="row">
              {(['all', 'feat', 'rate'] as const).map(k => (
                <button key={k} className={`tag ${tag === k ? 'active' : ''}`} onClick={() => setTag(k)}>
                  {k === 'all' ? 'TODO' : k === 'feat' ? 'Destacados' : 'Valoración'}
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <span className="tag mini">Villa</span>
              <span className="tag mini">Exclusiva</span>
              <span className="tag mini" style={{ background: '#E7C5B8' }}>En venta</span>
            </div>
          </div>

          {/* Eyebrow + Stats */}
          <div className="card full">
            <p className="label">Eyebrow & Stats</p>
            <span className="eyebrow"><span className="dot" /> Inmobiliaria premium</span>
            <div className="stats" style={{ marginTop: 18 }}>
              <div className="stat"><strong>320+</strong><span>Propiedades activas</span></div>
              <div className="stat"><strong>48h</strong><span>Tiempo de respuesta</span></div>
              <div className="stat"><strong>4.9</strong><span>Valoración de clientes</span></div>
            </div>
          </div>

          {/* Accordion */}
          <div className="card">
            <p className="label">Acordeón</p>
            {[
              { q: '¿Qué es Atlas Rouge?', a: 'Agencia de lujo en Marrakech con acompañamiento en francés.' },
              { q: '¿Qué la hace única?', a: 'Acceso a +3.500 propiedades con conserje francófono de principio a fin.' },
            ].map((it, i) => (
              <div key={i} className={`acc ${open === i ? 'open' : ''}`}>
                <button className="acc-head" onClick={() => setOpen(open === i ? null : i)}>
                  {it.q}{open === i ? <MinusIcon /> : <Plus />}
                </button>
                {open === i && <div className="acc-body">{it.a}</div>}
              </div>
            ))}
          </div>

          {/* Checks / radios */}
          <div className="card">
            <p className="label">Checkboxes & Radios</p>
            <div className="row" style={{ gap: 32, alignItems: 'flex-start' }}>
              <div className="stack">
                {(['a', 'b'] as const).map(k => (
                  <button key={k} className="opt" onClick={() => setChk(c => ({ ...c, [k]: !c[k] }))}>
                    <span className={`box ${chk[k] ? 'on' : ''}`}>{chk[k] && <span className="tick" />}</span>
                    {k === 'a' ? 'Marcado' : 'Sin marcar'}
                  </button>
                ))}
              </div>
              <div className="stack">
                {(['a', 'b'] as const).map(k => (
                  <button key={k} className="opt" onClick={() => setRad(k)}>
                    <span className={`box rad ${rad === k ? 'on' : ''}`}>{rad === k && <span className="tick" />}</span>
                    {k === 'a' ? 'Comprar' : 'Alquilar'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="card full">
            <p className="label">Inputs</p>
            <div className="stack" style={{ maxWidth: 620 }}>
              <div className="input-pill">
                <span style={{ color: '#6F6A63' }}>⌕</span>
                <input placeholder="Buscar barrio, tipo, precio…" />
                <button className="btn btn-soft" style={{ minHeight: 36, padding: '8px 16px' }}>Presupuesto ▾</button>
              </div>
              <div className="row">
                <input className="field" placeholder="Tu nombre" />
                <input className="field" placeholder="Tu email" />
              </div>
            </div>
          </div>

          {/* Segmented */}
          <div className="card">
            <p className="label">Segmented controls</p>
            <div className="segmented">
              {(['grid', 'list', 'map'] as const).map(s => (
                <button key={s} className={`seg ${seg === s ? 'on' : ''}`} onClick={() => setSeg(s)}>
                  {s === 'grid' ? 'Cuadrícula' : s === 'list' ? 'Lista' : 'Mapa'}
                </button>
              ))}
            </div>
          </div>

          {/* Cell */}
          <div className="card">
            <p className="label">Tarjeta / Cell</p>
            <div className="cell">
              <div className="ph">Foto</div>
              <div style={{ flex: 1 }}>
                <h3>Appartement haut standing</h3>
                <p style={{ color: '#6F6A63', fontSize: 13, margin: '4px 0 0' }}>Guéliz, Marrakech</p>
              </div>
              <span className="price">295 000 €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
