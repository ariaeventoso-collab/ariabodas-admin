import { useEffect, useMemo, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebaseClient'
import './jardin-botanico.css'

const HERO_DEFECTO = '/plantilla-jardin/hero-botanical.jpg'
const GALERIA_DEFECTO = [
  { src: '/plantilla-jardin/gallery-1.jpg', h: 'aspect-[2/3]' },
  { src: '/plantilla-jardin/gallery-2.jpg', h: 'aspect-square md:translate-y-12' },
  { src: '/plantilla-jardin/gallery-3.jpg', h: 'aspect-[2/3]' },
]

function formatearHora(hora24) {
  if (!hora24) return ''
  const [h, m] = hora24.split(':').map(Number)
  const periodo = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`
}

// PLANTILLA: Jardín Botánico
// Diseñada en Lovable. Paleta salvia/dorado/lino, tipografía Playfair Display.
export default function PlantillaJardinBotanico({ boda }) {
  const [opened, setOpened] = useState(false)

  const monogram = `${boda.nombre_novio_1?.[0] || ''}&${boda.nombre_novio_2?.[0] || ''}`
  const fecha = boda.fecha_evento?.toDate ? boda.fecha_evento.toDate() : null
  const dateLabel = fecha
    ? fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <main className="plantilla-jardin-botanico min-h-screen font-sans text-charcoal selection:bg-gold/20">
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
      {!opened && <EnvelopeGate boda={boda} monogram={monogram} onOpen={() => setOpened(true)} />}
      <Cover boda={boda} monogram={monogram} dateLabel={dateLabel} />
      <SearchAndRsvp boda={boda} />
      {fecha && <Countdown fecha={fecha} />}
      {boda.itinerario?.length > 0 && <Itinerary eventos={boda.itinerario} />}
      {boda.regalos?.tipo?.length > 0 && <Gifts regalos={boda.regalos} />}
      <Gallery fotos={boda.galeria_fotos} />
      {boda.codigo_vestimenta && <DressCode texto={boda.codigo_vestimenta} />}
      <Notes boda={boda} monogram={monogram} />
    </main>
  )
}

// ============================================
// Sobre animado
// ============================================
function EnvelopeGate({ boda, monogram, onOpen }) {
  const [opening, setOpening] = useState(false)
  const handle = () => {
    setOpening(true)
    setTimeout(onOpen, 1100)
  }
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-sage-deep transition-all duration-1000 ${
        opening ? '-translate-y-full opacity-0' : ''
      }`}
    >
      <div className="text-center px-6">
        <div className="mx-auto mb-8 flex size-24 items-center justify-center rounded-full border border-linen/30">
          <span className="font-serif text-3xl italic text-linen">{monogram}</span>
        </div>
        <p className="mb-2 text-xs uppercase tracking-[0.4em] text-linen/70">Tienes una invitación</p>
        <h2 className="font-serif text-3xl italic text-linen md:text-4xl">
          {boda.nombre_novio_1} &amp; {boda.nombre_novio_2}
        </h2>
        <button
          onClick={handle}
          className="mt-10 border border-linen/40 px-8 py-3 text-[10px] uppercase tracking-[0.3em] text-linen transition-colors hover:bg-linen hover:text-sage-deep"
        >
          Abrir sobre
        </button>
      </div>
    </div>
  )
}

// ============================================
// Portada
// ============================================
function Cover({ boda, monogram, dateLabel }) {
  return (
    <header className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-10">
        <span className="mb-4 block text-[10px] uppercase tracking-[0.5em] text-gold">Nuestra Boda</span>
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-gold/40">
          <span className="font-serif text-xl italic text-gold">{monogram}</span>
        </div>
        <h1 className="font-serif text-6xl italic text-sage md:text-8xl">
          {boda.nombre_novio_1}
          <span className="mx-3 font-sans text-3xl not-italic text-gold/60 md:text-4xl">&amp;</span>
          {boda.nombre_novio_2}
        </h1>
        <p className="mt-4 font-light italic text-charcoal/60">
          {dateLabel}{boda.ciudad ? ` · ${boda.ciudad}${boda.estado ? `, ${boda.estado}` : ''}` : ''}
        </p>
      </div>
      <div className="w-full max-w-md overflow-hidden rounded-t-full bg-sage/5 outline outline-1 -outline-offset-1 outline-charcoal/5">
        <img
          src={boda.imagen_fondo_url || HERO_DEFECTO}
          alt="Portada"
          className="h-full w-full object-cover"
        />
      </div>
    </header>
  )
}

