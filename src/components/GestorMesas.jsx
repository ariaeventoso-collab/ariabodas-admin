import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

export default function GestorMesas({ boda, onVolver }) {
  const [invitados, setInvitados] = useState([])
  const [mesas, setMesas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormMesa, setMostrarFormMesa] = useState(false)
  const [nombreMesa, setNombreMesa] = useState('')
  const [capacidadMesa, setCapacidadMesa] = useState(8)
  const [invitadoArrastrado, setInvitadoArrastrado] = useState(null)

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

      <button
        onClick={onVolver}
        style={{ fontSize: 13, background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', padding: 0, marginBottom: 16, cursor: 'pointer' }}
      >
        ← Volver a tus bodas
      </button>

      <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: '0 0 4px' }}>
        Gestor de mesas — {boda.nombre_novio_1} &amp; {boda.nombre_novio_2}
      </p>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontSize: 14, margin: 0 }}>{mesa.nombre}</p>
                    <span style={{ fontSize: 12, color: lleno ? 'var(--color-coral-text)' : 'var(--color-text-muted)' }}>
                      {ocupados}/{mesa.capacidad}
                    </span>
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
