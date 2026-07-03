import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../lib/firebaseClient'

export default function PublicInvitation() {
  const { slug } = useParams()
  const [boda, setBoda] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [sobreAbierto, setSobreAbierto] = useState(false)

  useEffect(() => {
    cargarBoda()
  }, [slug])

  async function cargarBoda() {
    setCargando(true)
    try {
      const q = query(collection(db, 'bodas'), where('slug', '==', slug))
      const snap = await getDocs(q)
      if (snap.empty) {
        setError('No encontramos esta invitación.')
      } else {
        setBoda({ id: snap.docs[0].id, ...snap.docs[0].data() })
      }
    } catch (e) {
      setError('Ocurrió un problema al cargar la invitación.')
    }
    setCargando(false)
  }

  const colores = boda?.colores || {}
  const primario = colores.primario || '#7C8B6F'
  const claro = colores.secundario || '#E7ECE1'
  const fondoImg = boda?.imagen_fondo_url

  if (cargando) {
    return <PantallaCentrada><p style={{ color: '#999', fontSize: 14 }}>Cargando…</p></PantallaCentrada>
  }

  if (error || !boda) {
    return <PantallaCentrada><p style={{ color: '#a33', fontSize: 14 }}>{error}</p></PantallaCentrada>
  }

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'Cormorant Garamond', serif",
      background: claro,
      color: '#2B2A26',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet" />

      {!sobreAbierto ? (
        <Sobre boda={boda} primario={primario} claro={claro} onAbrir={() => setSobreAbierto(true)} />
      ) : (
        <ContenidoInvitacion boda={boda} primario={primario} claro={claro} fondoImg={fondoImg} />
      )}
    </div>
  )
}

function PantallaCentrada({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      {children}
    </div>
  )
}

// ============================================
// SECCIÓN 1: Sobre animado
// ============================================
function Sobre({ boda, primario, claro, onAbrir }) {
  const iniciales = `${boda.nombre_novio_1?.[0] || ''}${boda.nombre_novio_2?.[0] || ''}`

  return (
    <div
      onClick={onAbrir}
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        background: claro, padding: '2rem',
      }}
    >
      <div style={{
        width: 260, height: 180, background: primario, borderRadius: 6,
        position: 'relative', boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', background: '#F4EFE4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: primario, fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}>
          {iniciales}
        </div>
      </div>
      <p style={{ marginTop: 24, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', color: '#6b6b63', fontFamily: 'Inter, sans-serif' }}>
        Click para abrir
      </p>
    </div>
  )
}

// ============================================
// Contenido principal después de abrir el sobre
// ============================================
function ContenidoInvitacion({ boda, primario, claro, fondoImg }) {
  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      backgroundImage: fondoImg ? `url(${fondoImg})` : undefined,
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundColor: fondoImg ? undefined : '#fff',
    }}>
      <div style={{ background: fondoImg ? 'rgba(255,255,255,0.88)' : 'transparent', minHeight: '100vh' }}>

        <Portada boda={boda} primario={primario} />
        <Countdown fecha={boda.fecha_evento} primario={primario} />
        {boda.itinerario?.length > 0 && <Itinerario eventos={boda.itinerario} primario={primario} />}
        <BuscadorRSVP boda={boda} primario={primario} claro={claro} />
        {boda.regalos && <Regalos regalos={boda.regalos} primario={primario} />}
        {boda.galeria_fotos?.length > 0 && <Galeria fotos={boda.galeria_fotos} />}
        {boda.codigo_vestimenta && <NotaSimple titulo="Código de vestimenta" texto={boda.codigo_vestimenta} primario={primario} />}
        {boda.notas_adicionales && <NotaSimple titulo="Notas" texto={boda.notas_adicionales} primario={primario} />}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#999', padding: '2rem 1rem', fontFamily: 'Inter, sans-serif' }}>
          Hecho con cariño por Aria Eventos
        </p>
      </div>
    </div>
  )
}

