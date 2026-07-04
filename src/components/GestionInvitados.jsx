import { useEffect, useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import ImportarExcel from './ImportarExcel'

const LADAS = [
  { codigo: '+52', pais: 'México' },
  { codigo: '+1', pais: 'Estados Unidos' },
  { codigo: '+57', pais: 'Colombia' },
  { codigo: '+34', pais: 'España' },
  { codigo: '+54', pais: 'Argentina' },
]

export default function GestionInvitados({ boda, onVolver, ocultarVolver }) {
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarImportar, setMostrarImportar] = useState(false)

  const [nombreFamilia, setNombreFamilia] = useState('')
  const [telefono, setTelefono] = useState('')
  const [lada, setLada] = useState('+52')
  const [pasesAsignados, setPasesAsignados] = useState(1)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [invitadoEditando, setInvitadoEditando] = useState(null)
  const [avisoCambioPases, setAvisoCambioPases] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [whatsappAbierto, setWhatsappAbierto] = useState(null)
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState('')

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

    const original = invitados.find(i => i.id === invitadoEditando.id)
    const pasesNuevos = Number(invitadoEditando.pases_asignados)
    const cambioDePases = original && original.pases_asignados !== pasesNuevos

    await updateDoc(doc(db, 'bodas', boda.id, 'invitados', invitadoEditando.id), {
      nombre_familia: invitadoEditando.nombre_familia.trim(),
      telefono: invitadoEditando.telefono.trim(),
      lada: invitadoEditando.lada,
      pases_asignados: pasesNuevos,
      actualizado_en: new Date(),
    })

    if (cambioDePases) {
      setAvisoCambioPases(
        `Cambiaste el número de pases de ${invitadoEditando.nombre_familia} (de ${original.pases_asignados} a ${pasesNuevos}). Recuerda avisarle directamente para que no se entere hasta el día del evento.`
      )
    }

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

  async function cambiarEstado(invitado, nuevoEstado) {
    const pasesSegunEstado = {
      confirmado: invitado.pases_asignados,
      no_confirmado: 0,
      pendiente: null,
    }
    await updateDoc(doc(db, 'bodas', boda.id, 'invitados', invitado.id), {
      estado_rsvp: nuevoEstado,
      pases_confirmados: pasesSegunEstado[nuevoEstado],
      actualizado_en: new Date(),
    })

    // MISMA REGLA que usa la Cloud Function confirmarRSVP: si el invitado
    // ya estaba sentado en una mesa, lo sacamos al cambiar su estado desde
    // aquí también. Antes esto solo pasaba cuando el invitado confirmaba
    // por su cuenta desde la invitación pública — si el admin lo cambiaba
    // manualmente desde este panel, la mesa nunca se actualizaba y podía
    // quedar un invitado "no va" sentado en una mesa como si nada.
    const mesasSnap = await getDocs(collection(db, 'bodas', boda.id, 'mesas'))
    for (const mesaDoc of mesasSnap.docs) {
      const asignaciones = mesaDoc.data().asignaciones || []
      if (asignaciones.some(a => a.invitado_id === invitado.id)) {
        await updateDoc(mesaDoc.ref, {
          asignaciones: asignaciones.filter(a => a.invitado_id !== invitado.id),
        })
      }
    }

    cargarInvitados()
  }

  function abrirWhatsapp(invitado) {
    if (!invitado.telefono) return
    const numero = `${invitado.lada}${invitado.telefono}`.replace(/[^\d+]/g, '')
    const texto = encodeURIComponent(mensajeWhatsapp)
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank')
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

  const conteos = {
    todos: totalPases,
    confirmado: invitados.reduce((s, i) => i.estado_rsvp === 'confirmado' ? s + (i.pases_confirmados || 0) : s, 0),
    no_confirmado: invitados.reduce((s, i) => i.estado_rsvp === 'no_confirmado' ? s + (i.pases_asignados || 0) : s, 0),
    pendiente: invitados.reduce((s, i) => (i.estado_rsvp === 'pendiente' || !i.estado_rsvp) ? s + (i.pases_asignados || 0) : s, 0),
  }

  const invitadosFiltrados = invitados
    .filter(inv => inv.nombre_familia.toLowerCase().includes(busqueda.toLowerCase()))
    .filter(inv => {
      if (filtroEstado === 'todos') return true
      if (filtroEstado === 'pendiente') return inv.estado_rsvp === 'pendiente' || !inv.estado_rsvp
      return inv.estado_rsvp === filtroEstado
    })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {!ocultarVolver && (
        <button
          onClick={onVolver}
          style={{
            fontSize: 13, background: 'transparent', border: 'none',
            color: 'var(--color-text-secondary)', padding: 0, marginBottom: 16, cursor: 'pointer',
          }}
        >
          ← Volver a tus bodas
        </button>
      )}

      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 1.5rem' }}>
        {invitados.length} familias registradas · {totalPases} pases en total
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Invitados</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setMostrarImportar(!mostrarImportar)}
            style={{
              fontSize: 13, background: 'transparent', border: '0.5px solid var(--color-border)',
              borderRadius: 8, padding: '6px 14px', color: 'var(--color-text-secondary)',
            }}
          >
            Importar Excel
          </button>
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
      </div>

      {mostrarImportar && (
        <ImportarExcel
          boda={boda}
          onTerminado={() => { setMostrarImportar(false); cargarInvitados() }}
          onCancelar={() => setMostrarImportar(false)}
        />
      )}

      <input
        type="text"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre…"
        style={{ ...campoEstilo, marginBottom: 10 }}
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <FiltroEstado label="Todos" cantidad={conteos.todos} activo={filtroEstado === 'todos'} onClick={() => setFiltroEstado('todos')} />
        <FiltroEstado label="Confirmados" cantidad={conteos.confirmado} activo={filtroEstado === 'confirmado'} onClick={() => setFiltroEstado('confirmado')} tipo="confirmado" />
        <FiltroEstado label="Pendientes" cantidad={conteos.pendiente} activo={filtroEstado === 'pendiente'} onClick={() => setFiltroEstado('pendiente')} tipo="pendiente" />
        <FiltroEstado label="No van" cantidad={conteos.no_confirmado} activo={filtroEstado === 'no_confirmado'} onClick={() => setFiltroEstado('no_confirmado')} tipo="no_confirmado" />
      </div>

      {avisoCambioPases && (
        <div style={{
          background: 'var(--color-coral-light)', color: 'var(--color-coral-text)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
        }}>
          <span>{avisoCambioPases}</span>
          <button
            onClick={() => setAvisoCambioPases(null)}
            style={{ background: 'none', border: 'none', color: 'var(--color-coral-text)', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

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
              <label style={etiquetaEstilo}>Pases en total</label>
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
          {invitadosFiltrados.map((inv, i) => (
            <div key={inv.id}>
              {invitadoEditando?.id === inv.id ? (
                <form
                  onSubmit={guardarEdicion}
                  style={{
                    padding: '12px 16px', borderBottom: i < invitadosFiltrados.length - 1 ? '0.5px solid var(--color-border)' : 'none',
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
                <div style={{ borderBottom: i < invitadosFiltrados.length - 1 ? '0.5px solid var(--color-border)' : 'none' }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, margin: 0 }}>{inv.nombre_familia}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                        {inv.lada} {inv.telefono || 'sin teléfono'} · {inv.pases_asignados} pases en total
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => { setWhatsappAbierto(whatsappAbierto === inv.id ? null : inv.id); setMensajeWhatsapp('') }}
                        disabled={!inv.telefono}
                        style={{
                          background: 'none', border: 'none', cursor: inv.telefono ? 'pointer' : 'not-allowed',
                          color: inv.telefono ? 'var(--color-sage-text)' : 'var(--color-text-muted)', fontSize: 12,
                        }}
                      >
                        WhatsApp
                      </button>
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

                  {/* Botones de estado, clickeables para marcar manualmente */}
                  <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
                    <BotonEstado label="Pendiente" activo={inv.estado_rsvp === 'pendiente' || !inv.estado_rsvp} onClick={() => cambiarEstado(inv, 'pendiente')} tipo="pendiente" />
                    <BotonEstado label="Confirmado" activo={inv.estado_rsvp === 'confirmado'} onClick={() => cambiarEstado(inv, 'confirmado')} tipo="confirmado" />
                    <BotonEstado label="No va" activo={inv.estado_rsvp === 'no_confirmado'} onClick={() => cambiarEstado(inv, 'no_confirmado')} tipo="no_confirmado" />
                  </div>

                  {/* Compositor de WhatsApp: mensaje libre cada vez */}
                  {whatsappAbierto === inv.id && (
                    <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={mensajeWhatsapp}
                        onChange={e => setMensajeWhatsapp(e.target.value)}
                        placeholder="Escribe tu mensaje…"
                        style={{ ...campoEstilo, flex: 1 }}
                      />
                      <button
                        onClick={() => abrirWhatsapp(inv)}
                        style={{ background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, whiteSpace: 'nowrap' }}
                      >
                        Abrir WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FiltroEstado({ label, cantidad, activo, onClick, tipo }) {
  const colores = {
    todos: { bg: 'var(--color-ink)', text: 'var(--color-coral)' },
    confirmado: { bg: 'var(--color-sage-light)', text: 'var(--color-sage-text)' },
    pendiente: { bg: 'var(--color-surface-muted)', text: 'var(--color-text-secondary)' },
    no_confirmado: { bg: 'var(--color-coral-light)', text: 'var(--color-coral-text)' },
  }
  const c = colores[tipo || 'todos']
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
        border: activo ? 'none' : '0.5px solid var(--color-border)',
        background: activo ? c.bg : 'transparent',
        color: activo ? c.text : 'var(--color-text-secondary)',
      }}
    >
      {label}
      <span style={{
        fontSize: 11, padding: '1px 6px', borderRadius: 10,
        background: activo ? 'rgba(255,255,255,0.25)' : 'var(--color-surface-muted)',
        color: activo ? 'inherit' : 'var(--color-text-muted)',
      }}>
        {cantidad}
      </span>
    </button>
  )
}

function BotonEstado({ label, activo, onClick, tipo }) {
  const colores = {
    pendiente: { bg: 'var(--color-surface-muted)', text: 'var(--color-text-secondary)' },
    confirmado: { bg: 'var(--color-sage-light)', text: 'var(--color-sage-text)' },
    no_confirmado: { bg: 'var(--color-coral-light)', text: 'var(--color-coral-text)' },
  }
  const c = colores[tipo]
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
        padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
        background: activo ? c.bg : 'transparent',
        color: activo ? c.text : 'var(--color-text-muted)',
        outline: activo ? 'none' : '0.5px solid var(--color-border)',
      }}
    >
      {activo && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: 0.7 }} />}
      {label}
    </button>
  )
}

const etiquetaEstilo = { fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }
const campoEstilo = {
  width: '100%', padding: '7px 9px', border: '0.5px solid var(--color-border)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
}
