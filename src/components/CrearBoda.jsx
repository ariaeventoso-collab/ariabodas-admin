import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

function generarSlug(nombre1, nombre2) {
  const limpiar = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
  return `${limpiar(nombre1)}y${limpiar(nombre2)}`
}

export default function CrearBoda({ onCreada, onCancelar }) {
  const [nombre1, setNombre1] = useState('')
  const [nombre2, setNombre2] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [estado, setEstado] = useState('')
  const [fecha, setFecha] = useState('')
  const [slugManual, setSlugManual] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const slugSugerido = slugManual || (nombre1 && nombre2 ? generarSlug(nombre1, nombre2) : '')

  async function crear(e) {
    e.preventDefault()
    setError(null)

    if (!nombre1.trim() || !nombre2.trim() || !fecha) {
      setError('Nombre de los novios y fecha son obligatorios.')
      return
    }

    setGuardando(true)
    try {
      await addDoc(collection(db, 'bodas'), {
        nombre_novio_1: nombre1.trim(),
        nombre_novio_2: nombre2.trim(),
        slug: slugSugerido,
        ciudad: ciudad.trim(),
        estado: estado.trim(),
        fecha_evento: new Date(fecha),
        colores: { primario: '#7C8B6F', secundario: '#E7ECE1' },
        imagen_fondo_url: '',
        plantilla_id: 'clasica',
        activa: true,
        creada_en: new Date(),
      })
      onCreada?.()
    } catch (e) {
      setError('No se pudo crear la boda. Intenta de nuevo.')
    }
    setGuardando(false)
  }

  return (
    <div style={{
      background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
      borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem',
    }}>
      <form onSubmit={crear}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={etiquetaEstilo}>Nombre novio/a 1</label>
            <input type="text" value={nombre1} onChange={e => setNombre1(e.target.value)} placeholder="Miranda" style={campoEstilo} />
          </div>
          <div>
            <label style={etiquetaEstilo}>Nombre novio/a 2</label>
            <input type="text" value={nombre2} onChange={e => setNombre2(e.target.value)} placeholder="Cesar" style={campoEstilo} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={etiquetaEstilo}>Ciudad</label>
            <input type="text" value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Cd. Obregón" style={campoEstilo} />
          </div>
          <div>
            <label style={etiquetaEstilo}>Estado</label>
            <input type="text" value={estado} onChange={e => setEstado(e.target.value)} placeholder="Sonora" style={campoEstilo} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={etiquetaEstilo}>Fecha del evento</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={campoEstilo} />
          </div>
          <div>
            <label style={etiquetaEstilo}>Link (se genera solo, puedes ajustarlo)</label>
            <input
              type="text" value={slugSugerido}
              onChange={e => setSlugManual(e.target.value)}
              style={campoEstilo}
            />
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: 'var(--color-coral-text)', margin: '0 0 10px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={guardando} style={{ background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14 }}>
            {guardando ? 'Creando…' : 'Crear boda'}
          </button>
          <button type="button" onClick={onCancelar} style={{ background: 'transparent', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '8px 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

const etiquetaEstilo = { fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4, fontFamily: 'var(--font-sans)' }
const campoEstilo = {
  width: '100%', padding: '7px 9px', border: '0.5px solid var(--color-border)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
}
