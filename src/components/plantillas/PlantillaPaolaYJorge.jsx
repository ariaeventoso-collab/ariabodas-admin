import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebaseClient'
import './paola-y-jorge.css'

// ============================================
// PLANTILLA DEDICADA: Paola y Jorge — 28 de noviembre de 2026
// Esta plantilla es solo para este evento. Nombres, fecha, itinerario,
// vestimenta y regalos están escritos directo aquí, no vienen de Firestore.
// Lo único que sí depende de la boda cargada es el RSVP (boda.slug), porque
// los invitados sí son datos reales que cambian.
//
// Fotos: sube las 5 fotos de la pareja a Diseño de la boda en el panel.
//   - imagen_fondo_url  -> foto de portada (la que se ve al abrir el sobre)
//   - galeria_fotos[0]  -> escaleras de piedra
//   - galeria_fotos[1]  -> balcón
//   - galeria_fotos[2]  -> baile frente a casa colonial (foto ancha)
//   - galeria_fotos[3]  -> banca de madera (foto ancha final)
//
// Imágenes propias del sobre (no cambian por boda), deben existir en:
//   /public/plantilla-paola-jorge/wood-backdrop.jpg
//   /public/plantilla-paola-jorge/kraft-texture.jpg   (ya incluida)
//   /public/plantilla-paola-jorge/wax-seal.png
// ============================================

const FECHA_BODA = new Date('2026-11-28T17:00:00-07:00')

const ITINERARIO = [
  {
    hora: '5:00 pm',
    titulo: 'Ceremonia religiosa',
    lugar: 'Iglesia Señor de los Milagros',
    detalle: 'Río Fuerte 102, Col. del Valle, Cd. Obregón',
    mapa: 'https://maps.app.goo.gl/QcqYWxgGikw9Y2UY6',
  },
  {
    hora: '9:00 pm',
    titulo: 'Recepción y fiesta',
    lugar: 'Hacienda las Palmas',
    detalle: 'Cena, baile y celebración',
    mapa: 'https://maps.app.goo.gl/BcYAphitgjvXHHNTA',
  },
  {
    hora: '2:00 am',
    titulo: 'After',
    lugar: 'Veranda Food Garden',
    detalle: 'Para los que siguen con nosotros',
    mapa: 'https://maps.app.goo.gl/LrR9A2zePWCxXsmG8',
  },
  {
    hora: '2:00 pm',
    titulo: 'Post boda',
    lugar: 'Campo Galicia',
    detalle: 'Domingo 29 de noviembre',
    mapa: 'https://maps.app.goo.gl/nrgAmdHknGkB3V9P7',
  },
]

export default function PlantillaPaolaYJorge({ boda, modoPreview = false }) {
  const [abierta, setAbierta] = useState(false)

  useEffect(() => {
    document.body.style.overflow = abierta ? '' : 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierta])

  const fotos = boda?.galeria_fotos || []

  return (
    <main className="plantilla-paola-jorge min-h-screen font-body text-foreground">
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;1,400&family=Jost:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      {modoPreview && <PreviewBanner />}
      {!abierta && <Sobre onAbrir={() => setAbierta(true)} />}

      <Portada boda={boda} />
      <Frase />
      <Countdown />

      {(fotos[0] || fotos[1]) && <GaleriaPar fotos={[fotos[0], fotos[1]]} />}

      <Itinerario modoPreview={modoPreview} />

      {fotos[2] && <FotoAncha src={fotos[2]} />}

      <Vestimenta />
      <Regalos />

      {fotos[3] && <FotoAncha src={fotos[3]} alto="h-[60vh]" />}

      <SearchAndRsvp boda={boda} modoPreview={modoPreview} />

      <Footer />
    </main>
  )
}

function PreviewBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-foreground text-background text-center py-2 text-[11px] uppercase tracking-widest-xl">
      Vista de muestra — invitación real, ubicación y confirmación ocultas
    </div>
  )
}

