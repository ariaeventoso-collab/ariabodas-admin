import { useEffect, useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

const LADAS = [
  { codigo: '+52', pais: 'México' },
  { codigo: '+1', pais: 'Estados Unidos' },
  { codigo: '+57', pais: 'Colombia' },
  { codigo: '+34', pais: 'España' },
  { codigo: '+54', pais: 'Argentina' },
]

export default function GestionInvitados({ boda, onVolver }) {
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [nombreFamilia, setNombreFamilia] = useState('')
  const [telefono, setTelefono] = useState('')
  const [lada, setLada] = useState('+52')
  const [pasesAsignados, setPasesAsignados] = useState(1)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [invitadoEditando, setInvitadoEditando] = useState(null)

  useEffect(() => {
    cargarInvitados()
  }, [])

  async function cargarInvitados() {
    setCargando(true)
    const invitadosRef = collection(db, 'bodas', boda.id, 'invitados')
    const q = query(invitadosRef, orderBy('nombre_familia'))
    const snap = await getDocs(q)
    setInvitados(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setCargando(false)
  }

  async function guardarEdicion(e) {
    e.preventDefault()
    if (!invitadoEditando.nombre_familia.trim()) return

    await updateDoc(doc(db, 'bodas', boda.id, 'invitados', invitadoEditando.id), {
      nombre_familia: invitadoEditando.nombre_familia.trim(),
      telefono: invitadoEditando.telefono.trim(),
      lada: invitadoEditando.lada,
      pases_asignados: Number(invitadoEditando.pases_asignados),
      actualizado_en: new Date(),
    })
    setInvitadoEditando(null)
    cargarInvitados()
  }

  async function eliminarInvitado(invitado) {
    const confirmar = window.confirm(
      `¿Eliminar a "${invitado.nombre_familia}"? Esto también lo quitará de cualquier mesa asignada.`
    )
    if (!confirmar) return

    // Quitarlo de cualquier mesa donde estuviera asignado
    const mesasSnap = await getDocs(collection(db, 'bodas', boda.id, 'mesas'))
    for (const mesaDoc of mesasSnap.docs) {
      const asignaciones = mesaDoc.data().asignaciones || []
      if (asignaciones.some(a => a.invitado_id === invitado.id)) {
        await updateDoc(mesaDoc.ref, {
          asignaciones: asignaciones.filter(a => a.invitado_id !== invitado.id),
        })
      }
    }

    await deleteDoc(doc(db, 'bodas', boda.id, 'invitados', invitado.id))
    cargarInvitados()
  }

  async function agregarInvitado(e) {
    e.preventDefault()
    setError(null)

    if (!nombreFamilia.trim()) {
      setError('Escribe el nombre de la familia o invitado.')
      return
    }
    if (pasesAsignados < 1) {
      setError('El número de pases debe ser al menos 1.')
      return
    }

    setGuardando(true)
    try {
      const invitadosRef = collection(db, 'bodas', boda.id, 'invitados')
      await addDoc(invitadosRef, {
        nombre_familia: nombreFamilia.trim(),
        telefono: telefono.trim(),
        lada,
        pases_asignados: Number(pasesAsignados),
        pases_confirmados: null,
        estado_rsvp: 'pendiente',
        creado_en: new Date(),
        actualizado_en: new Date(),
      })

      // Limpiar formulario y recargar lista
      setNombreFamilia('')
      setTelefono('')
      setPasesAsignados(1)
      setMostrarFormulario(false)
      cargarInvitados()
    } catch (e) {
      setError('No se pudo guardar el invitado. Intenta de nuevo.')
    }
    setGuardando(false)
  }

  const totalPases = invitados.reduce((acc, i) => acc + (i.pases_asignados || 0), 0)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>

      <button
        onClick={onVolver}
        style={{
          fontSize: 13, background: 'transparent', border: 'none',
          color: 'var(--color-text-secondary)', padding: 0, marginBottom: 16, cursor: 'pointer',
        }}
      >
        ← Volver a tus bodas
      </button>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: 0 }}>
          {boda.nombre_novio_1} &amp; {boda.nombre_novio_2}
        </p>
      </div>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 1.5rem' }}>
        {invitados.length} familias registradas · {totalPases} pases en total
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Invitados</span>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{
            fontSize: 13, background: 'var(--color-sage)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 14px',
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Agregar invitado'}
        </button>
      </div>

      {mostrarFormulario && (
        <form onSubmit={agregarInvitado} style={{
          background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={etiquetaEstilo}>Nombre de familia o invitado</label>
              <input
                type="text"
                value={nombreFamilia}
                onChange={e => setNombreFamilia(e.target.value)}
                placeholder="Fam. Cabral López"
                style={campoEstilo}
              />
            </div>
            <div>
              <label style={etiquetaEstilo}>Lada</label>
              <select value={lada} onChange={e => setLada(e.target.value)} style={campoEstilo}>
                {LADAS.map(l => (
                  <option key={l.codigo} value={l.codigo}>{l.codigo} {l.pais}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={etiquetaEstilo}>Pases</label>
              <input
                type="number"
                min="1"
                value={pasesAsignados}
                onChange={e => setPasesAsignados(e.target.value)}
                style={campoEstilo}
              />
            </div>
          </div>

          <label style={etiquetaEstilo}>Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="6441234567"
            style={{ ...campoEstilo, marginBottom: 12 }}
          />

          {error && (
            <p style={{ fontSize: 13, color: 'var(--color-coral-text)', margin: '0 0 10px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={guardando}
            style={{
              background: 'var(--color-sage)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 16px', fontSize: 14,
            }}
          >
            {guardando ? 'Guardando…' : 'Guardar invitado'}
          </button>
        </form>
      )}

      {cargando && (
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Cargando invitados…</p>
      )}

      {!cargando && invitados.length === 0 && (
        <div style={{
          background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 6px' }}>
            Aún no hay invitados
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            Agrega tu primer invitado para empezar a construir la lista.
          </p>
        </div>
      )}

      {!cargando && invitados.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
          {invitados.map((inv, i) => (
            <div key={inv.id}>
              {invitadoEditando?.id === inv.id ? (
                <form
                  onSubmit={guardarEdicion}
                  style={{
                    padding: '12px 16px', borderBottom: i < invitados.length - 1 ? '0.5px solid var(--color-border)' : 'none',
                    background: 'var(--color-surface-muted)',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={etiquetaEstilo}>Nombre</label>
                      <input
                        type="text" value={invitadoEditando.nombre_familia}
                        onChange={e => setInvitadoEditando({ ...invitadoEditando, nombre_familia: e.target.value })}
                        style={campoEstilo}
                      />
                    </div>
                    <div>
                      <label style={etiquetaEstilo}>Lada</label>
                      <select
                        value={invitadoEditando.lada}
                        onChange={e => setInvitadoEditando({ ...invitadoEditando, lada: e.target.value })}
                        style={campoEstilo}
                      >
                        {LADAS.map(l => <option key={l.codigo} value={l.codigo}>{l.codigo} {l.pais}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={etiquetaEstilo}>Pases en total</label>
                      <input
                        type="number" min="1" value={invitadoEditando.pases_asignados}
                        onChange={e => setInvitadoEditando({ ...invitadoEditando, pases_asignados: e.target.value })}
                        style={campoEstilo}
                      />
                    </div>
                  </div>
                  <label style={etiquetaEstilo}>Teléfono</label>
                  <input
                    type="tel" value={invitadoEditando.telefono}
                    onChange={e => setInvitadoEditando({ ...invitadoEditando, telefono: e.target.value })}
                    style={{ ...campoEstilo, marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" style={{ background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13 }}>
                      Guardar
                    </button>
                    <button
                      type="button" onClick={() => setInvitadoEditando(null)}
                      style={{ background: 'transparent', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: 'var(--color-text-secondary)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderBottom: i < invitados.length - 1 ? '0.5px solid var(--color-border)' : 'none',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, margin: 0 }}>{inv.nombre_familia}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                      {inv.lada} {inv.telefono || 'sin teléfono'} · {inv.pases_asignados} pases en total
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <EstadoBadge estado={inv.estado_rsvp} />
                    <button
                      onClick={() => setInvitadoEditando({ ...inv })}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarInvitado(inv)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-coral-text)', cursor: 'pointer', fontSize: 12 }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EstadoBadge({ estado }) {
  const estilos = {
    confirmado: { bg: 'var(--color-sage-light)', text: 'var(--color-sage-text)', label: 'Confirmado' },
    no_confirmado: { bg: 'var(--color-coral-light)', text: 'var(--color-coral-text)', label: 'No va' },
    pendiente: { bg: 'var(--color-surface-muted)', text: 'var(--color-text-secondary)', label: 'Pendiente' },
  }
  const s = estilos[estado] || estilos.pendiente
  return (
    <span style={{
      fontSize: 12, background: s.bg, color: s.text, padding: '3px 10px', borderRadius: 20,
    }}>
      {s.label}
    </span>
  )
}

const etiquetaEstilo = { fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }
const campoEstilo = {
  width: '100%', padding: '7px 9px', border: '0.5px solid var(--color-border)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
}
