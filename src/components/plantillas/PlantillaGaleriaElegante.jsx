import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebaseClient'
import './galeria-elegante.css'

function formatearHora(hora24) {
  if (!hora24) return ''
  const [h, m] = hora24.split(':').map(Number)
  const periodo = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`
}

// Portada automática cuando no hay imagen_fondo_url cargada en Diseño:
// mismo criterio que usan las otras plantillas, para no dejar la portada
// vacía mientras los novios suben sus fotos.
function generarMonogramaSVG(boda) {
  const inicial1 = boda.nombre_novio_1?.[0]?.toUpperCase() || ''
  const inicial2 = boda.nombre_novio_2?.[0]?.toUpperCase() || ''
  const fondo = boda.colores?.secundario || '#e3d5c3'
  const acento = boda.colores?.primario || '#a67c5b'

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
      <rect width="900" height="1200" fill="${fondo}" />
      <text x="450" y="620" font-family="Georgia, serif" font-style="italic" font-size="120" fill="${acento}" text-anchor="middle">${inicial1}&amp;${inicial2}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// PLANTILLA: Galería Elegante
// Portada a pantalla completa + fotografía como protagonista + paleta
// arcilla/arena. Recibe la boda ya cargada desde PublicInvitation.jsx.
export default function PlantillaGaleriaElegante({ boda, modoPreview = false }) {
  const estiloColores = {
    '--clay': boda.colores?.primario || undefined,
    '--sand': boda.colores?.secundario || undefined,
  }

  const fecha = boda.fecha_evento?.toDate ? boda.fecha_evento.toDate() : null
  const fechaLabel = fecha
    ? fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const fotos = boda.galeria_fotos || []
  const fotoAncha = fotos[2]
  const fotoFinal = fotos[3] || fotos[4]

  return (
    <main
      className="plantilla-galeria-elegante min-h-screen font-body text-foreground"
      style={estiloColores}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;1,400&family=Jost:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      {modoPreview && <PreviewBanner />}

      <Portada boda={boda} fechaLabel={fechaLabel} />
      {boda.notas_adicionales && <Frase texto={boda.notas_adicionales} />}
      {fecha && <Countdown fecha={fecha} />}

      {fotos.length >= 2 && <GaleriaPar fotos={[fotos[0], fotos[1]]} />}

      {boda.itinerario?.length > 0 && (
        <Itinerario eventos={boda.itinerario} modoPreview={modoPreview} />
      )}

      {fotoAncha && <FotoAncha src={fotoAncha} />}

      {boda.codigo_vestimenta && <Vestimenta texto={boda.codigo_vestimenta} />}

      {boda.regalos?.tipo?.length > 0 && <Regalos regalos={boda.regalos} />}

      {fotoFinal && <FotoAncha src={fotoFinal} alto="h-[60vh]" />}

      <SearchAndRsvp boda={boda} modoPreview={modoPreview} />

      <Footer boda={boda} />
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

function Divider() {
  return (
    <div className="mx-auto flex w-full max-w-xs items-center gap-4 py-2">
      <span className="h-px flex-1 bg-border" />
      <span className="text-clay text-xs">✦</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function Label({ children }) {
  return (
    <p className="text-muted-foreground text-[0.65rem] uppercase tracking-widest-xl">{children}</p>
  )
}

function Portada({ boda, fechaLabel }) {
  const imagen = boda.imagen_fondo_url || generarMonogramaSVG(boda)

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <img
        src={imagen}
        alt={`${boda.nombre_novio_1} y ${boda.nombre_novio_2}`}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-background/45" />
      <div className="fade-up relative z-10 px-6 text-center">
        <Label>Nos casamos</Label>
        <h1 className="mt-6 font-display text-6xl leading-none text-foreground sm:text-8xl">
          {boda.nombre_novio_1}
          <span className="mx-3 italic text-clay">&amp;</span>
          {boda.nombre_novio_2}
        </h1>
        <div className="mt-8">
          <Divider />
        </div>
        {fechaLabel && (
          <p className="mt-2 text-sm uppercase tracking-[0.32em] text-foreground/80">
            {fechaLabel}
          </p>
        )}
        {boda.ciudad && (
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
            {boda.ciudad}
            {boda.estado ? `, ${boda.estado}` : ''}
          </p>
        )}
      </div>
    </section>
  )
}

function Frase({ texto }) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="font-display text-2xl italic leading-relaxed text-foreground sm:text-3xl whitespace-pre-wrap">
        {texto}
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

function Countdown({ fecha }) {
  const c = useCountdown(fecha)
  return (
    <section className="border-y border-border bg-sand/40 py-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
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
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className="h-[70vh] w-full object-cover"
            />
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

function Itinerario({ eventos, modoPreview }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="text-center">
        <Label>El gran día</Label>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">Itinerario</h2>
        <Divider />
      </div>

      <ol className="mt-12 space-y-10">
        {eventos.map((e, i) => (
          <li
            key={i}
            className="grid gap-3 border-b border-border pb-10 last:border-0 sm:grid-cols-[7rem_1fr] sm:gap-8"
          >
            <p className="pt-1 text-sm uppercase tracking-[0.22em] text-clay">
              {formatearHora(e.hora)}
            </p>
            <div>
              <h3 className="font-display text-2xl">{e.nombre_evento}</h3>
              <p className="mt-1 text-sm text-foreground/90">
                {modoPreview ? 'Ubicación disponible en la invitación real' : e.lugar}
              </p>
              {e.link_mapa && !modoPreview && (
                <a
                  href={e.link_mapa}
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

function Vestimenta({ texto }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <Label>Código de vestimenta</Label>
      <div className="mx-auto mt-10 max-w-md border border-border bg-background px-8 py-8">
        <p className="whitespace-pre-wrap font-display text-2xl">{texto}</p>
      </div>
    </section>
  )
}

function Regalos({ regalos }) {
  const tipos = regalos.tipo || []
  return (
    <section className="border-y border-border bg-sand/40 py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Label>Mesa de regalos</Label>
        <p className="mt-8 font-display text-2xl italic leading-relaxed sm:text-3xl">
          Su presencia será nuestro mejor regalo.
        </p>

        {tipos.includes('link_tienda') && regalos.link_tienda?.url && (
          <a
            href={regalos.link_tienda.url}
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-10 inline-block border border-clay px-10 py-4 text-[0.65rem] uppercase tracking-widest-xl text-clay transition-colors hover:bg-clay hover:text-background"
          >
            Ver mesa de regalos — {regalos.link_tienda.nombre_tienda}
          </a>
        )}

        {tipos.includes('cuenta_deposito') && regalos.cuenta_deposito && (
          <div className="mx-auto mt-10 max-w-sm border border-border bg-background px-8 py-8 text-left">
            <p className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
              Banco
            </p>
            <p className="mt-1 text-sm">{regalos.cuenta_deposito.banco}</p>
            <p className="mt-5 text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
              Titular
            </p>
            <p className="mt-1 text-sm">{regalos.cuenta_deposito.titular}</p>
            <p className="mt-5 text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
              Cuenta
            </p>
            <p className="mt-1 text-sm tabular-nums">{regalos.cuenta_deposito.numero_cuenta}</p>
          </div>
        )}

        {tipos.includes('sobrecitos') && (
          <p className="mt-8 text-sm text-muted-foreground">
            {regalos.sobrecitos?.texto_mostrar || 'También se aceptan sobrecitos.'}
          </p>
        )}
      </div>
    </section>
  )
}

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
        const res = await fn({ bodaSlug: boda.slug, nombreBusqueda: query.trim() })
        setResultados(res.data.resultados)
      } catch (e) {
        setResultados([])
      }
      setBuscando(false)
    }, 350)
    return () => clearTimeout(espera)
  }, [query, seleccionado, modoPreview, boda.slug])

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
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <Label>Confirmación de asistencia</Label>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">¿Nos acompañas?</h2>
        <div className="mx-auto mt-10 border border-border bg-background p-10 text-sm italic text-muted-foreground">
          En la invitación real, cada invitado busca su nombre aquí y confirma su
          asistencia. Esta parte queda deshabilitada en la vista de muestra.
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <Label>Confirmación de asistencia</Label>
      <h2 className="mt-4 font-display text-4xl sm:text-5xl">¿Nos acompañas?</h2>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
        Busca tu nombre o familia para confirmar tu lugar.
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
        bodaSlug: boda.slug,
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
            ? `Confirmamos ${count} ${count === 1 ? 'pase' : 'pases'}. Nos vemos${
                boda.ciudad ? ` en ${boda.ciudad}` : ''
              }.`
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

function Footer({ boda }) {
  return (
    <footer className="border-t border-border py-14 text-center">
      <p className="font-display text-3xl">
        {boda.nombre_novio_1?.[0]} <span className="italic text-clay">&amp;</span>{' '}
        {boda.nombre_novio_2?.[0]}
      </p>
      <p className="mt-4 text-[0.6rem] uppercase tracking-widest-xl text-muted-foreground">
        {boda.ciudad}
        {boda.estado ? `, ${boda.estado}` : ''}
      </p>
      <p className="mt-6 text-[11px] text-muted-foreground">Hecho con cariño por Aria Eventos</p>
    </footer>
  )
}
