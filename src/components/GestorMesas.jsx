import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { asignarInvitadoAMesa, quitarDeMesaEspecifica, corregirMesasDesactualizadas, moverInvitadoDeMesa, lugaresDeInvitado } from '../lib/mesaHelpers'
import { exportarMesasExcel } from '../lib/exportarExcel'
import { coincideBusqueda } from '../lib/texto'

export default function GestorMesas({ boda, onVolver, ocultarVolver }) {
  const [invitados, setInvitados] = useState([])
  const [mesas, setMesas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormMesa, setMostrarFormMesa] = useState(false)
  const [nombreMesa, setNombreMesa] = useState('')
  const [capacidadMesa, setCapacidadMesa] = useState(8)
  const [invitadoArrastrado, setInvitadoArrastrado] = useState(null)
  const [mesaEditando, setMesaEditando] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
    // Sin setCargando(true): al recargar después de un cambio, los datos
    // se actualizan sin borrar la pantalla ni regresarte hasta arriba.
    // El "Cargando…" solo aparece la primera vez (useState(true)).
    const invitadosSnap = await getDocs(
      query(collection(db, 'bodas', boda.id, 'invitados'), orderBy('nombre_familia'))
    )
    const mesasSnap = await getDocs(collection(db, 'bodas', boda.id, 'mesas'))
    const listaInvitados = invitadosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    let listaMesas = mesasSnap.docs.map(d => ({ id: d.id, ...d.data(), asignaciones: d.data().asignaciones || [] }))
    // Si alguna mesa quedó con pases o nombres viejos, se corrige aquí
    try {
      listaMesas = await corregirMesasDesactualizadas(boda.id, listaMesas, listaInvitados)
    } catch (e) {
      // Si no se pudo corregir, se muestran como están
    }
    setInvitados(listaInvitados)
    setMesas(listaMesas)
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
  // El buscador ignora acentos, mayúsculas y orden: "lopez hector" encuentra "Héctor López"
  const invitadosLibres = invitados
    .filter(i => !idsAsignados.has(i.id))
    .filter(i => coincideBusqueda(i.nombre_familia, busqueda))

  const confirmados = invitadosLibres.filter(i => i.estado_rsvp === 'confirmado')
  const pendientes = invitadosLibres.filter(i => i.estado_rsvp === 'pendiente')
  const noConfirmados = invitadosLibres.filter(i => i.estado_rsvp === 'no_confirmado')

  async function soltarEnMesa(mesa) {
    if (!invitadoArrastrado || procesando) return

    // Si viene de una mesa y lo sueltan en esa misma mesa, no hay nada que hacer
    const origenId = invitadoArrastrado.mesaOrigenId
    if (origenId === mesa.id) {
      setInvitadoArrastrado(null)
      return
    }

    setProcesando(true)

    try {
      // Si ya estaba sentado en otra mesa, se CAMBIA de mesa; si no, se asigna.
      // Primer intento sin forzar: si excede capacidad, la transacción nos
      // avisa sin escribir nada todavía.
      const intentar = (forzar) => origenId
        ? moverInvitadoDeMesa(boda.id, origenId, mesa.id, invitadoArrastrado.id, forzar)
        : asignarInvitadoAMesa(boda.id, mesa.id, invitadoArrastrado, forzar)

      let resultado = await intentar(false)

      if (!resultado.ok && resultado.motivo === 'excede_capacidad') {
        const continuar = window.confirm(
          `Esta mesa tiene capacidad para ${resultado.capacidad} y ya hay ${resultado.ocupados} ocupados. ` +
          `Agregar a "${invitadoArrastrado.nombre_familia}" va a exceder el límite. ¿Agregar de todas formas?`
        )
        if (continuar) {
          resultado = await intentar(true)
        }
      }

      // Si motivo === 'ya_asignado', es un doble-submit (doble clic/soltar
      // duplicado): no hacemos nada, el invitado ya quedó en la mesa desde
      // el intento anterior. Esto es justo lo que evita el duplicado.

      // Si salió bien, se refleja en pantalla de inmediato (sin esperar a
      // volver a leer todo) y luego se sincroniza en silencio.
      if (resultado.ok) {
        const inv = invitadoArrastrado
        setMesas(prev => {
          const asignacionPrevia = prev
            .find(m => m.id === origenId)?.asignaciones.find(a => a.invitado_id === inv.id)
          const nueva = asignacionPrevia || {
            invitado_id: inv.id,
            nombre_familia: inv.nombre_familia,
            lugares_ocupados: lugaresDeInvitado(inv),
          }
          return prev.map(m => {
            if (m.id === origenId) return { ...m, asignaciones: m.asignaciones.filter(a => a.invitado_id !== inv.id) }
            if (m.id === mesa.id) return { ...m, asignaciones: [...m.asignaciones, nueva] }
            return m
          })
        })
      }

      setInvitadoArrastrado(null)
      cargarTodo()
    } finally {
      setProcesando(false)
    }
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
    await quitarDeMesaEspecifica(boda.id, mesa.id, invitadoId)
    cargarTodo()
  }

  // Soltar en la lista de la izquierda a alguien que venía de una mesa = quitarlo de la mesa
  async function soltarEnLista() {
    if (!invitadoArrastrado?.mesaOrigenId || procesando) return
    setProcesando(true)
    try {
      await quitarDeMesaEspecifica(boda.id, invitadoArrastrado.mesaOrigenId, invitadoArrastrado.id)
      setInvitadoArrastrado(null)
      await cargarTodo()
    } finally {
      setProcesando(false)
    }
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

      <p style={{ fontSize: 13, color: invitadoArrastrado ? 'var(--color-sage-text)' : 'var(--color-text-muted)', margin: '0 0 1.5rem' }}>
        {invitadoArrastrado
          ? invitadoArrastrado.mesaOrigenId
            ? `"${invitadoArrastrado.nombre_familia}" seleccionado — toca otra mesa para cambiarlo, o tócalo de nuevo para cancelar`
            : `"${invitadoArrastrado.nombre_familia}" seleccionado — toca una mesa para asignarlo, o toca de nuevo para cancelar`
          : 'Arrastra un invitado hacia una mesa (o tócalo y luego toca la mesa). Para cambiar de mesa, arrastra o toca a alguien que ya esté sentado.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Columna izquierda: invitados sin mesa.
            Se queda fija en pantalla (sticky) y tiene su propio scroll:
            al deslizar los nombres NO se mueven las mesas, y al deslizar
            las mesas la lista de nombres sigue visible para arrastrar. */}
        <div style={{
          position: 'sticky', top: 16,
          maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
          overscrollBehavior: 'contain',
          paddingRight: 6,
        }}
          onDragOver={e => { if (invitadoArrastrado?.mesaOrigenId) e.preventDefault() }}
          onDrop={soltarEnLista}
        >
          {/* Buscador: se queda arriba aunque deslices la lista */}
          <div style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--color-bg)', paddingBottom: 10 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar invitado…"
                style={{
                  width: '100%', padding: '8px 30px 8px 10px', border: '0.5px solid var(--color-border)',
                  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
                  background: 'var(--color-surface)',
                }}
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  title="Borrar búsqueda"
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            {busqueda && invitadosLibres.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '8px 0 0' }}>
                Nadie sin mesa coincide con "{busqueda}".
              </p>
            )}
          </div>
          <SeccionInvitados titulo="Confirmados" color="var(--color-sage)" invitados={confirmados} seleccionado={invitadoArrastrado} onArrastrar={setInvitadoArrastrado} />
          <SeccionInvitados titulo="Pendientes" color="var(--color-text-muted)" invitados={pendientes} seleccionado={invitadoArrastrado} onArrastrar={setInvitadoArrastrado} />
          <SeccionInvitados titulo="No confirmados" color="var(--color-coral)" invitados={noConfirmados} seleccionado={invitadoArrastrado} onArrastrar={setInvitadoArrastrado} />
        </div>

        {/* Columna derecha: mesas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Mesas</span>
            <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => exportarMesasExcel(boda, mesas, invitados)}
              disabled={mesas.length === 0}
              style={{
                fontSize: 13, background: 'transparent', border: '0.5px solid var(--color-border)',
                borderRadius: 8, padding: '6px 14px', color: 'var(--color-text-secondary)',
                cursor: mesas.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Exportar Excel
            </button>
            <button
              onClick={() => setMostrarFormMesa(!mostrarFormMesa)}
              style={{ fontSize: 13, background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px' }}
            >
              {mostrarFormMesa ? 'Cancelar' : '+ Crear mesa'}
            </button>
            </div>
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
                  onClick={() => { if (invitadoArrastrado) soltarEnMesa(mesa) }}
                  style={{
                    background: 'var(--color-surface)',
                    border: invitadoArrastrado ? '1.5px dashed var(--color-sage)' : '0.5px solid var(--color-border)',
                    borderRadius: 14, padding: '14px 16px', minHeight: 120,
                    boxShadow: '0 1px 2px rgba(28,28,28,0.04)',
                    cursor: invitadoArrastrado ? (procesando ? 'wait' : 'pointer') : 'default',
                    opacity: procesando ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, margin: 0, color: 'var(--color-text-primary)' }}>
                      {mesa.nombre}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                        padding: '3px 9px', borderRadius: 20,
                        background: lleno ? 'var(--color-coral-light)' : 'var(--color-surface-muted)',
                        color: lleno ? 'var(--color-coral-text)' : 'var(--color-text-muted)',
                      }}>
                        {ocupados}/{mesa.capacidad}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); setMesaEditando({ ...mesa }) }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 11 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); eliminarMesa(mesa) }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-coral-text)', cursor: 'pointer', fontSize: 11 }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div style={{ height: 3, background: 'var(--color-surface-muted)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${Math.min(100, (ocupados / mesa.capacidad) * 100)}%`,
                      background: lleno ? 'var(--color-coral)' : 'var(--color-sage)',
                    }} />
                  </div>
                  {mesa.asignaciones.map(a => {
                    const invitadoActual = invitados.find(i => i.id === a.invitado_id)
                    const esPendiente = invitadoActual?.estado_rsvp === 'pendiente' || !invitadoActual?.estado_rsvp
                    const seleccionado = invitadoArrastrado?.id === a.invitado_id
                    const datosParaMover = {
                      ...(invitadoActual || {}),
                      id: a.invitado_id,
                      nombre_familia: a.nombre_familia,
                      mesaOrigenId: mesa.id,
                    }
                    return (
                      <div
                        key={a.invitado_id}
                        draggable
                        onDragStart={e => { e.stopPropagation(); setInvitadoArrastrado(datosParaMover) }}
                        onClick={e => {
                          e.stopPropagation()
                          if (seleccionado) setInvitadoArrastrado(null)
                          else if (invitadoArrastrado) soltarEnMesa(mesa)
                          else setInvitadoArrastrado(datosParaMover)
                        }}
                        title="Arrastra o toca para cambiar de mesa"
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          fontSize: 12, borderRadius: 8, padding: '6px 10px', marginBottom: 4, cursor: 'grab',
                          background: seleccionado ? 'var(--color-sage-light)' : 'var(--color-surface-muted)',
                          outline: seleccionado ? '1px solid var(--color-sage)' : 'none',
                          opacity: esPendiente && !seleccionado ? 0.55 : 1,
                        }}
                      >
                        <span style={{ color: esPendiente ? 'var(--color-text-muted)' : 'inherit' }}>
                          {a.nombre_familia} ({a.lugares_ocupados})
                          {esPendiente && <span style={{ fontSize: 10, marginLeft: 6, fontStyle: 'italic' }}>sin confirmar</span>}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); quitarDeMesa(mesa, a.invitado_id) }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12 }}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
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

function SeccionInvitados({ titulo, color, invitados, seleccionado, onArrastrar }) {
  function manejarClick(inv) {
    // Toggle: si ya estaba seleccionado este mismo invitado, lo deselecciona
    onArrastrar(seleccionado?.id === inv.id ? null : inv)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
        color, margin: '0 0 8px', fontWeight: 500,
      }}>
        {titulo} · {invitados.length}
      </p>
      {invitados.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>—</p>
      )}
      {invitados.map(inv => {
        const activo = seleccionado?.id === inv.id
        return (
          <div
            key={inv.id}
            draggable
            onDragStart={() => onArrastrar(inv)}
            onClick={() => manejarClick(inv)}
            style={{
              background: activo ? 'var(--color-sage-light)' : 'var(--color-surface)',
              border: activo ? '1px solid var(--color-sage)' : '0.5px solid var(--color-border)',
              borderRadius: 8, padding: '7px 11px', fontSize: 13, marginBottom: 6, cursor: 'grab',
              boxShadow: '0 1px 2px rgba(28,28,28,0.03)',
            }}
          >
            {inv.nombre_familia}
            <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}> ({inv.pases_confirmados ?? inv.pases_asignados})</span>
          </div>
        )
      })}
    </div>
  )
}
