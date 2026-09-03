import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebaseClient'
import './paola-y-jorge.css'

// ============================================
// PLANTILLA DEDICADA: Paola y Jorge — 28 de noviembre de 2026
// VERSIÓN 2.0 FINAL - TODOS LOS CAMBIOS IMPLEMENTADOS:
// ✓ Placeholder mejorado: "Pon tu apellido o nombre..."
// ✓ Removidas secciones After y Post boda
// ✓ Icono de sobre 📧 en "También se aceptan sobrecitos"
// ✓ Datos bancarios ocultos en modo preview (landing)
// ✓ Nueva sección: Padres y Padrinos
// ============================================

const FECHA_BODA = new Date('2026-11-28T17:00:00-07:00')

// ITINERARIO FINAL - Solo 2 eventos (After y Post boda removidos)
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
      <PadresYPadrinos />
      <Regalos modoPreview={modoPreview} />

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
            <span>Paola</span>
          </span>
          <span className="mt-2 text-sm italic text-clay">&amp;</span>
          <span className="relative mt-2 font-display text-[1.75rem] leading-[0.95] tracking-[0.04em]">
            <span className="absolute inset-0 translate-x-[0.5px] translate-y-[0.5px] text-[oklch(0.25_0.03_55/0.28)] blur-[0.3px]">
              Jorge
            </span>
            <span>Jorge</span>
          </span>
        </span>
      </button>

      <p className="mt-16 text-center text-[0.6rem] uppercase tracking-[0.4em] text-muted-foreground">
        Click para abrir
      </p>
    </div>
  )
}

// ============================================
// PORTADA
// ============================================
function Portada({ boda }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,180,100,0.08),transparent_50%)]" />
      <img
        src={boda?.imagen_fondo_url || ''}
        alt=""
        className="h-[120vh] w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1),transparent_25%,transparent_75%,rgba(0,0,0,0.25))]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <h1 className="max-w-3xl font-display text-[3.5rem] leading-[0.9] sm:text-[5.5rem]">
          <span className="italic">Paola</span> <span>&amp;</span> <span className="italic">Jorge</span>
        </h1>
        <p className="mt-8 text-sm uppercase tracking-widest-xl text-muted-foreground">
          28 · Noviembre · 2026
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
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

// ============================================
// PADRES Y PADRINOS — CAMBIO 5 IMPLEMENTADO
// Nueva sección con todos los nombres proporcionados
// ============================================
function PadresYPadrinos() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <div className="text-center">
        <Label>Nuestras familias</Label>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">Padres y Padrinos</h2>
        <Divider />
      </div>

      <div className="mt-16 grid gap-16 sm:grid-cols-2">
        {/* PAOLA */}
        <div>
          <h3 className="mb-8 text-center font-display text-2xl italic text-clay">Paola</h3>
          
          {/* Madre */}
          <div className="mb-8 border-b border-border pb-8">
            <p className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
              Madre
            </p>
            <p className="mt-2 font-display text-lg">Claudia Paola Valenzuela Parra</p>
          </div>

          {/* Padre */}
          <div className="mb-8 border-b border-border pb-8">
            <p className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
              Padre
            </p>
            <p className="mt-2 font-display text-lg">Carlos Enrique Valenzuela Robles</p>
          </div>

          {/* Madrinas */}
          <div className="mb-8 border-b border-border pb-8">
            <p className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
              Madrinas
            </p>
            <p className="mt-2 font-display text-lg">Guadalupe Parra García</p>
            <p className="mt-1 font-display text-lg">Karina Parra García</p>
          </div>

          {/* Padrino */}
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
              Padrino
            </p>
            <p className="mt-2 font-display text-lg">Hugo Valenzuela Calderón</p>
          </div>
        </div>

        {/* JORGE */}
        <div>
          <h3 className="mb-8 text-center font-display text-2xl italic text-clay">Jorge</h3>
          
          {/* Madre */}
          <div className="mb-8 border-b border-border pb-8">
            <p className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
              Madre
            </p>
            <p className="mt-2 font-display text-lg">Gloria Eliza López Ramírez</p>
          </div>

          {/* Padre */}
          <div className="mb-8 border-b border-border pb-8">
            <p className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
              Padre
            </p>
            <p className="mt-2 font-display text-lg">Juan Jorge Vera Abonce</p>
          </div>

          {/* Madrina */}
          <div className="mb-8 border-b border-border pb-8">
            <p className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
              Madrina
            </p>
            <p className="mt-2 font-display text-lg">Verónica Herrera Islas</p>
          </div>

          {/* Padrino */}
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
              Padrino
            </p>
            <p className="mt-2 font-display text-lg">Luis Elías López Ramírez</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// REGALOS — CAMBIO 3 Y 4 IMPLEMENTADOS
// - Icono 📧 en "También se aceptan sobrecitos"
// - Datos bancarios ocultos en modo preview
// ============================================
function Regalos({ modoPreview }) {
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

        {/* DATOS BANCARIOS — Solo si NO es preview/landing */}
        {!modoPreview && (
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
        )}

        {/* SOBRECITOS — Con icono de sobre (CAMBIO 3) */}
        <p className="mt-8 text-sm text-muted-foreground">
          <span className="mr-2" title="Sobre">📧</span>
          También se aceptan sobrecitos.
        </p>
      </div>
    </section>
  )
}

// ============================================
// BÚSQUEDA Y RSVP — CAMBIO 1 IMPLEMENTADO
// Placeholder mejorado: "Pon tu apellido o nombre..."
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
            placeholder="Pon tu apellido o nombre..."
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

// ============================================
// COMPONENTES REUTILIZABLES
// ============================================

function Label({ children }) {
  return (
    <div className="text-[0.65rem] uppercase tracking-widest-xl text-muted-foreground">
      {children}
    </div>
  )
}

function Divider() {
  return <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-clay to-transparent" />
}
