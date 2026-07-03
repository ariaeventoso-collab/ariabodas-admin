import { useState } from 'react'
import * as XLSX from 'xlsx'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

const LADAS = [
  { codigo: '+52', pais: 'México' },
  { codigo: '+1', pais: 'Estados Unidos' },
  { codigo: '+57', pais: 'Colombia' },
  { codigo: '+34', pais: 'España' },
  { codigo: '+54', pais: 'Argentina' },
]

// Palabras clave para adivinar qué columna del Excel es cuál dato
const PALABRAS_CLAVE = {
  nombre: ['nombre', 'familia', 'invitado', 'apellido'],
  telefono: ['telefono', 'teléfono', 'celular', 'numero', 'número', 'whatsapp', 'tel', 'cel'],
  pases: ['pases', 'personas', 'invitados', 'cantidad', 'lugares', 'boletos'],
  lada: ['lada', 'codigo', 'código', 'pais', 'país'],
}

function normalizar(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function adivinarColumna(headers, campo) {
  const claves = PALABRAS_CLAVE[campo]
  return headers.find(h => claves.some(clave => normalizar(h).includes(clave))) || ''
}

// Separa lada + teléfono a partir de un texto crudo, y opcionalmente
// una columna de lada aparte si el Excel la trae.
function detectarLadaYTelefono(valorTelefono, valorLadaSeparada) {
  let crudo = String(valorTelefono || '').replace(/[^\d+]/g, '')

  if (valorLadaSeparada) {
    const ladaCruda = String(valorLadaSeparada).replace(/[^\d+]/g, '')
    const match = LADAS.find(l => l.codigo.replace('+', '') === ladaCruda.replace('+', ''))
    if (match) return { lada: match.codigo, telefono: crudo }
  }

  if (crudo.startsWith('+')) {
    const match = LADAS.find(l => crudo.startsWith(l.codigo))
    if (match) return { lada: match.codigo, telefono: crudo.slice(match.codigo.length) }
  }

  if (crudo.length === 11 && crudo.startsWith('1')) {
    return { lada: '+1', telefono: crudo.slice(1) }
  }

  // Default: México, y si venía con "52" adelante de un número de 12, lo quita
  if (crudo.length === 12 && crudo.startsWith('52')) {
    return { lada: '+52', telefono: crudo.slice(2) }
  }

  return { lada: '+52', telefono: crudo }
}

export default function ImportarExcel({ boda, onTerminado, onCancelar }) {
  const [paso, setPaso] = useState('subir') // subir | mapear | revisar | importando | listo
  const [headers, setHeaders] = useState([])
  const [filasCrudas, setFilasCrudas] = useState([])
  const [mapeo, setMapeo] = useState({ nombre: '', telefono: '', pases: '', lada: '' })
  const [filasPreview, setFilasPreview] = useState([])
  const [progreso, setProgreso] = useState(0)
  const [error, setError] = useState(null)

  function manejarArchivo(e) {
    const archivo = e.target.files[0]
    if (!archivo) return
    setError(null)

    const lector = new FileReader()
    lector.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' })
        const hoja = wb.Sheets[wb.SheetNames[0]]
        const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' })
        if (filas.length === 0) {
          setError('El archivo no tiene datos.')
          return
        }
        const cabeceras = Object.keys(filas[0])
        setHeaders(cabeceras)
        setFilasCrudas(filas)
        setMapeo({
          nombre: adivinarColumna(cabeceras, 'nombre'),
          telefono: adivinarColumna(cabeceras, 'telefono'),
          pases: adivinarColumna(cabeceras, 'pases'),
          lada: adivinarColumna(cabeceras, 'lada'),
        })
        setPaso('mapear')
      } catch (err) {
        setError('No se pudo leer el archivo. Confirma que sea un Excel (.xlsx) válido.')
      }
    }
    lector.readAsBinaryString(archivo)
  }

  function generarPreview() {
    if (!mapeo.nombre || !mapeo.telefono || !mapeo.pases) {
      setError('Selecciona al menos las columnas de Nombre, Teléfono y Pases.')
      return
    }
    setError(null)

    const filas = filasCrudas.map(fila => {
      const nombre = String(fila[mapeo.nombre] || '').trim()
      const pasesRaw = fila[mapeo.pases]
      const pases = Math.max(1, parseInt(pasesRaw, 10) || 1)
      const { lada, telefono } = detectarLadaYTelefono(
        fila[mapeo.telefono],
        mapeo.lada ? fila[mapeo.lada] : null
      )
      return { nombre, lada, telefono, pases }
    }).filter(f => f.nombre)

    setFilasPreview(filas)
    setPaso('revisar')
  }

  function actualizarFila(i, campo, valor) {
    const copia = [...filasPreview]
    copia[i] = { ...copia[i], [campo]: valor }
    setFilasPreview(copia)
  }

  function quitarFila(i) {
    setFilasPreview(filasPreview.filter((_, idx) => idx !== i))
  }

  async function confirmarImportacion() {
    setPaso('importando')
    setProgreso(0)
    const invitadosRef = collection(db, 'bodas', boda.id, 'invitados')

    for (let i = 0; i < filasPreview.length; i++) {
      const f = filasPreview[i]
      await addDoc(invitadosRef, {
        nombre_familia: f.nombre,
        telefono: f.telefono,
        lada: f.lada,
        pases_asignados: Number(f.pases),
        pases_confirmados: null,
        estado_rsvp: 'pendiente',
        creado_en: new Date(),
        actualizado_en: new Date(),
      })
      setProgreso(i + 1)
    }

    setPaso('listo')
  }

  return (
    <div style={{
      background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
      borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem',
    }}>

      {paso === 'subir' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
            Sube un archivo Excel (.xlsx) con columnas de nombre, teléfono y pases.
          </p>
          <input type="file" accept=".xlsx,.xls" onChange={manejarArchivo} style={{ fontSize: 13 }} />
          {error && <p style={{ fontSize: 13, color: 'var(--color-coral-text)', marginTop: 10 }}>{error}</p>}
          <div style={{ marginTop: 14 }}>
            <button onClick={onCancelar} style={botonSecundario}>Cancelar</button>
          </div>
        </div>
      )}

      {paso === 'mapear' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Confirma qué columna de tu Excel corresponde a cada dato:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <SelectorColumna label="Nombre *" valor={mapeo.nombre} headers={headers} onChange={v => setMapeo({ ...mapeo, nombre: v })} />
            <SelectorColumna label="Teléfono *" valor={mapeo.telefono} headers={headers} onChange={v => setMapeo({ ...mapeo, telefono: v })} />
            <SelectorColumna label="Pases en total *" valor={mapeo.pases} headers={headers} onChange={v => setMapeo({ ...mapeo, pases: v })} />
            <SelectorColumna label="Lada (opcional)" valor={mapeo.lada} headers={headers} onChange={v => setMapeo({ ...mapeo, lada: v })} permitirVacio />
          </div>
          {error && <p style={{ fontSize: 13, color: 'var(--color-coral-text)', marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={generarPreview} style={botonPrimario}>Ver vista previa</button>
            <button onClick={onCancelar} style={botonSecundario}>Cancelar</button>
          </div>
        </div>
      )}

      {paso === 'revisar' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Revisa antes de confirmar — {filasPreview.length} invitados se van a crear. Corrige lo que haga falta.
          </p>
          <div style={{ maxHeight: 360, overflowY: 'auto', border: '0.5px solid var(--color-border)', borderRadius: 8 }}>
            {filasPreview.map((f, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.7fr auto', gap: 6,
                padding: '8px 10px', borderBottom: i < filasPreview.length - 1 ? '0.5px solid var(--color-border)' : 'none',
                alignItems: 'center',
              }}>
                <input value={f.nombre} onChange={e => actualizarFila(i, 'nombre', e.target.value)} style={campoChico} />
                <select value={f.lada} onChange={e => actualizarFila(i, 'lada', e.target.value)} style={campoChico}>
                  {LADAS.map(l => <option key={l.codigo} value={l.codigo}>{l.codigo}</option>)}
                </select>
                <input value={f.telefono} onChange={e => actualizarFila(i, 'telefono', e.target.value)} style={campoChico} />
                <input type="number" min="1" value={f.pases} onChange={e => actualizarFila(i, 'pases', e.target.value)} style={campoChico} />
                <button onClick={() => quitarFila(i)} style={{ background: 'none', border: 'none', color: 'var(--color-coral-text)', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={confirmarImportacion} style={botonPrimario}>
              Importar {filasPreview.length} invitados
            </button>
            <button onClick={onCancelar} style={botonSecundario}>Cancelar</button>
          </div>
        </div>
      )}

      {paso === 'importando' && (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Importando… {progreso}/{filasPreview.length}
        </p>
      )}

      {paso === 'listo' && (
        <div>
          <p style={{ fontSize: 14, color: 'var(--color-sage-text)', marginBottom: 12 }}>
            ✓ Se importaron {filasPreview.length} invitados correctamente.
          </p>
          <button onClick={onTerminado} style={botonPrimario}>Listo</button>
        </div>
      )}
    </div>
  )
}

function SelectorColumna({ label, valor, headers, onChange, permitirVacio }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
      <select value={valor} onChange={e => onChange(e.target.value)} style={campoChico}>
        {permitirVacio && <option value="">— Ninguna —</option>}
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  )
}

const campoChico = {
  width: '100%', padding: '6px 8px', border: '0.5px solid var(--color-border)',
  borderRadius: 6, fontSize: 12.5, fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
}
const botonPrimario = {
  background: 'var(--color-sage)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13,
}
const botonSecundario = {
  background: 'transparent', border: '0.5px solid var(--color-border)', borderRadius: 8,
  padding: '8px 16px', fontSize: 13, color: 'var(--color-text-secondary)',
}