// ============================================
// SOBRE — pantalla de entrada
// ============================================
function Sobre({ onAbrir }) {
  const [opening, setOpening] = useState(false)

  const handle = () => {
    if (opening) return
    setOpening(true)
    window.setTimeout(onAbrir, 2000)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 py-10 transition-opacity duration-500 ${
        opening ? 'envelope-exit' : ''
      }`}
    >
      <img
        src="/plantilla-paola-jorge/wood-backdrop.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(20,10,4,0.55)_100%)]" />

      <button
        onClick={handle}
        aria-label="Abrir invitación"
        className="envelope-scene group relative aspect-[3/4.1] w-full max-w-[19rem] cursor-pointer sm:max-w-[21rem]"
      >
        <span className="absolute -inset-x-6 -bottom-6 top-6 -z-10 rounded-[40%] bg-[rgba(15,8,3,0.55)] blur-2xl" />

        <span
          className={`absolute inset-x-[7%] top-[2%] z-10 flex h-[93%] flex-col items-center justify-start rounded-[2px] bg-[oklch(0.975_0.008_88)] pt-9 text-center shadow-[0_8px_18px_-12px_rgba(0,0,0,0.6)] ${
            opening ? 'letter-rise' : ''
          }`}
        >
          <span className="text-[0.5rem] uppercase tracking-[0.45em] text-muted-foreground">
            Nuestra boda
          </span>
          <span className="mt-3 font-display text-3xl italic text-clay">Paola &amp; Jorge</span>
        </span>

        <span className="kraft-paper absolute inset-0 z-20 overflow-hidden rounded-[3px] [clip-path:polygon(0_0,38%_0,40%_3.5%,44%_5.5%,56%_5.5%,60%_3.5%,62%_0,100%_0,100%_100%,0_100%)]">
          <img
            src="/plantilla-paola-jorge/kraft-texture.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-100 mix-blend-multiply"
          />
          <span className="paper-grain absolute inset-0" />
          <span className="absolute inset-0 bg-[linear-gradient(105deg,rgba(255,240,220,0.28)_0%,transparent_35%,transparent_68%,rgba(40,20,8,0.34)_100%)]" />
          <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_18%,rgba(255,242,220,0.22)_0%,transparent_58%)]" />
          <span className="absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(to_right,rgba(255,245,225,0.4),transparent)]" />
          <span className="absolute inset-x-0 bottom-0 h-[6%] bg-[linear-gradient(to_top,rgba(35,18,6,0.28),transparent)]" />
        </span>

        <span className="absolute inset-0 z-30 overflow-hidden rounded-[3px]">
          {[
            [41.2, -1.1],
            [42.6, -0.4],
            [44, 0.4],
            [45.4, 1.1],
          ].map(([top, rot]) => (
            <span
              key={top}
              className="absolute left-[-4%] right-[-4%] h-px bg-[linear-gradient(to_right,transparent,var(--gold),transparent)] opacity-80 shadow-[0_1px_1px_rgba(60,35,10,0.45)]"
              style={{ top: `${top}%`, transform: `rotate(${rot}deg)` }}
            />
          ))}
        </span>

        <span
          className={`absolute left-1/2 top-[43%] z-40 flex h-[4.6rem] w-[4.6rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-all duration-500 ${
            opening ? 'seal-break' : 'group-hover:scale-[1.06]'
          }`}
          style={{ filter: 'drop-shadow(0 6px 10px rgba(40,22,6,0.55))' }}
        >
          <img
            src="/plantilla-paola-jorge/wax-seal.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain"
          />
          <span className="relative flex items-baseline font-display text-lg leading-none tracking-[0.05em] text-[oklch(0.42_0.07_65)] [text-shadow:0_1px_0_rgba(255,246,220,0.45),0_-1px_1px_rgba(60,35,10,0.55)]">
            <span className="text-xl">P</span>
            <span className="mx-[1px] text-sm italic">&amp;</span>
            <span className="text-xl">J</span>
          </span>
        </span>

        <span className="absolute inset-x-0 bottom-[11%] z-30 flex flex-col items-center">
          <span className="relative font-display text-[1.75rem] leading-[0.95] tracking-[0.04em]">
            <span className="absolute inset-0 translate-x-[0.5px] translate-y-[0.5px] text-[oklch(0.25_0.03_55/0.28)] blur-[0.3px]">
              Paola
            </span>
            <span className="relative bg-gradient-to-br from-[oklch(0.56_0.075_78)] via-[oklch(0.88_0.095_85)] to-[oklch(0.66_0.085_80)] bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,240,210,0.35)]">
              Paola
            </span>
          </span>
          <span className="my-0.5 flex items-center gap-2">
            <span className="h-px w-5 bg-gradient-to-r from-transparent via-[oklch(0.66_0.08_80/0.55)] to-transparent" />
            <span className="relative font-display text-lg italic leading-none">
              <span className="absolute inset-0 translate-x-[0.5px] translate-y-[0.5px] text-[oklch(0.25_0.03_55/0.28)] blur-[0.3px]">
                &amp;
              </span>
              <span className="relative bg-gradient-to-br from-[oklch(0.56_0.075_78)] via-[oklch(0.88_0.095_85)] to-[oklch(0.66_0.085_80)] bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,240,210,0.35)]">
                &amp;
              </span>
            </span>
            <span className="h-px w-5 bg-gradient-to-r from-transparent via-[oklch(0.66_0.08_80/0.55)] to-transparent" />
          </span>
          <span className="relative font-display text-[1.75rem] leading-[0.95] tracking-[0.04em]">
            <span className="absolute inset-0 translate-x-[0.5px] translate-y-[0.5px] text-[oklch(0.25_0.03_55/0.28)] blur-[0.3px]">
              Jorge
            </span>
            <span className="relative bg-gradient-to-br from-[oklch(0.56_0.075_78)] via-[oklch(0.88_0.095_85)] to-[oklch(0.66_0.085_80)] bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,240,210,0.35)]">
              Jorge
            </span>
          </span>
          <span className="relative mt-2.5 font-body text-[0.55rem] uppercase tracking-[0.32em]">
            <span className="absolute inset-0 translate-x-[0.3px] translate-y-[0.3px] text-[oklch(0.25_0.03_55/0.24)] blur-[0.2px]">
              28 · 11 · 2026
            </span>
            <span className="relative bg-gradient-to-b from-[oklch(0.82_0.09_85)] to-[oklch(0.60_0.075_78)] bg-clip-text text-transparent opacity-90">
              28 · 11 · 2026
            </span>
          </span>
        </span>
      </button>

      <p className="relative mt-8 text-[0.65rem] uppercase tracking-widest-xl text-[oklch(0.92_0.02_85)]">
        {opening ? 'Abriendo…' : 'Toca el sobre para abrir'}
      </p>
    </div>
  )
}

// ============================================
// SECCIONES DE LA INVITACIÓN
// ============================================
function Divider() {
  return (
    <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 py-2">
      <span className="h-px flex-1 bg-foreground/30" />
      <span className="h-1.5 w-1.5 rotate-45 bg-clay" />
      <span className="h-px flex-1 bg-foreground/30" />
    </div>
  )
}

function Label({ children, className = '' }) {
  return (
    <p className={`text-muted-foreground text-[0.65rem] uppercase tracking-widest-xl ${className}`}>
      {children}
    </p>
  )
}

function generarMonogramaSVG() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
      <rect width="900" height="1200" fill="#e3d5c3" />
      <text x="450" y="620" font-family="Georgia, serif" font-style="italic" font-size="120" fill="#a67c5b" text-anchor="middle">P&amp;J</text>
    </svg>
  `.trim()
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function Portada({ boda }) {
  const imagen = boda?.imagen_fondo_url || generarMonogramaSVG()
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <img
        src={imagen}
        alt="Paola y Jorge sonriendo frente a una puerta de madera"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-background/70" />
      <div className="fade-up relative z-10 px-6 text-center">
        <Label className="font-normal text-foreground">Nos casamos</Label>
        <h1 className="mt-6 font-display text-6xl leading-none text-foreground sm:text-8xl">
          Paola
          <span className="mx-3 italic text-clay">&amp;</span>
          Jorge
        </h1>
        <div className="mt-8">
          <Divider />
        </div>
        <p className="mt-2 text-sm font-normal uppercase tracking-[0.32em] text-foreground">
          28 · Noviembre · 2026
        </p>
        <p className="mt-2 text-xs font-normal uppercase tracking-[0.28em] text-foreground">
          Ciudad Obregón, Sonora
        </p>
      </div>
    </section>
  )
}

function Frase() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="font-display text-2xl italic leading-relaxed text-foreground sm:text-3xl">
        &ldquo;Y sobre todas estas cosas vístanse de amor, que es el vínculo perfecto.&rdquo;
      </p>
      <p className="mt-6 text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
        Colosenses 3:14
      </p>
    </section>
  )
}

