import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import GestionInvitados from './GestionInvitados'
import GestorMesas from './GestorMesas'
import AccesosBoda from './AccesosBoda'

// Colores de acento que se van alternando por boda, para que cada
// tarjeta se distinga visualmente (igual que en la vista previa aprobada)
const acentos = [
  { bg: 'var(--color-sage-light)', text: 'var(--color-sage-text)' },
  { bg: 'var(--color-coral-light)', text: 'var(--color-coral-text)' },
]

function iniciales(nombre1, nombre2) {
  const a = nombre1?.[0]?.toUpperCase() || ''
  const b = nombre2?.[0]?.toUpperCase() || ''
  return `${a}${b}`
}

export default function AdminPanel() {
  const [bodas, setBodas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [bodaSeleccionada, setBodaSeleccionada] = useState(null)
  const [vista, setVista] = useState('invitados')

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
        <div style={{ maxWidth: 720, margin: '1.5rem auto -0.75rem', padding: '0 1.5rem' }}>
          <a
            href={`/i/${bodaSeleccionada.slug}`} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, color: 'var(--color-sage-text)', fontFamily: 'var(--font-sans)' }}
          >
            Ver invitación pública →
          </a>
        </div>
        <div style={{ display: 'flex', gap: 8, maxWidth: 720, margin: '0.5rem auto -1.5rem', padding: '0 1.5rem' }}>
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
            onClick={() => setVista('accesos')}
            style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border)',
              background: vista === 'accesos' ? 'var(--color-sage-light)' : 'transparent',
              color: vista === 'accesos' ? 'var(--color-sage-text)' : 'var(--color-text-secondary)',
            }}
          >
            Accesos
          </button>
        </div>
        {vista === 'invitados' && (
          <GestionInvitados boda={bodaSeleccionada} onVolver={() => setBodaSeleccionada(null)} />
        )}
        {vista === 'mesas' && (
          <GestorMesas boda={bodaSeleccionada} onVolver={() => setBodaSeleccionada(null)} />
        )}
        {vista === 'accesos' && (
          <AccesosBoda boda={bodaSeleccionada} />
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
        <TarjetaResumen etiqueta="Confirmados" valor={totalConfirmados} />
        <TarjetaResumen etiqueta="Pendientes" valor={totalPendientes} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Tus bodas</span>
        <button style={{
          fontSize: 13, background: 'transparent', border: '0.5px solid var(--color-border)',
          borderRadius: 8, padding: '6px 12px', color: 'var(--color-text-primary)',
        }}>
          + Nueva boda
        </button>
      </div>

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
            const acento = acentos[i % acentos.length]
            const confirmados = boda.invitados?.filter(g => g.estado_rsvp === 'confirmado').length || 0
            const totalPases = boda.invitados?.reduce((acc, g) => acc + (g.pases_asignados || 0), 0) || 0
            const fecha = boda.fecha_evento?.toDate().toLocaleDateString('es-MX', {
              day: 'numeric', month: 'short', year: 'numeric',
            })

            return (
              <div
                key={boda.id}
                onClick={() => { setBodaSeleccionada(boda); setVista('invitados') }}
                style={{
                  background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
                  borderRadius: 'var(--radius)', padding: '1rem 1.1rem', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: acento.bg, color: acento.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 14,
                  }}>
                    {iniciales(boda.nombre_novio_1, boda.nombre_novio_2)}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, margin: 0 }}>
                      {boda.nombre_novio_1} &amp; {boda.nombre_novio_2}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                      {boda.ciudad} · {fecha}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-text-secondary)',
                  borderTop: '0.5px solid var(--color-border)', paddingTop: 8,
                }}>
                  <span>{confirmados}/{totalPases} confirmados</span>
                  <span>{boda.totalMesas} mesas</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TarjetaResumen({ etiqueta, valor }) {
  return (
    <div style={{ background: 'var(--color-surface-muted)', borderRadius: 'var(--radius)', padding: '1rem' }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>{etiqueta}</p>
      <p style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>{valor}</p>
    </div>
  )
}
