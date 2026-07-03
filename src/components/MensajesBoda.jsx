import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

export default function MensajesBoda({ boda }) {
  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarMensajes()
  }, [])

  async function cargarMensajes() {
    setCargando(true)
    const q = query(collection(db, 'bodas', boda.id, 'invitados'), orderBy('actualizado_en', 'desc'))
    const snap = await getDocs(q)
    const conMensaje = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(inv => inv.mensaje_novios?.trim())
    setMensajes(conMensaje)
    setCargando(false)
  }

  async function eliminarMensaje(invitadoId) {
    const confirmar = window.confirm('¿Eliminar este mensaje? El invitado seguirá confirmado, solo se borra el mensaje.')
    if (!confirmar) return
    await updateDoc(doc(db, 'bodas', boda.id, 'invitados', invitadoId), { mensaje_novios: '' })
    cargarMensajes()
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
        Mensajes de tus invitados
      </p>

      {cargando && <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando…</p>}

      {!cargando && mensajes.length === 0 && (
        <div style={{
          background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 6px' }}>
            Aún no hay mensajes
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            Cuando tus invitados confirmen su asistencia, sus mensajes aparecerán aquí.
          </p>
        </div>
      )}

      {!cargando && mensajes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mensajes.map(m => (
            <div key={m.id} style={{
              background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
              borderRadius: 'var(--radius)', padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <p style={{ fontSize: 13, color: 'var(--color-sage-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>
                  {m.nombre_familia}
                </p>
                <button
                  onClick={() => eliminarMensaje(m.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-coral-text)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)' }}
                >
                  Eliminar
                </button>
              </div>
              <p style={{ fontSize: 15, margin: 0, fontStyle: 'italic' }}>"{m.mensaje_novios}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
