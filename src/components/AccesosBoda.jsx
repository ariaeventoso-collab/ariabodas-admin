import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../lib/firebaseClient'

export default function AccesosBoda({ boda }) {
  const [accesos, setAccesos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('novios')

  useEffect(() => {
    cargarAccesos()
  }, [])

  async function cargarAccesos() {
    setCargando(true)
    const q = query(collection(db, 'usuarios'), where('boda_id', '==', boda.id))
    const snap = await getDocs(q)
    setAccesos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setCargando(false)
  }

  async function crearAcceso(e) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim() || !email.trim() || !password) {
      setError('Completa todos los campos.')
      return
    }

    setGuardando(true)
    try {
      const fn = httpsCallable(functions, 'crearAcceso')
      await fn({ email: email.trim(), password, nombre: nombre.trim(), rol, bodaId: boda.id })

      setNombre('')
      setEmail('')
      setPassword('')
      setRol('novios')
      setMostrarFormulario(false)
      cargarAccesos()
    } catch (e) {
      setError(e.message || 'No se pudo crear el acceso.')
    }
    setGuardando(false)
  }

  async function eliminarAcceso(acceso) {
    const confirmar = window.confirm(`¿Eliminar el acceso de "${acceso.nombre}" (${acceso.email})?`)
    if (!confirmar) return

    try {
      const fn = httpsCallable(functions, 'eliminarAcceso')
      await fn({ uid: acceso.id })
      cargarAccesos()
    } catch (e) {
      alert('No se pudo eliminar el acceso.')
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '1.5rem auto 0', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Accesos de esta boda</span>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{ fontSize: 13, background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px' }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Dar acceso'}
        </button>
      </div>

      {mostrarFormulario && (
        <form onSubmit={crearAcceso} style={{
          background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={etiquetaEstilo}>Nombre</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Miranda" style={campoEstilo} />
            </div>
            <div>
              <label style={etiquetaEstilo}>Rol</label>
              <select value={rol} onChange={e => setRol(e.target.value)} style={campoEstilo}>
                <option value="novios">Novios</option>
                <option value="wedding_planner">Wedding planner</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={etiquetaEstilo}>Correo</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="miranda@correo.com" style={campoEstilo} />
            </div>
            <div>
              <label style={etiquetaEstilo}>Contraseña temporal</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" style={campoEstilo} />
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--color-coral-text)', margin: '0 0 10px' }}>{error}</p>}

          <button
            type="submit" disabled={guardando}
            style={{ background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14 }}
          >
            {guardando ? 'Creando…' : 'Crear acceso'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
            Comparte el correo y esta contraseña con la persona directamente (por WhatsApp, por ejemplo).
          </p>
        </form>
      )}

      {cargando && <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando accesos…</p>}

      {!cargando && accesos.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Nadie más tiene acceso a esta boda todavía.</p>
      )}

      {!cargando && accesos.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
          {accesos.map((a, i) => (
            <div key={a.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderBottom: i < accesos.length - 1 ? '0.5px solid var(--color-border)' : 'none',
            }}>
              <div>
                <p style={{ fontSize: 13, margin: 0 }}>{a.nombre}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  {a.email} · {a.rol === 'novios' ? 'Novios' : 'Wedding planner'}
                </p>
              </div>
              <button
                onClick={() => eliminarAcceso(a)}
                style={{ background: 'none', border: 'none', color: 'var(--color-coral-text)', cursor: 'pointer', fontSize: 12 }}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const etiquetaEstilo = { fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }
const campoEstilo = {
  width: '100%', padding: '7px 9px', border: '0.5px solid var(--color-border)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
}
