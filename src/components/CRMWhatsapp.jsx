import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'confirmado', label: 'Confirmados' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'no_confirmado', label: 'No confirmados' },
]

export default function CRMWhatsapp({ boda }) {
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [mensaje, setMensaje] = useState('')
  const [enviados, setEnviados] = useState(new Set())

  useEffect(() => {
    cargarInvitados()
  }, [])

  async function cargarInvitados() {
    setCargando(true)
    const q = query(collection(db, 'bodas', boda.id, 'invitados'), orderBy('nombre_familia'))
    const snap = await getDocs(q)
    setInvitados(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setCargando(false)
  }

  const filtrados = invitados.filter(inv =>
    filtro === 'todos' ? true : (inv.estado_rsvp || 'pendiente') === filtro
  )
  const conTelefono = filtrados.filter(inv => inv.telefono)
  const sinTelefono = filtrados.length - conTelefono.length

  function enviar(inv) {
    const numero = `${inv.lada}${inv.telefono}`.replace(/[^\d+]/g, '')
    const texto = encodeURIComponent(mensaje)
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank')
    setEnviados(prev => new Set(prev).add(inv.id))
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Escribe un mensaje y envíalo a un grupo filtrado, uno por uno
      </p>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTROS.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            style={{
              fontSize: 12, padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
              border: filtro === f.id ? 'none' : '0.5px solid var(--color-border)',
              background: filtro === f.id ? 'var(--color-sage)' : 'transparent',
              color: filtro === f.id ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Mensaje compartido */}
      <textarea
        value={mensaje}
        onChange={e => setMensaje(e.target.value)}
        placeholder="Escribe el mensaje que se enviará a este grupo…"
        rows={3}
        style={{
          width: '100%', padding: '10px 12px', border: '0.5px solid var(--color-border)',
          borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
          marginBottom: 8, resize: 'vertical',
        }}
      />
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        {conTelefono.length} {conTelefono.length === 1 ? 'persona' : 'personas'} en este grupo
        {sinTelefono > 0 && ` · ${sinTelefono} sin teléfono cargado (no se pueden contactar)`}
      </p>

      {cargando && <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando…</p>}

      {!cargando && conTelefono.length === 0 && (
        <div style={{
          background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center',
        }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            No hay nadie en este grupo con teléfono cargado.
          </p>
        </div>
      )}

      {!cargando && conTelefono.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {conTelefono.map(inv => (
            <div key={inv.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
              borderRadius: 8, padding: '10px 14px',
            }}>
              <div>
                <p style={{ fontSize: 14, margin: 0 }}>{inv.nombre_familia}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  {inv.lada} {inv.telefono}
                </p>
              </div>
              <button
                onClick={() => enviar(inv)}
                disabled={!mensaje.trim()}
                style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none',
                  cursor: mensaje.trim() ? 'pointer' : 'not-allowed',
                  background: enviados.has(inv.id) ? 'var(--color-surface-muted)' : 'var(--color-sage)',
                  color: enviados.has(inv.id) ? 'var(--color-text-secondary)' : '#fff',
                }}
              >
                {enviados.has(inv.id) ? '✓ Enviado' : 'Enviar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
