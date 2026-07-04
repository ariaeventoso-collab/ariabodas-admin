import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../lib/firebaseClient'
import GestionInvitados from './GestionInvitados'
import GestorMesas from './GestorMesas'
import MensajesBoda from './MensajesBoda'
import CRMWhatsapp from './CRMWhatsapp'

// Panel para novios y wedding planners: acceso solo a SU boda,
// sin lista de otras bodas y sin poder editar el diseño de la invitación.
export default function PanelLimitado({ perfilUsuario }) {
  const [boda, setBoda] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const esPlanner = perfilUsuario.rol === 'wedding_planner'
  // Los novios ven primero sus mensajes; el wedding planner no tiene
  // acceso a esa sección, así que arranca directo en Invitados.
  const [vista, setVista] = useState(esPlanner ? 'invitados' : 'mensajes')

  useEffect(() => {
    cargarBoda()
  }, [])

  async function cargarBoda() {
    setCargando(true)
    setError(null)

    if (!perfilUsuario.boda_id) {
      setError('Tu cuenta no tiene una boda asignada todavía. Contacta al administrador.')
      setCargando(false)
      return
    }

    try {
      const bodaDoc = await getDoc(doc(db, 'bodas', perfilUsuario.boda_id))
      if (!bodaDoc.exists()) {
        setError('No se encontró la boda asignada a tu cuenta.')
      } else {
        setBoda({ id: bodaDoc.id, ...bodaDoc.data() })
      }
    } catch (e) {
      setError('No se pudo cargar tu boda. Intenta de nuevo en un momento.')
    }

    setCargando(false)
  }

  if (cargando) {
    return <p style={{ padding: '2rem', fontSize: 14, color: 'var(--color-text-muted)' }}>Cargando…</p>
  }

  if (error) {
    return (
      <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <p style={{ fontSize: 14, color: 'var(--color-coral-text)' }}>{error}</p>
        <button
          onClick={() => signOut(auth)}
          style={{ fontSize: 13, background: 'transparent', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '6px 14px', marginTop: 12 }}
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Encabezado simple: logo, nombre de la boda, rol, cerrar sesión */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem', borderBottom: '0.5px solid var(--color-border)', marginBottom: '1.5rem',
      }}>
        <img
          src="/logo-aria.png" alt="Aria Eventos" style={{ height: 26, width: 'auto', cursor: 'pointer' }}
          onClick={() => setVista(esPlanner ? 'invitados' : 'mensajes')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {esPlanner ? 'Wedding planner' : 'Novios'} · {boda.nombre_novio_1} &amp; {boda.nombre_novio_2}
          </span>
          <button
            onClick={() => signOut(auth)}
            style={{ fontSize: 13, background: 'transparent', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '5px 12px', color: 'var(--color-text-secondary)' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Pestañas: Mensajes (solo novios) / Invitados / Mesas */}
      <div style={{ display: 'flex', gap: 8, maxWidth: 720, margin: '0 auto 0', padding: '0 1.5rem' }}>
        {!esPlanner && (
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
        )}
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
        {esPlanner && (
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
        )}
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
      </div>

      {vista === 'mensajes' && !esPlanner && (
        <div style={{ paddingTop: '1.5rem' }}><MensajesBoda boda={boda} /></div>
      )}
      {vista === 'invitados' && <GestionInvitados boda={boda} ocultarVolver />}
      {vista === 'crm' && esPlanner && <div style={{ paddingTop: '1.5rem' }}><CRMWhatsapp boda={boda} /></div>}
      {vista === 'mesas' && <GestorMesas boda={boda} ocultarVolver />}
    </div>
  )
}
