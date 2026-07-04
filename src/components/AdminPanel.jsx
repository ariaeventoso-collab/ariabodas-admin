import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import GestionInvitados from './GestionInvitados'
import GestorMesas from './GestorMesas'
import AccesosBoda from './AccesosBoda'
import DisenoBoda from './DisenoBoda'
import CrearBoda from './CrearBoda'
import MensajesBoda from './MensajesBoda'
import CRMWhatsapp from './CRMWhatsapp'

function iniciales(nombre1, nombre2) {
  const a = nombre1?.[0]?.toUpperCase() || ''
  const b = nombre2?.[0]?.toUpperCase() || ''
  return `${a}${b}`
}

function diasRestantes(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  const dias = Math.ceil((fecha.getTime() - hoy.getTime()) / 86400000)
  return dias >= 0 ? dias : null
}

export default function AdminPanel() {
  const [bodas, setBodas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [bodaSeleccionada, setBodaSeleccionada] = useState(null)
  const [vista, setVista] = useState('invitados')
  const [mostrarCrearBoda, setMostrarCrearBoda] = useState(false)

  // Cuando entras al detalle de una boda, registramos un paso en el
  // historial del navegador. Así, si el usuario presiona "atrás", en vez
  // de salir de la app (porque React no usa rutas reales aquí), lo regresamos
  // a la lista de bodas. Si ya estaba en la lista, "atrás" se comporta normal
  // (sale de la app, que es lo esperado en la pantalla raíz).
  useEffect(() => {
    function alPresionarAtras() {
      setBodaSeleccionada(null)
    }
    window.addEventListener('popstate', alPresionarAtras)
    return () => window.removeEventListener('popstate', alPresionarAtras)
  }, [])

  function abrirBoda(boda) {
    window.history.pushState({ vista: 'detalle-boda' }, '')
    setBodaSeleccionada(boda)
    setVista('invitados')
  }

  function volverALaLista() {
    // Si hay una entrada de historial nuestra pendiente, la consumimos con
    // "atrás" real para no acumular entradas fantasma; si no, solo limpiamos
    // el estado (ej. cuando se llega aquí por click en el logo).
    if (window.history.state?.vista === 'detalle-boda') {
      window.history.back()
    } else {
      setBodaSeleccionada(null)
    }
  }

  useEffect(() => {
    cargarBodas()
  }, [])

  async function cargarBodas() {
    setCargando(true)
    setError(null)

    try {
      const bodasQuery = query(collection(db, 'bodas'), where('activa', '==', true))
      const bodasSnap = await getDocs(bodasQuery)

      const bodasConDatos = await Promise.all(
        bodasSnap.docs.map(async (bodaDoc) => {
          const invitadosSnap = await getDocs(collection(db, 'bodas', bodaDoc.id, 'invitados'))
          const mesasSnap = await getDocs(collection(db, 'bodas', bodaDoc.id, 'mesas'))

          return {
            id: bodaDoc.id,
            ...bodaDoc.data(),
            invitados: invitadosSnap.docs.map(d => d.data()),
            totalMesas: mesasSnap.size,
          }
        })
      )

      bodasConDatos.sort((a, b) => a.fecha_evento?.toMillis() - b.fecha_evento?.toMillis())

      setBodas(bodasConDatos)
    } catch (e) {
      setError('No se pudieron cargar tus bodas. Intenta de nuevo en un momento.')
    }

    setCargando(false)
  }

  const totalBodas = bodas.length
  // Personas reales invitadas (no registros de familia) — suma los pases
  // asignados a cada familia, no la cantidad de documentos "invitado".
  const totalPersonas = bodas.reduce(
    (acc, b) => acc + (b.invitados?.reduce((s, i) => s + (i.pases_asignados || 0), 0) || 0),
    0
  )
  // "Resueltos" = ya no necesitan seguimiento, sea porque confirmaron
  // o porque ya dijeron que no van. Se cuenta en personas.
  const totalResueltos = bodas.reduce(
    (acc, b) => acc + (b.invitados?.reduce((s, i) => {
      if (i.estado_rsvp === 'confirmado') return s + (i.pases_confirmados || 0)
      if (i.estado_rsvp === 'no_confirmado') return s + (i.pases_asignados || 0)
      return s
    }, 0) || 0),
    0
  )
  // Solo cuenta a quienes de verdad faltan por resolver — los rechazados
  // ya están arriba en "Resueltos", no se mezclan aquí.
  const totalPendientes = bodas.reduce(
    (acc, b) => acc + (b.invitados?.filter(i => i.estado_rsvp === 'pendiente').length || 0),
    0
  )

  if (bodaSeleccionada) {
    return (
      <div>
        {/* Logo persistente en todas las pestañas */}
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <img
            src="/logo-aria.png" alt="Aria Eventos" style={{ height: 26, width: 'auto', cursor: 'pointer' }}
            onClick={volverALaLista}
          />
        </div>

        <div style={{ maxWidth: 720, margin: '1rem auto 0', padding: '0 1.5rem' }}>
          <button
            onClick={volverALaLista}
            style={{ fontSize: 13, background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', padding: 0, marginBottom: 12, cursor: 'pointer' }}
          >
            ← Volver a tus bodas
          </button>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: 0 }}>
              {bodaSeleccionada.nombre_novio_1} &amp; {bodaSeleccionada.nombre_novio_2}
            </p>
            <a
              href={`/i/${bodaSeleccionada.slug}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: 'var(--color-sage-text)', fontFamily: 'var(--font-sans)' }}
            >
              Ver invitación pública →
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, maxWidth: 720, margin: '0 auto 1.5rem', padding: '0 1.5rem', borderBottom: '0.5px solid var(--color-border)' }}>
          <TabBoton activo={vista === 'invitados'} onClick={() => setVista('invitados')}>Invitados</TabBoton>
          <TabBoton activo={vista === 'crm'} onClick={() => setVista('crm')}>CRM</TabBoton>
          <TabBoton activo={vista === 'mesas'} onClick={() => setVista('mesas')}>Mesas</TabBoton>
          <TabBoton activo={vista === 'mensajes'} onClick={() => setVista('mensajes')}>Mensajes</TabBoton>
          <TabBoton activo={vista === 'accesos'} onClick={() => setVista('accesos')}>Accesos</TabBoton>
          <TabBoton activo={vista === 'diseno'} onClick={() => setVista('diseno')}>Diseño</TabBoton>
        </div>
        {vista === 'invitados' && (
          <GestionInvitados boda={bodaSeleccionada} ocultarVolver />
        )}
        {vista === 'crm' && (
          <CRMWhatsapp boda={bodaSeleccionada} />
        )}
        {vista === 'mesas' && (
          <GestorMesas boda={bodaSeleccionada} ocultarVolver />
        )}
        {vista === 'mensajes' && (
          <MensajesBoda boda={bodaSeleccionada} />
        )}
        {vista === 'accesos' && (
          <AccesosBoda boda={bodaSeleccionada} />
        )}
        {vista === 'diseno' && (
          <DisenoBoda boda={bodaSeleccionada} onGuardado={cargarBodas} />
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 4px', fontWeight: 500 }}>
            Aria Eventos
          </p>
          <img src="/logo-aria.png" alt="Aria Eventos" style={{ height: 30, width: 'auto', display: 'block' }} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Panel de administrador</span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12, marginBottom: '2rem',
      }}>
        <TarjetaResumen etiqueta="Bodas activas" valor={totalBodas} />
        <TarjetaResumen etiqueta="Personas invitadas" valor={totalPersonas} />
        <TarjetaResumen etiqueta="Resueltos" valor={totalResueltos} valorColor="var(--color-sage-text)" />
        <TarjetaResumen etiqueta="Pendientes" valor={totalPendientes} enfasis />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Tus bodas</span>
        <button onClick={() => setMostrarCrearBoda(!mostrarCrearBoda)} style={{
          fontSize: 13, background: mostrarCrearBoda ? 'transparent' : 'var(--color-ink)',
          border: mostrarCrearBoda ? '0.5px solid var(--color-border)' : 'none',
          borderRadius: 10, padding: '8px 16px',
          color: mostrarCrearBoda ? 'var(--color-text-primary)' : 'var(--color-coral)',
          fontWeight: 500,
        }}>
          {mostrarCrearBoda ? 'Cancelar' : '+ Nueva boda'}
        </button>
      </div>

      {mostrarCrearBoda && (
        <CrearBoda
          onCreada={() => { setMostrarCrearBoda(false); cargarBodas() }}
          onCancelar={() => setMostrarCrearBoda(false)}
        />
      )}

      {cargando && (
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Cargando tus bodas…</p>
      )}

      {error && (
        <p style={{ fontSize: 14, color: 'var(--color-coral-text)' }}>{error}</p>
      )}

      {!cargando && !error && bodas.length === 0 && (
        <div style={{
          background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 6px' }}>
            Aún no tienes bodas activas
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            Crea tu primera boda para empezar a gestionar invitados y mesas.
          </p>
        </div>
      )}

      {!cargando && !error && bodas.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12,
        }}>
          {bodas.map((boda, i) => {
            // Blindado: solo suma pases_confirmados de invitados cuyo
            // estado_rsvp realmente sea 'confirmado'. Antes sumaba el campo
            // sin filtrar por estado, lo cual podía mostrar una barra de
            // progreso incorrecta si algún dato quedaba inconsistente.
            const pasesConfirmados = boda.invitados?.reduce(
              (acc, g) => g.estado_rsvp === 'confirmado' ? acc + (g.pases_confirmados || 0) : acc,
              0
            ) || 0
            const totalPases = boda.invitados?.reduce((acc, g) => acc + (g.pases_asignados || 0), 0) || 0
            const porcentaje = totalPases > 0 ? Math.min(100, Math.round((pasesConfirmados / totalPases) * 100)) : 0
            const fechaObj = boda.fecha_evento?.toDate ? boda.fecha_evento.toDate() : null
            const dias = diasRestantes(fechaObj)
            const fecha = fechaObj?.toLocaleDateString('es-MX', {
              day: 'numeric', month: 'short', year: 'numeric',
            })

            return (
              <div
                key={boda.id}
                onClick={() => abrirBoda(boda)}
                style={{
                  background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
                  borderRadius: 14, padding: '1.1rem 1.15rem', cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(28,28,28,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: 'var(--color-ink)', color: 'var(--color-coral)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14,
                    }}>
                      {iniciales(boda.nombre_novio_1, boda.nombre_novio_2)}
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, margin: 0, lineHeight: 1.2 }}>
                        {boda.nombre_novio_1} &amp; {boda.nombre_novio_2}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                        {boda.ciudad} · {fecha}
                      </p>
                    </div>
                  </div>
                  {dias !== null && (
                    <span style={{
                      fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: 'var(--color-coral-light)', color: 'var(--color-coral-text)',
                      padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap',
                    }}>
                      {dias} días
                    </span>
                  )}
                </div>
                <div style={{ height: 1, background: 'var(--color-surface-muted)', marginBottom: 12 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 4, background: 'var(--color-surface-muted)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${porcentaje}%`, background: 'var(--color-sage)', borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
                      {pasesConfirmados}/{totalPases} confirmados
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{boda.totalMesas} mesas</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabBoton({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', fontSize: 13, padding: '10px 14px', background: 'transparent',
        border: 'none', color: activo ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        transition: 'color .15s',
      }}
    >
      {children}
      {activo && (
        <span style={{
          position: 'absolute', left: 10, right: 10, bottom: -1, height: 2,
          background: 'var(--color-coral)',
        }} />
      )}
    </button>
  )
}

function TarjetaResumen({ etiqueta, valor, enfasis, valorColor }) {
  return (
    <div style={{
      background: enfasis ? 'var(--color-ink)' : 'var(--color-surface)',
      border: enfasis ? 'none' : '0.5px solid var(--color-border)',
      borderRadius: 12, padding: '0.9rem 1rem',
    }}>
      <p style={{ fontSize: 11, color: enfasis ? 'var(--color-text-muted)' : 'var(--color-text-muted)', margin: '0 0 6px' }}>{etiqueta}</p>
      <p style={{
        fontSize: 24, fontWeight: 500, margin: 0, fontVariantNumeric: 'tabular-nums',
        color: enfasis ? 'var(--color-coral)' : (valorColor || 'var(--color-text-primary)'),
      }}>
        {valor}
      </p>
    </div>
  )
}
