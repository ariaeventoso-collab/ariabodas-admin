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
  const totalInvitados = bodas.reduce((acc, b) => acc + (b.invitados?.length || 0), 0)
  const totalConfirmados = bodas.reduce(
    (acc, b) => acc + (b.invitados?.filter(i => i.estado_rsvp === 'confirmado').length || 0),
    0
  )
  const totalPendientes = bodas.reduce(
    (acc, b) => acc + (b.invitados?.filter(i => i.estado_rsvp === 'pendiente').length || 0),
    0
  )

  if (bodaSeleccionada) {
    return (
      <div>
        {/* Logo persistente en todas las pestañas */}
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <img src="/logo-aria.png" alt="Aria Eventos" style={{ height: 26, width: 'auto' }} />
        </div>

        <div style={{ maxWidth: 720, margin: '1rem auto 0', padding: '0 1.5rem' }}>
          <button
            onClick={() => setBodaSeleccionada(null)}
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

        <div style={{ display: 'flex', gap: 8, maxWidth: 720, margin: '0 auto 1.5rem', padding: '0 1.5rem' }}>
          <button
            onClick={() => setVista('invitados')}
            style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border)',
              background: vista === 'invitados' ? 'var(--color-sage-light)' : 'transparent',
              color: vista === 'invitados' ? 'var(--color-sage-text)' : 'var(--color-text-secondary)',
            }}
          >
            Invitados
          </button>
          <button
            onClick={() => setVista('crm')}
            style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border)',
              background: vista === 'crm' ? 'var(--color-sage-light)' : 'transparent',
              color: vista === 'crm' ? 'var(--color-sage-text)' : 'var(--color-text-secondary)',
            }}
          >
            CRM
          </button>
          <button
            onClick={() => setVista('mesas')}
            style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border)',
              background: vista === 'mesas' ? 'var(--color-sage-light)' : 'transparent',
              color: vista === 'mesas' ? 'var(--color-sage-text)' : 'var(--color-text-secondary)',
            }}
          >
            Mesas
          </button>
          <button
            onClick={() => setVista('mensajes')}
            style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border)',
              background: vista === 'mensajes' ? 'var(--color-sage-light)' : 'transparent',
              color: vista === 'mensajes' ? 'var(--color-sage-text)' : 'var(--color-text-secondary)',
            }}
          >
            Mensajes
          </button>
          <button
            onClick={() => setVista('accesos')}
            style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border)',
              background: vista === 'accesos' ? 'var(--color-sage-light)' : 'transparent',
              color: vista === 'accesos' ? 'var(--color-sage-text)' : 'var(--color-text-secondary)',
            }}
          >
            Accesos
          </button>
          <button
            onClick={() => setVista('diseno')}
            style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border)',
              background: vista === 'diseno' ? 'var(--color-sage-light)' : 'transparent',
              color: vista === 'diseno' ? 'var(--color-sage-text)' : 'var(--color-text-secondary)',
            }}
          >
            Diseño
          </button>
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
        <TarjetaResumen etiqueta="Invitados totales" valor={totalInvitados} />
        <TarjetaResumen etiqueta="Confirmados" valor={totalConfirmados} valorColor="var(--color-sage-text)" />
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
            const pasesConfirmados = boda.invitados?.reduce((acc, g) => acc + (g.pases_confirmados || 0), 0) || 0
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
                onClick={() => { setBodaSeleccionada(boda); setVista('invitados') }}
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
