import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

// Lista de plantillas disponibles para elegir. Cuando agregues una nueva
// en src/components/plantillas/, agrégala aquí también con su nombre visible.
const PLANTILLAS_DISPONIBLES = [
  { id: 'clasica', nombre: 'Clásica — sobre animado' },
  { id: 'jardin_botanico', nombre: 'Jardín Botánico — salvia y dorado' },
]

const TIPOS_REGALO = [
  { id: 'link_tienda', label: 'Link a tienda (Amazon, Liverpool, etc.)' },
  { id: 'cuenta_deposito', label: 'Cuenta para depósito' },
  { id: 'sobrecitos', label: 'Se aceptan sobrecitos' },
]

export default function DisenoBoda({ boda, onGuardado }) {
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const [plantillaId, setPlantillaId] = useState(boda.plantilla_id || 'clasica')
  const [colorPrimario, setColorPrimario] = useState(boda.colores?.primario || '#7C8B6F')
  const [colorSecundario, setColorSecundario] = useState(boda.colores?.secundario || '#E7ECE1')
  const [imagenFondo, setImagenFondo] = useState(boda.imagen_fondo_url || '')

  const [itinerario, setItinerario] = useState(boda.itinerario || [])
  const [tiposRegalo, setTiposRegalo] = useState(boda.regalos?.tipo || [])
  const [linkTiendaNombre, setLinkTiendaNombre] = useState(boda.regalos?.link_tienda?.nombre_tienda || '')
  const [linkTiendaUrl, setLinkTiendaUrl] = useState(boda.regalos?.link_tienda?.url || '')
  const [banco, setBanco] = useState(boda.regalos?.cuenta_deposito?.banco || '')
  const [titular, setTitular] = useState(boda.regalos?.cuenta_deposito?.titular || '')
  const [numeroCuenta, setNumeroCuenta] = useState(boda.regalos?.cuenta_deposito?.numero_cuenta || '')
  const [textoSobrecitos, setTextoSobrecitos] = useState(boda.regalos?.sobrecitos?.texto_mostrar || 'Se aceptan sobrecitos')

  const [galeria, setGaleria] = useState(boda.galeria_fotos || [])
  const [nuevaFotoUrl, setNuevaFotoUrl] = useState('')

  const [codigoVestimenta, setCodigoVestimenta] = useState(boda.codigo_vestimenta || '')
  const [notasAdicionales, setNotasAdicionales] = useState(boda.notas_adicionales || '')

  // ---- Itinerario: agregar/quitar/editar eventos ----
  function agregarEvento() {
    setItinerario([...itinerario, { nombre_evento: '', hora: '', lugar: '', link_mapa: '' }])
  }
  function actualizarEvento(i, campo, valor) {
    const copia = [...itinerario]
    copia[i] = { ...copia[i], [campo]: valor }
    setItinerario(copia)
  }
  function quitarEvento(i) {
    setItinerario(itinerario.filter((_, idx) => idx !== i))
  }

  // ---- Galería: agregar/quitar fotos ----
  function agregarFoto() {
    if (!nuevaFotoUrl.trim()) return
    setGaleria([...galeria, nuevaFotoUrl.trim()])
    setNuevaFotoUrl('')
  }
  function quitarFoto(i) {
    setGaleria(galeria.filter((_, idx) => idx !== i))
  }

  function alternarTipoRegalo(id) {
    setTiposRegalo(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  async function guardarTodo() {
    setGuardando(true)
    setMensaje(null)

    const datos = {
      plantilla_id: plantillaId,
      colores: { primario: colorPrimario, secundario: colorSecundario },
      imagen_fondo_url: imagenFondo.trim(),
      itinerario: itinerario.filter(ev => ev.nombre_evento.trim()),
      regalos: {
        tipo: tiposRegalo,
        link_tienda: { nombre_tienda: linkTiendaNombre.trim(), url: linkTiendaUrl.trim() },
        cuenta_deposito: { banco: banco.trim(), titular: titular.trim(), numero_cuenta: numeroCuenta.trim() },
        sobrecitos: { texto_mostrar: textoSobrecitos.trim() },
      },
      galeria_fotos: galeria,
      codigo_vestimenta: codigoVestimenta.trim(),
      notas_adicionales: notasAdicionales.trim(),
    }

    try {
      await updateDoc(doc(db, 'bodas', boda.id), datos)
      setMensaje('Guardado correctamente.')
      onGuardado?.()
    } catch (e) {
      setMensaje('No se pudo guardar. Intenta de nuevo.')
    }
    setGuardando(false)
  }

  return (
    <div style={{ maxWidth: 720, margin: '1.5rem auto 4rem', padding: '0 1.5rem' }}>

      {/* ---- Plantilla ---- */}
      <Bloque titulo="Plantilla visual">
        <select value={plantillaId} onChange={e => setPlantillaId(e.target.value)} style={campoEstilo}>
          {PLANTILLAS_DISPONIBLES.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </Bloque>

      {/* ---- Colores e imagen ---- */}
      <Bloque titulo="Colores e imagen de fondo">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={etiquetaEstilo}>Color primario</label>
            <input type="color" value={colorPrimario} onChange={e => setColorPrimario(e.target.value)} style={{ width: '100%', height: 38, border: '0.5px solid var(--color-border)', borderRadius: 8 }} />
          </div>
          <div>
            <label style={etiquetaEstilo}>Color de fondo</label>
            <input type="color" value={colorSecundario} onChange={e => setColorSecundario(e.target.value)} style={{ width: '100%', height: 38, border: '0.5px solid var(--color-border)', borderRadius: 8 }} />
          </div>
        </div>
        <label style={etiquetaEstilo}>URL de imagen de fondo (opcional)</label>
        <input type="text" value={imagenFondo} onChange={e => setImagenFondo(e.target.value)} placeholder="https://..." style={campoEstilo} />
      </Bloque>

      {/* ---- Itinerario ---- */}
      <Bloque titulo="Itinerario">
        {itinerario.map((ev, i) => (
          <div key={i} style={{ background: 'var(--color-surface-muted)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 6 }}>
              <input type="text" placeholder="Nombre del evento (ej. Ceremonia)" value={ev.nombre_evento} onChange={e => actualizarEvento(i, 'nombre_evento', e.target.value)} style={campoEstilo} />
              <input type="text" placeholder="Hora" value={ev.hora} onChange={e => actualizarEvento(i, 'hora', e.target.value)} style={campoEstilo} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
              <input type="text" placeholder="Lugar" value={ev.lugar} onChange={e => actualizarEvento(i, 'lugar', e.target.value)} style={campoEstilo} />
              <input type="text" placeholder="Link de mapa" value={ev.link_mapa} onChange={e => actualizarEvento(i, 'link_mapa', e.target.value)} style={campoEstilo} />
              <button onClick={() => quitarEvento(i)} style={botonQuitarEstilo}>✕</button>
            </div>
          </div>
        ))}
        <button onClick={agregarEvento} style={botonAgregarEstilo}>+ Agregar evento</button>
      </Bloque>

      {/* ---- Regalos ---- */}
      <Bloque titulo="Mesa de regalos">
        {TIPOS_REGALO.map(t => (
          <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
            <input type="checkbox" checked={tiposRegalo.includes(t.id)} onChange={() => alternarTipoRegalo(t.id)} />
            {t.label}
          </label>
        ))}

        {tiposRegalo.includes('link_tienda') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 10 }}>
            <input type="text" placeholder="Nombre tienda (ej. Liverpool)" value={linkTiendaNombre} onChange={e => setLinkTiendaNombre(e.target.value)} style={campoEstilo} />
            <input type="text" placeholder="URL de la mesa de regalos" value={linkTiendaUrl} onChange={e => setLinkTiendaUrl(e.target.value)} style={campoEstilo} />
          </div>
        )}

        {tiposRegalo.includes('cuenta_deposito') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <input type="text" placeholder="Banco" value={banco} onChange={e => setBanco(e.target.value)} style={campoEstilo} />
            <input type="text" placeholder="Titular" value={titular} onChange={e => setTitular(e.target.value)} style={campoEstilo} />
            <input type="text" placeholder="Número de cuenta" value={numeroCuenta} onChange={e => setNumeroCuenta(e.target.value)} style={campoEstilo} />
          </div>
        )}

        {tiposRegalo.includes('sobrecitos') && (
          <input type="text" value={textoSobrecitos} onChange={e => setTextoSobrecitos(e.target.value)} style={campoEstilo} />
        )}
      </Bloque>

      {/* ---- Galería ---- */}
      <Bloque titulo="Galería de fotos">
        {galeria.map((url, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
            <button onClick={() => quitarFoto(i)} style={botonQuitarEstilo}>✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" placeholder="URL de la foto" value={nuevaFotoUrl} onChange={e => setNuevaFotoUrl(e.target.value)} style={{ ...campoEstilo, flex: 1 }} />
          <button onClick={agregarFoto} style={botonAgregarEstilo}>+ Agregar</button>
        </div>
      </Bloque>

      {/* ---- Vestimenta y notas ---- */}
      <Bloque titulo="Código de vestimenta (opcional)">
        <input type="text" value={codigoVestimenta} onChange={e => setCodigoVestimenta(e.target.value)} placeholder="Ej. Formal, colores tierra" style={campoEstilo} />
      </Bloque>

      <Bloque titulo="Notas adicionales (opcional)">
        <textarea
          value={notasAdicionales} onChange={e => setNotasAdicionales(e.target.value)}
          placeholder="Ej. Hashtag del evento, boda libre de niños, etc."
          rows={3}
          style={{ ...campoEstilo, resize: 'vertical' }}
        />
      </Bloque>

      {mensaje && <p style={{ fontSize: 13, color: 'var(--color-sage-text)', marginBottom: 10 }}>{mensaje}</p>}

      <button
        onClick={guardarTodo} disabled={guardando}
        style={{ background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14 }}
      >
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}

function Bloque({ titulo, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>{titulo}</p>
      {children}
    </div>
  )
}

const etiquetaEstilo = { fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 3, fontFamily: 'var(--font-sans)' }
const campoEstilo = {
  width: '100%', padding: '7px 9px', border: '0.5px solid var(--color-border)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
}
const botonAgregarEstilo = {
  fontSize: 12, background: 'transparent', border: '0.5px solid var(--color-border)',
  borderRadius: 8, padding: '6px 12px', color: 'var(--color-text-secondary)',
}
const botonQuitarEstilo = {
  background: 'none', border: 'none', color: 'var(--color-coral-text)', cursor: 'pointer', fontSize: 13,
}