// ============================================
// SECCIÓN 2: Portada
// ============================================
function Portada({ boda, primario }) {
  const iniciales = `${boda.nombre_novio_1?.[0] || ''}${boda.nombre_novio_2?.[0] || ''}`
  const fecha = boda.fecha_evento?.toDate
    ? boda.fecha_evento.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1.5rem 2.5rem' }}>
      <p style={{ fontSize: 28, color: primario, marginBottom: 8 }}>{iniciales}</p>
      <h1 style={{ fontSize: 40, fontWeight: 500, margin: '0 0 10px', lineHeight: 1.1 }}>
        {boda.nombre_novio_1} &amp; {boda.nombre_novio_2}
      </h1>
      <p style={{ fontSize: 15, letterSpacing: 1, color: '#6b6b63', fontFamily: 'Inter, sans-serif', margin: 0 }}>
        {boda.ciudad}{boda.estado ? `, ${boda.estado}` : ''}
      </p>
      <p style={{ fontSize: 15, color: '#6b6b63', fontFamily: 'Inter, sans-serif', margin: '2px 0 0' }}>
        {fecha}
      </p>
    </div>
  )
}

// ============================================
// SECCIÓN 3: Countdown
// ============================================
function Countdown({ fecha, primario }) {
  const [restante, setRestante] = useState(null)

  useEffect(() => {
    if (!fecha?.toDate) return
    const objetivo = fecha.toDate().getTime()

    function actualizar() {
      const ahora = Date.now()
      const diff = Math.max(0, objetivo - ahora)
      setRestante({
        dias: Math.floor(diff / 86400000),
        horas: Math.floor((diff / 3600000) % 24),
        min: Math.floor((diff / 60000) % 60),
        seg: Math.floor((diff / 1000) % 60),
      })
    }
    actualizar()
    const id = setInterval(actualizar, 1000)
    return () => clearInterval(id)
  }, [fecha])

  if (!restante) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '0 1.5rem 2.5rem', fontFamily: 'Inter, sans-serif' }}>
      {[['días', restante.dias], ['hrs', restante.horas], ['min', restante.min], ['seg', restante.seg]].map(([label, val]) => (
        <div key={label} style={{ textAlign: 'center', minWidth: 40 }}>
          <p style={{ fontSize: 26, fontWeight: 600, color: primario, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {String(val).padStart(2, '0')}
          </p>
          <p style={{ fontSize: 11, color: '#999', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
        </div>
      ))}
    </div>
  )
}

// ============================================
// SECCIÓN 6: Itinerario
// ============================================
function Itinerario({ eventos, primario }) {
  return (
    <div style={{ padding: '0 1.5rem 2.5rem' }}>
      <TituloSeccion texto="Itinerario" primario={primario} />
      {eventos.map((ev, i) => (
        <div key={i} style={{ marginBottom: 14, paddingLeft: 14, borderLeft: `2px solid ${primario}` }}>
          <p style={{ fontSize: 17, margin: 0 }}>{ev.nombre_evento}</p>
          <p style={{ fontSize: 13, color: '#6b6b63', margin: '2px 0 4px', fontFamily: 'Inter, sans-serif' }}>{ev.hora} · {ev.lugar}</p>
          {ev.link_mapa && (
            <a href={ev.link_mapa} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: primario, fontFamily: 'Inter, sans-serif' }}>
              Ver ubicación →
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================
// SECCIÓN 4: Buscador + Tarjeta personalizada + RSVP
// ============================================
function BuscadorRSVP({ boda, primario, claro }) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [pases, setPases] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [error, setError] = useState(null)

  // Búsqueda en vivo: espera un momento después de que dejas de escribir
  // (para no mandar una búsqueda por cada letra) y busca sola.
  useEffect(() => {
    if (seleccionado) return
    if (!busqueda.trim()) {
      setResultados(null)
      return
    }

    const espera = setTimeout(async () => {
      setBuscando(true)
      setError(null)
      try {
        const fn = httpsCallable(functions, 'buscarInvitado')
        const res = await fn({ bodaSlug: boda.slug, nombreBusqueda: busqueda.trim() })
        setResultados(res.data.resultados)
      } catch (e) {
        setError('No se pudo buscar. Intenta de nuevo.')
      }
      setBuscando(false)
    }, 350)

    return () => clearTimeout(espera)
  }, [busqueda, seleccionado])

  function elegir(inv) {
    setSeleccionado(inv)
    setBusqueda(inv.nombre_familia)
    setResultados(null)
    setPases(inv.pases_asignados)
    setConfirmado(false)
  }

  function reiniciarBusqueda() {
    setSeleccionado(null)
    setBusqueda('')
    setResultados(null)
  }

  async function confirmar(pasesFinal) {
    setEnviando(true)
    setError(null)
    try {
      const fn = httpsCallable(functions, 'confirmarRSVP')
      await fn({ bodaSlug: boda.slug, invitadoId: seleccionado.invitado_id, pasesConfirmados: pasesFinal })
      setConfirmado(true)
    } catch (e) {
      setError(e.message || 'No se pudo confirmar. Intenta de nuevo.')
    }
    setEnviando(false)
  }

  return (
    <div style={{ padding: '0 1.5rem 2.5rem' }}>
      <TituloSeccion texto="Confirma tu asistencia" primario={primario} />

      {!confirmado && (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={busqueda}
            onChange={e => {
              setBusqueda(e.target.value)
              if (seleccionado) setSeleccionado(null)
            }}
            placeholder="Escribe tu nombre o familia"
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${primario}`, borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
          />

          {/* Dropdown de resultados en vivo, aparece flotando debajo del campo */}
          {!seleccionado && busqueda.trim() && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: '#fff', border: `1px solid ${primario}55`, borderRadius: 8,
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)', zIndex: 10, overflow: 'hidden',
            }}>
              {buscando && (
                <p style={{ padding: '10px 14px', fontSize: 13, color: '#999', margin: 0, fontFamily: 'Inter, sans-serif' }}>Buscando…</p>
              )}
              {!buscando && resultados?.length === 0 && (
                <p style={{ padding: '10px 14px', fontSize: 13, color: '#999', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  No encontramos ese nombre.
                </p>
              )}
              {!buscando && resultados?.map(r => (
                <button
                  key={r.invitado_id} onClick={() => elegir(r)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                    background: '#fff', border: 'none', borderBottom: '0.5px solid #eee', fontSize: 15,
                    fontFamily: "'Cormorant Garamond', serif", cursor: 'pointer',
                  }}
                >
                  {r.nombre_familia}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p style={{ fontSize: 13, color: '#a33', marginTop: 10 }}>{error}</p>}

      {seleccionado && !confirmado && (
        <div style={{ background: '#fff', border: `1px solid ${primario}55`, borderRadius: 10, padding: 18, marginTop: 12 }}>
          <p style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Inter, sans-serif', margin: '0 0 4px' }}>
            {seleccionado.nombre_familia}
          </p>
          <p style={{ fontSize: 18, margin: '0 0 4px' }}>
            Su grupo cuenta con <strong style={{ color: primario }}>{seleccionado.pases_asignados}</strong> {seleccionado.pases_asignados === 1 ? 'lugar' : 'lugares'} en total
          </p>
          <p style={{ fontSize: 12, color: '#999', fontFamily: 'Inter, sans-serif', margin: '0 0 16px' }}>
            (Incluyendo a {seleccionado.nombre_familia})
          </p>

          <label style={{ fontSize: 13, color: '#6b6b63', fontFamily: 'Inter, sans-serif' }}>¿Cuántos asistirán en total?</label>
          <select
            value={pases} onChange={e => setPases(Number(e.target.value))}
            style={{ display: 'block', width: '100%', padding: '8px 10px', marginTop: 4, marginBottom: 14, border: `1px solid ${primario}55`, borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif' }}
          >
            {Array.from({ length: seleccionado.pases_asignados + 1 }, (_, i) => i).reverse().map(n => (
              <option key={n} value={n}>{n === 0 ? '0 — No asistiremos' : `${n} ${n === 1 ? 'persona' : 'personas'}`}</option>
            ))}
          </select>

          <button
            onClick={() => confirmar(pases)} disabled={enviando}
            style={{ width: '100%', background: primario, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, marginBottom: 8 }}
          >
            {enviando ? 'Enviando…' : 'Confirmar'}
          </button>
          <button
            onClick={reiniciarBusqueda}
            style={{ width: '100%', background: 'transparent', color: '#999', border: 'none', fontSize: 13, fontFamily: 'Inter, sans-serif' }}
          >
            No soy yo, buscar de nuevo
          </button>
        </div>
      )}

      {confirmado && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <p style={{ fontSize: 22, margin: '0 0 6px' }}>
            {pases === 0 ? 'Gracias por avisarnos' : '¡Gracias, contamos con ustedes!'}
          </p>
          <p style={{ fontSize: 13, color: '#999', fontFamily: 'Inter, sans-serif' }}>Tu confirmación quedó registrada.</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// SECCIÓN 8: Regalos
// ============================================
function Regalos({ regalos, primario }) {
  const tipos = regalos.tipo || []
  return (
    <div style={{ padding: '0 1.5rem 2.5rem' }}>
      <TituloSeccion texto="Mesa de regalos" primario={primario} />
      {tipos.includes('link_tienda') && regalos.link_tienda?.url && (
        <a href={regalos.link_tienda.url} target="_blank" rel="noreferrer" style={{
          display: 'block', textAlign: 'center', background: primario, color: '#fff',
          padding: '10px', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', marginBottom: 10, textDecoration: 'none',
        }}>
          Ver mesa de regalos — {regalos.link_tienda.nombre_tienda}
        </a>
      )}
      {tipos.includes('cuenta_deposito') && regalos.cuenta_deposito && (
        <p style={{ fontSize: 13, color: '#6b6b63', fontFamily: 'Inter, sans-serif' }}>
          {regalos.cuenta_deposito.banco} · {regalos.cuenta_deposito.titular} · {regalos.cuenta_deposito.numero_cuenta}
        </p>
      )}
      {tipos.includes('sobrecitos') && (
        <p style={{ fontSize: 15, textAlign: 'center', fontStyle: 'italic' }}>{regalos.sobrecitos?.texto_mostrar}</p>
      )}
    </div>
  )
}

// ============================================
// SECCIÓN 9: Galería
// ============================================
function Galeria({ fotos }) {
  return (
    <div style={{ padding: '0 1.5rem 2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {fotos.map((url, i) => (
        <img key={i} src={url} alt="" style={{ width: '100%', borderRadius: 8, aspectRatio: '1', objectFit: 'cover' }} />
      ))}
    </div>
  )
}

// ============================================
// SECCIÓN 10/11: Notas simples (vestimenta, notas adicionales)
// ============================================
function NotaSimple({ titulo, texto, primario }) {
  return (
    <div style={{ padding: '0 1.5rem 2.5rem' }}>
      <TituloSeccion texto={titulo} primario={primario} />
      <p style={{ fontSize: 14, color: '#6b6b63', fontFamily: 'Inter, sans-serif', whiteSpace: 'pre-wrap' }}>{texto}</p>
    </div>
  )
}

function TituloSeccion({ texto, primario }) {
  return (
    <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, color: primario, fontFamily: 'Inter, sans-serif', marginBottom: 10 }}>
      {texto}
    </p>
  )
}