// ============================================
// Buscador + tarjeta de invitado + RSVP (unidos, ya que el RSVP
// depende de saber quién eres)
// ============================================
function SearchAndRsvp({ boda }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    if (seleccionado) return
    if (!query.trim()) { setResultados(null); return }
    const espera = setTimeout(async () => {
      setBuscando(true)
      try {
        const fn = httpsCallable(functions, 'buscarInvitado')
        const res = await fn({ bodaSlug: boda.slug, nombreBusqueda: query.trim() })
        setResultados(res.data.resultados)
      } catch (e) {
        setResultados([])
      }
      setBuscando(false)
    }, 350)
    return () => clearTimeout(espera)
  }, [query, seleccionado])

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

  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <span className="mb-3 block text-[10px] uppercase tracking-[0.4em] text-gold">Personalizada para ti</span>
      <h2 className="mb-8 font-serif text-3xl italic">Busca tu invitación</h2>

      {!seleccionado && (
        <div className="relative mb-12 text-left">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Escribe tu nombre o familia..."
            className="w-full border-b border-sage/30 bg-transparent px-2 py-4 italic text-center transition-colors placeholder:text-charcoal/40 focus:border-gold focus:outline-none"
          />
          {query.trim() && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-sm border border-sage/15 bg-white shadow-soft">
              {buscando && <p className="p-4 text-center text-sm italic text-charcoal/50">Buscando…</p>}
              {!buscando && resultados?.length === 0 && (
                <p className="p-4 text-center text-sm italic text-charcoal/50">No encontramos ese nombre.</p>
              )}
              {!buscando && resultados?.map((r) => (
                <button
                  key={r.invitado_id}
                  onClick={() => elegir(r)}
                  className="block w-full border-b border-sage/5 px-4 py-3 text-center font-serif italic hover:bg-sage/5"
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
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)

  async function enviar() {
    setEnviando(true)
    setError(null)
    try {
      const fn = httpsCallable(functions, 'confirmarRSVP')
      await fn({
        bodaSlug: boda.slug,
        invitadoId: invitado.invitado_id,
        pasesConfirmados: attending ? count : 0,
        notas: attending ? notas : '',
      })
      setEnviado(true)
    } catch (e) {
      setError(e.message || 'No se pudo confirmar. Intenta de nuevo.')
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <div className="rounded-sm border border-sage/15 bg-white p-12 text-center shadow-soft">
        <span className="mb-3 block text-[10px] uppercase tracking-[0.4em] text-gold">Recibido</span>
        <h2 className="mb-4 font-serif text-3xl italic">¡Gracias!</h2>
        <p className="text-sm italic text-charcoal/70">
          {attending
            ? `Confirmamos ${count} ${count === 1 ? 'pase' : 'pases'}. Nos vemos${boda.ciudad ? ` en ${boda.ciudad}` : ''}.`
            : 'Lamentamos que no puedas acompañarnos. Estaremos pensando en ti.'}
        </p>
      </div>
    )
  }

  return (
    <div className="text-left">
      {/* Tarjeta de bienvenida */}
      <div className="mb-8 rounded-sm border border-sage/10 bg-white p-10 text-center shadow-card">
        <span className="mb-4 block text-xs uppercase tracking-[0.3em] text-gold">Bienvenido</span>
        <h3 className="mb-2 font-serif text-2xl">{invitado.nombre_familia}</h3>
        <div className="mx-auto my-6 h-px w-12 bg-gold/40" />
        <p className="mb-6 text-sm italic leading-relaxed text-charcoal/70">
          Nos encantaría compartir este día tan especial contigo. Su grupo cuenta con:
        </p>
        <div className="inline-block rounded-full border border-sage/30 px-6 py-3">
          <span className="font-bold tracking-wide text-sage">
            {invitado.pases_asignados} {invitado.pases_asignados === 1 ? 'lugar en total' : 'lugares en total'}
          </span>
        </div>
      </div>

      {/* RSVP */}
      <div className="mx-auto max-w-xl text-center">
        <h2 className="mb-4 font-serif text-3xl italic">Confirmación</h2>
        <div className="mb-8 flex flex-col gap-3">
          <button
            onClick={() => { setAttending(true); setCount(invitado.pases_asignados) }}
            className={`w-full py-4 text-sm font-bold uppercase tracking-widest transition-all ${
              attending === true ? 'bg-sage-deep text-linen' : 'bg-sage text-linen hover:bg-sage-deep'
            }`}
          >
            Asistiré con gusto
          </button>
          <button
            onClick={() => { setAttending(false); setCount(0) }}
            className={`w-full py-4 text-sm uppercase tracking-widest transition-all ${
              attending === false ? 'border border-sage bg-sage/10 text-sage' : 'border border-sage/30 text-sage hover:bg-sage/5'
            }`}
          >
            Lamentablemente no puedo
          </button>
        </div>

        {attending === true && (
          <div className="space-y-8 rounded-sm border border-sage/10 bg-white p-8 text-left shadow-soft">
            <div>
              <label className="mb-3 block text-[10px] uppercase tracking-[0.3em] text-gold">
                ¿Cuántos asistirán en total? (máximo {invitado.pases_asignados})
              </label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setCount((c) => Math.max(0, c - 1))} className="size-10 border border-sage/30 text-sage hover:bg-sage/5">−</button>
                <span className="w-12 text-center font-serif text-3xl">{count}</span>
                <button type="button" onClick={() => setCount((c) => Math.min(invitado.pases_asignados, c + 1))} className="size-10 border border-sage/30 text-sage hover:bg-sage/5">+</button>
              </div>
            </div>
            <div>
              <label className="mb-3 block text-[10px] uppercase tracking-[0.3em] text-gold">Restricciones alimenticias</label>
              <textarea
                value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
                className="w-full border border-sage/20 bg-transparent p-3 text-sm italic focus:border-gold focus:outline-none"
                placeholder="Alergias o preferencias…"
              />
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {attending !== null && (
          <button
            onClick={enviar} disabled={enviando}
            className="mt-8 w-full bg-gold py-4 text-sm font-bold uppercase tracking-widest text-linen transition-all hover:bg-gold/90"
          >
            {enviando ? 'Enviando…' : 'Enviar Confirmación'}
          </button>
        )}

        <button onClick={onBuscarDeNuevo} className="mt-4 text-xs uppercase tracking-widest text-charcoal/40">
          No soy yo, buscar de nuevo
        </button>
      </div>
    </div>
  )
}

// ============================================
// Countdown
// ============================================
function useCountdown(target) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target.getTime() - now.getTime())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  }
}

function Countdown({ fecha }) {
  const { days, hours, mins, secs } = useCountdown(fecha)
  const items = [
    { n: days, l: 'Días' },
    { n: hours, l: 'Hrs' },
    { n: mins, l: 'Min' },
    { n: secs, l: 'Seg' },
  ]
  return (
    <section className="bg-sage py-16 text-linen">
      <div className="mx-auto max-w-xl px-6 text-center">
        <h3 className="mb-8 font-serif text-xl italic text-linen/90">Faltan solo...</h3>
        <div className="flex justify-center gap-8 md:gap-14">
          {items.map((i) => (
            <div key={i.l}>
              <span className="block font-serif text-4xl md:text-5xl">{String(i.n).padStart(2, '0')}</span>
              <span className="mt-2 block text-[10px] uppercase tracking-[0.3em] opacity-70">{i.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// Itinerario
// ============================================
function Itinerary({ eventos }) {
  return (
    <section className="bg-sage-deep px-6 py-24 text-linen">
      <div className="mx-auto max-w-xl">
        <h2 className="mb-16 text-center font-serif text-4xl italic">El Itinerario</h2>
        <div className="space-y-16">
          {eventos.map((e, i) => (
            <div key={i} className="flex items-start gap-6">
              <span className="shrink-0 font-serif text-2xl text-gold">{formatearHora(e.hora)}</span>
              <div>
                <h4 className="mb-1 text-lg font-medium uppercase tracking-wider">{e.nombre_evento}</h4>
                <p className="mb-4 text-sm text-linen/60">{e.lugar}</p>
                {e.link_mapa && (
                  <a href={e.link_mapa} target="_blank" rel="noreferrer" className="border-b border-gold/40 pb-1 text-xs uppercase tracking-widest text-gold">
                    Ver mapa
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// Regalos
// ============================================
function Gifts({ regalos }) {
  const tipos = regalos.tipo || []
  return (
    <section className="border-t border-sage/5 bg-linen-warm px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mb-3 block text-[10px] uppercase tracking-[0.4em] text-gold">Con cariño</span>
        <h2 className="mb-6 font-serif text-3xl italic">Mesa de Regalos</h2>
        <p className="mb-12 text-sm leading-relaxed text-charcoal/70">
          El mejor regalo es tu presencia. Si además deseas obsequiarnos algo, te dejamos estas opciones.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {tipos.includes('link_tienda') && regalos.link_tienda?.url && (
            <a href={regalos.link_tienda.url} target="_blank" rel="noreferrer" className="block rounded-sm border border-sage/10 bg-white p-6 transition-shadow hover:shadow-soft">
              <span className="mb-2 block text-xs uppercase tracking-widest text-gold">{regalos.link_tienda.nombre_tienda || 'Mesa de regalos'}</span>
              <span className="text-xs text-charcoal/50">Ver artículos</span>
            </a>
          )}
          {tipos.includes('cuenta_deposito') && regalos.cuenta_deposito && (
            <div className="rounded-sm border border-sage/10 bg-white p-6">
              <span className="mb-2 block text-xs uppercase tracking-widest text-gold">Depósito</span>
              <span className="text-xs text-charcoal/50">
                {regalos.cuenta_deposito.banco} · {regalos.cuenta_deposito.titular}<br />{regalos.cuenta_deposito.numero_cuenta}
              </span>
            </div>
          )}
          {tipos.includes('sobrecitos') && (
            <div className="rounded-sm border border-sage/10 bg-white p-6">
              <span className="mb-2 block text-xs uppercase tracking-widest text-gold">Sobrecitos</span>
              <span className="text-xs text-charcoal/50">{regalos.sobrecitos?.texto_mostrar}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ============================================
// Galería
// ============================================
function Gallery({ fotos }) {
  const items = fotos?.length > 0
    ? fotos.map((src, i) => ({ src, h: GALERIA_DEFECTO[i % 3].h }))
    : GALERIA_DEFECTO

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <span className="mb-3 block text-[10px] uppercase tracking-[0.4em] text-gold">Momentos</span>
          <h2 className="font-serif text-3xl italic">Nuestra historia</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((p, i) => (
            <div key={i} className={`overflow-hidden rounded-sm bg-sage/5 outline outline-1 -outline-offset-1 outline-charcoal/5 ${p.h}`}>
              <img src={p.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// Código de vestimenta
// ============================================
function DressCode({ texto }) {
  return (
    <section className="bg-sage/5 px-6 py-24 text-center">
      <div className="mx-auto max-w-md">
        <span className="mb-3 block text-[10px] uppercase tracking-[0.4em] text-gold">Código de Vestimenta</span>
        <div className="mx-auto my-6 h-px w-12 bg-gold/40" />
        <p className="text-sm leading-loose text-charcoal/70 whitespace-pre-wrap">{texto}</p>
      </div>
    </section>
  )
}

// ============================================
// Notas / pie de página
// ============================================
function Notes({ boda, monogram }) {
  return (
    <footer className="px-6 pb-24 pt-16 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {boda.notas_adicionales && (
          <p className="text-sm italic leading-relaxed text-charcoal/60 whitespace-pre-wrap">{boda.notas_adicionales}</p>
        )}
        <div className="mx-auto mt-12 flex size-14 items-center justify-center rounded-full border border-gold/40">
          <span className="font-serif text-lg italic text-gold">{monogram}</span>
        </div>
        {boda.ciudad && (
          <p className="pt-6 text-[10px] uppercase tracking-[0.4em] text-charcoal/40">Nos vemos en {boda.ciudad}</p>
        )}
      </div>
    </footer>
  )
}
