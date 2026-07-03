import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

export default function GestorMesas({ boda, onVolver, ocultarVolver }) {
  const [invitados, setInvitados] = useState([])
  const [mesas, setMesas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormMesa, setMostrarFormMesa] = useState(false)
  const [nombreMesa, setNombreMesa] = useState('')
  const [capacidadMesa, setCapacidadMesa] = useState(8)
  const [invitadoArrastrado, setInvitadoArrastrado] = useState(null)
  const [mesaEditando, setMesaEditando] = useState(null)

  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
    setCargando(true)
    const invitadosSnap = await getDocs(
      query(collection(db, 'bodas', boda.id, 'invitados'), orderBy('nombre_familia'))
    )
    const mesasSnap = await getDocs(collection(db, 'bodas', boda.id, 'mesas'))
    setInvitados(invitadosSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setMesas(mesasSnap.docs.map(d => ({ id: d.id, ...d.data(), asignaciones: d.data().asignaciones || [] })))
    setCargando(false)
  }

  async function crearMesa(e) {
    e.preventDefault()
    if (!nombreMesa.trim()) return
    await addDoc(collection(db, 'bodas', boda.id, 'mesas'), {
      nombre: nombreMesa.trim(),
      capacidad: Number(capacidadMesa),
      asignaciones: [],
    })
    setNombreMesa('')
    setCapacidadMesa(8)
    setMostrarFormMesa(false)
    cargarTodo()
  }

  // ID de invitados que ya están en alguna mesa, para no mostrarlos dos veces
  const idsAsignados = new Set(mesas.flatMap(m => m.asignaciones.map(a => a.invitado_id)))
  const invitadosLibres = invitados.filter(i => !idsAsignados.has(i.id))

  const confirmados = invitadosLibres.filter(i => i.estado_rsvp === 'confirmado')
  const pendientes = invitadosLibres.filter(i => i.estado_rsvp === 'pendiente')
  const noConfirmados = invitadosLibres.filter(i => i.estado_rsvp === 'no_confirmado')

  async function soltarEnMesa(mesa) {
    if (!invitadoArrastrado) return

    const lugaresQueOcupa = invitadoArrastrado.pases_confirmados ?? invitadoArrastrado.pases_asignados ?? 1
    const ocupadosActuales = mesa.asignaciones.reduce((acc, a) => acc + (a.lugares_ocupados || 0), 0)

    if (ocupadosActuales + lugaresQueOcupa > mesa.capacidad) {
      const continuar = window.confirm(
        `Esta mesa tiene capacidad para ${mesa.capacidad} y ya hay ${ocupadosActuales} ocupados. ` +
        `Agregar a "${invitadoArrastrado.nombre_familia}" (${lugaresQueOcupa}) va a exceder el límite. ¿Agregar de todas formas?`
      )
      if (!continuar) {
        setInvitadoArrastrado(null)
        return
      }
    }

    const nuevasAsignaciones = [
      ...mesa.asignaciones,
      {
        invitado_id: invitadoArrastrado.id,
        nombre_familia: invitadoArrastrado.nombre_familia,
        lugares_ocupados: lugaresQueOcupa,
      },
    ]

    await updateDoc(doc(db, 'bodas', boda.id, 'mesas', mesa.id), { asignaciones: nuevasAsignaciones })
    setInvitadoArrastrado(null)
    cargarTodo()
  }

  async function guardarEdicionMesa(e) {
    e.preventDefault()
    if (!mesaEditando.nombre.trim()) return
    await updateDoc(doc(db, 'bodas', boda.id, 'mesas', mesaEditando.id), {
      nombre: mesaEditando.nombre.trim(),
      capacidad: Number(mesaEditando.capacidad),
    })
    setMesaEditando(null)
    cargarTodo()
  }

  async function eliminarMesa(mesa) {
    const conGente = mesa.asignaciones.length > 0
    const confirmar = window.confirm(
      conGente
        ? `"${mesa.nombre}" tiene ${mesa.asignaciones.length} invitado(s) asignado(s). Al eliminarla, esos invitados regresan a la lista sin mesa. ¿Eliminar de todas formas?`
        : `¿Eliminar la mesa "${mesa.nombre}"?`
    )
    if (!confirmar) return
    await deleteDoc(doc(db, 'bodas', boda.id, 'mesas', mesa.id))
    cargarTodo()
  }

  async function quitarDeMesa(mesa, invitadoId) {
    const nuevasAsignaciones = mesa.asignaciones.filter(a => a.invitado_id !== invitadoId)
    await updateDoc(doc(db, 'bodas', boda.id, 'mesas', mesa.id), { asignaciones: nuevasAsignaciones })
    cargarTodo()
  }

  if (cargando) {
    return <p style={{ padding: '2rem', fontSize: 14, color: 'var(--color-text-muted)' }}>Cargando…</p>
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {!ocultarVolver && (
        <button
          onClick={onVolver}
          style={{ fontSize: 13, background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', padding: 0, marginBottom: 16, cursor: 'pointer' }}
        >
          ← Volver a tus bodas
        </button>
      )}

      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 1.5rem' }}>
        Arrastra un invitado de la izquierda hacia una mesa
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

        {/* Columna izquierda: invitados sin mesa */}
        <div>
          <SeccionInvitados titulo="Confirmados" color="var(--color-sage)" invitados={confirmados} onArrastrar={setInvitadoArrastrado} />
          <SeccionInvitados titulo="Pendientes" color="var(--color-text-muted)" invitados={pendientes} onArrastrar={setInvitadoArrastrado} />
          <SeccionInvitados titulo="No confirmados" color="var(--color-coral)" invitados={noConfirmados} onArrastrar={setInvitadoArrastrado} />
        </div>

        {/* Columna derecha: mesas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Mesas</span>
            <button
              onClick={() => setMostrarFormMesa(!mostrarFormMesa)}
              style={{ fontSize: 13, background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px' }}
            >
              {mostrarFormMesa ? 'Cancelar' : '+ Crear mesa'}
            </button>
          </div>

          {mostrarFormMesa && (
            <form onSubmit={crearMesa} style={{
              display: 'flex', gap: 8, marginBottom: 16, background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 12,
            }}>
              <input
                type="text" placeholder="Nombre de la mesa" value={nombreMesa}
                onChange={e => setNombreMesa(e.target.value)}
                style={{ flex: 1, padding: '7px 9px', border: '0.5px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
              />
              <input
                type="number" min="1" placeholder="Asientos" value={capacidadMesa}
                onChange={e => setCapacidadMesa(e.target.value)}
                style={{ width: 90, padding: '7px 9px', border: '0.5px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
              />
              <button type="submit" style={{ background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13 }}>
                Crear
              </button>
            </form>
          )}

          {mesas.length === 0 && (
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>Aún no has creado mesas.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {mesas.map(mesa => {
              const ocupados = mesa.asignaciones.reduce((acc, a) => acc + (a.lugares_ocupados || 0), 0)
              const lleno = ocupados >= mesa.capacidad

              if (mesaEditando?.id === mesa.id) {
                return (
                  <form
                    key={mesa.id}
                    onSubmit={guardarEdicionMesa}
                    style={{
                      background: 'var(--color-surface-muted)', border: '0.5px solid var(--color-border)',
                      borderRadius: 'var(--radius)', padding: 12,
                    }}
                  >
                    <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 3 }}>Nombre</label>
                    <input
                      type="text" value={mesaEditando.nombre}
                      onChange={e => setMesaEditando({ ...mesaEditando, nombre: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '0.5px solid var(--color-border)', borderRadius: 6, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
                    />
                    <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 3 }}>Asientos</label>
                    <input
                      type="number" min="1" value={mesaEditando.capacidad}
                      onChange={e => setMesaEditando({ ...mesaEditando, capacidad: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '0.5px solid var(--color-border)', borderRadius: 6, fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="submit" style={{ background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12 }}>
                        Guardar
                      </button>
                      <button
                        type="button" onClick={() => setMesaEditando(null)}
                        style={{ background: 'transparent', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: 'var(--color-text-secondary)' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )
              }

              return (
                <div
                  key={mesa.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => soltarEnMesa(mesa)}
                  style={{
                    background: 'var(--color-surface)', border: '0.5px dashed var(--color-border)',
                    borderRadius: 'var(--radius)', padding: 12, minHeight: 120,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <p style={{ fontSize: 14, margin: 0 }}>{mesa.nombre}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: lleno ? 'var(--color-coral-text)' : 'var(--color-text-muted)' }}>
                        {ocupados}/{mesa.capacidad}
                      </span>
                      <button
                        onClick={() => setMesaEditando({ ...mesa })}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 11 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarMesa(mesa)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-coral-text)', cursor: 'pointer', fontSize: 11 }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  {mesa.asignaciones.map(a => (
                    <div key={a.invitado_id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 12, background: 'var(--color-surface-muted)', borderRadius: 6, padding: '4px 8px', marginBottom: 4,
                    }}>
                      <span>{a.nombre_familia} ({a.lugares_ocupados})</span>
                      <button
                        onClick={() => quitarDeMesa(mesa, a.invitado_id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {mesa.asignaciones.length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 20 }}>Suelta aquí</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SeccionInvitados({ titulo, color, invitados, onArrastrar }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 12, color, margin: '0 0 6px', fontWeight: 500 }}>{titulo} ({invitados.length})</p>
      {invitados.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>—</p>
      )}
      {invitados.map(inv => (
        <div
          key={inv.id}
          draggable
          onDragStart={() => onArrastrar(inv)}
          style={{
            background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
            borderRadius: 8, padding: '6px 10px', fontSize: 13, marginBottom: 6, cursor: 'grab',
          }}
        >
          {inv.nombre_familia}
          <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}> ({inv.pases_confirmados ?? inv.pases_asignados})</span>
        </div>
      ))}
    </div>
  )
}