function useCountdown(target) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target.getTime() - now.getTime())
  return {
    dias: Math.floor(diff / 86400000),
    horas: Math.floor((diff % 86400000) / 3600000),
    min: Math.floor((diff % 3600000) / 60000),
    seg: Math.floor((diff % 60000) / 1000),
  }
}

function Countdown() {
  const c = useCountdown(FECHA_BODA)
  return (
    <section className="relative overflow-hidden border-y border-border bg-sand/40 py-16">
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Label>Faltan</Label>
        <div className="mt-8 grid grid-cols-4 gap-4">
          {[
            ['Días', c.dias],
            ['Horas', c.horas],
            ['Min', c.min],
            ['Seg', c.seg],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="font-display text-4xl text-foreground sm:text-6xl">
                {String(v).padStart(2, '0')}
              </p>
              <p className="mt-2 text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
                {l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GaleriaPar({ fotos }) {
  return (
    <section className="grid gap-2 p-2 sm:grid-cols-2">
      {fotos.map(
        (src, i) =>
          src && (
            <img key={i} src={src} alt="" loading="lazy" className="h-[70vh] w-full object-cover" />
          )
      )}
    </section>
  )
}

function FotoAncha({ src, alto = 'h-[60vh]' }) {
  return (
    <section className="relative">
      <img src={src} alt="" loading="lazy" className={`${alto} w-full object-cover`} />
    </section>
  )
}

function Itinerario({ modoPreview }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="text-center">
        <Label>El gran día</Label>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">Itinerario</h2>
        <Divider />
      </div>

      <ol className="mt-12 space-y-10">
        {ITINERARIO.map((e) => (
          <li
            key={e.titulo}
            className="grid gap-3 border-b border-border pb-10 last:border-0 sm:grid-cols-[7rem_1fr] sm:gap-8"
          >
            <p className="pt-1 text-sm uppercase tracking-[0.22em] text-clay">{e.hora}</p>
            <div>
              <h3 className="font-display text-2xl">{e.titulo}</h3>
              <p className="mt-1 text-sm text-foreground/90">
                {modoPreview ? 'Ubicación disponible en la invitación real' : e.lugar}
              </p>
              {!modoPreview && <p className="mt-1 text-sm text-muted-foreground">{e.detalle}</p>}
              {!modoPreview && (
                <a
                  href={e.mapa}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block border-b border-clay pb-1 text-[0.65rem] uppercase tracking-[0.28em] text-clay transition-opacity hover:opacity-60"
                >
                  Ver ubicación
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Vestimenta() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <Label>Código de vestimenta</Label>
      <h2 className="mt-4 font-display text-4xl sm:text-5xl">Formal</h2>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
        Vestido largo para damas y traje para caballeros.
      </p>
      <div className="mx-auto mt-10 max-w-md border border-border bg-background px-8 py-8">
        <p className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
          Colores reservados
        </p>
        <p className="mt-4 font-display text-2xl">Rojo y blanco</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Te pedimos amablemente evitar estos colores.
        </p>
      </div>
      <p className="mt-10 font-display text-2xl italic text-clay">Celebración solo para adultos</p>
    </section>
  )
}

function Regalos() {
  return (
    <section className="border-y border-border bg-sand/40 py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Label>Mesa de regalos</Label>
        <p className="mt-8 font-display text-2xl italic leading-relaxed sm:text-3xl">
          Su presencia será nuestro mejor regalo.
        </p>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Si desean tener un detalle con nosotros, pueden contribuir a nuestro sueño de construir
          nuestro primer hogar.
        </p>
        <div className="mx-auto mt-10 max-w-sm border border-border bg-background px-8 py-8 text-left">
          <p className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">Banco</p>
          <p className="mt-1 text-sm">HSBC</p>
          <p className="mt-5 text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
            Titular
          </p>
          <p className="mt-1 text-sm">Claudia Paola Valenzuela Parra</p>
          <p className="mt-5 text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
            Tarjeta de débito
          </p>
          <p className="mt-1 text-sm tabular-nums">4213 1660 4864 5851</p>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">También se aceptan sobrecitos.</p>
      </div>
    </section>
  )
}

// ============================================
// RSVP real — buscador + confirmación (Firestore / Cloud Functions)
// ============================================
function SearchAndRsvp({ boda, modoPreview }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    if (modoPreview) return
    if (seleccionado) return
    if (!query.trim()) {
      setResultados(null)
      return
    }
    const espera = setTimeout(async () => {
      setBuscando(true)
      try {
        const fn = httpsCallable(functions, 'buscarInvitado')
        const res = await fn({ bodaSlug: boda?.slug, nombreBusqueda: query.trim() })
        setResultados(res.data.resultados)
      } catch (e) {
        setResultados([])
      }
      setBuscando(false)
    }, 350)
    return () => clearTimeout(espera)
  }, [query, seleccionado, modoPreview, boda?.slug])

  function elegir(inv) {
    setSeleccionado(inv)
    setQuery(inv.nombre_familia)
    setResultados(null)
  }

  function buscarDeNuevo() {
    setSeleccionado(null)
    setQuery('')
    setResultados(null)
  }

  if (modoPreview) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <Label>Confirmación de asistencia</Label>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">¿Nos acompañas?</h2>
        <div className="mx-auto mt-10 border border-border bg-background p-10 text-sm italic text-muted-foreground">
          En la invitación real, cada invitado busca su nombre aquí y confirma su asistencia.
          Esta parte queda deshabilitada en la vista de muestra.
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <Label>Confirmación de asistencia</Label>
      <h2 className="mt-4 font-display text-4xl sm:text-5xl">¿Nos acompañas?</h2>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
        Busca tu nombre o familia para confirmar tu lugar en esta celebración.
      </p>

      {!seleccionado && (
        <div className="relative mt-10 text-left">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Escribe tu nombre o familia..."
            className="w-full border-b border-border bg-transparent px-2 py-4 text-center italic transition-colors placeholder:text-muted-foreground focus:border-clay focus:outline-none"
          />
          {query.trim() && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 border border-border bg-background shadow-lg">
              {buscando && (
                <p className="p-4 text-center text-sm italic text-muted-foreground">Buscando…</p>
              )}
              {!buscando && resultados?.length === 0 && (
                <p className="p-4 text-center text-sm italic text-muted-foreground">
                  No encontramos ese nombre.
                </p>
              )}
              {!buscando &&
                resultados?.map((r) => (
                  <button
                    key={r.invitado_id}
                    onClick={() => elegir(r)}
                    className="block w-full border-b border-border px-4 py-3 text-center font-display italic hover:bg-sand/40"
                  >
                    {r.nombre_familia}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {seleccionado && (
        <GuestCardYRsvp boda={boda} invitado={seleccionado} onBuscarDeNuevo={buscarDeNuevo} />
      )}
    </section>
  )
}

function GuestCardYRsvp({ boda, invitado, onBuscarDeNuevo }) {
  const [attending, setAttending] = useState(null)
  const [count, setCount] = useState(invitado.pases_asignados)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)

  async function enviar() {
    setEnviando(true)
    setError(null)
    try {
      const fn = httpsCallable(functions, 'confirmarRSVP')
      await fn({
        bodaSlug: boda?.slug,
        invitadoId: invitado.invitado_id,
        pasesConfirmados: attending ? count : 0,
        mensaje: attending ? mensaje : '',
      })
      setEnviado(true)
    } catch (e) {
      setError(e.message || 'No se pudo confirmar. Intenta de nuevo.')
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <div className="mt-10 border border-border bg-background p-12 text-center">
        <Label>Recibido</Label>
        <h3 className="mt-4 font-display text-3xl italic">¡Gracias!</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          {attending
            ? `Confirmamos ${count} ${count === 1 ? 'pase' : 'pases'}. Nos vemos en Ciudad Obregón.`
            : 'Lamentamos que no puedas acompañarnos. Estaremos pensando en ti.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-10 text-left">
      <div className="border border-border bg-background p-10 text-center">
        <Label>Bienvenido</Label>
        <h3 className="mt-2 font-display text-2xl">{invitado.nombre_familia}</h3>
        <Divider />
        <p className="text-sm italic leading-relaxed text-muted-foreground">
          Su grupo cuenta con
        </p>
        <div className="mx-auto mt-4 inline-block border border-clay/50 px-6 py-3">
          <span className="font-display text-2xl text-clay">
            {invitado.pases_asignados}{' '}
            {invitado.pases_asignados === 1 ? 'lugar en total' : 'lugares en total'}
          </span>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-xl text-center">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setAttending(true)
              setCount(invitado.pases_asignados)
            }}
            className={`w-full border py-4 text-sm uppercase tracking-widest-xl transition-colors ${
              attending === true
                ? 'border-clay bg-clay text-background'
                : 'border-border text-foreground hover:border-clay'
            }`}
          >
            Asistiré con gusto
          </button>
          <button
            onClick={() => {
              setAttending(false)
              setCount(0)
            }}
            className={`w-full border py-4 text-sm uppercase tracking-widest-xl transition-colors ${
              attending === false
                ? 'border-clay bg-sand/40 text-clay'
                : 'border-border text-foreground hover:border-clay'
            }`}
          >
            Lamentablemente no puedo
          </button>
        </div>

        {attending === true && (
          <div className="mt-8 space-y-8 border border-border bg-background p-8 text-left">
            <div>
              <Label>¿Cuántos asistirán en total? (máximo {invitado.pases_asignados})</Label>
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.max(0, c - 1))}
                  className="size-10 border border-border text-clay hover:border-clay"
                >
                  −
                </button>
                <span className="w-12 text-center font-display text-3xl">{count}</span>
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.min(invitado.pases_asignados, c + 1))}
                  className="size-10 border border-border text-clay hover:border-clay"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <Label>Déjale un mensaje a los novios (opcional)</Label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                className="mt-3 w-full border border-border bg-transparent p-3 text-sm italic focus:border-clay focus:outline-none"
                placeholder="Un mensaje bonito, buenos deseos, lo que quieras…"
              />
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {attending !== null && (
          <button
            onClick={enviar}
            disabled={enviando}
            className="mt-8 w-full border border-clay bg-clay py-4 text-sm uppercase tracking-widest-xl text-background transition-opacity hover:opacity-90"
          >
            {enviando ? 'Enviando…' : 'Enviar confirmación'}
          </button>
        )}

        <button
          onClick={onBuscarDeNuevo}
          className="mt-4 text-xs uppercase tracking-widest-xl text-muted-foreground"
        >
          No soy yo, buscar de nuevo
        </button>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border py-14 text-center">
      <p className="font-display text-3xl">
        P <span className="italic text-clay">&amp;</span> J
      </p>
      <p className="mt-4 text-[0.6rem] uppercase tracking-widest-xl text-muted-foreground">
        28.11.2026 · Cd. Obregón, Sonora
      </p>
      <p className="mt-6 text-[11px] text-muted-foreground">Hecho con cariño por Aria Eventos</p>
    </footer>
  )
}
