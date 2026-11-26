// xlsx-js-style es la misma librería de Excel (SheetJS) pero permite dar
// formato a las celdas: letra grande, negritas, colores y celdas combinadas.
import * as XLSX from 'xlsx-js-style'

// ============================================
// Exportar listas a Excel (.xlsx)
// Se usa desde Invitados (lista de asistentes) y desde Mesas
// (cada mesa con las familias sentadas en ella).
// ============================================

const ESTADOS = {
  confirmado: 'Confirmado',
  no_confirmado: 'No va',
  pendiente: 'Pendiente',
}

function textoEstado(estado) {
  return ESTADOS[estado] || 'Pendiente'
}

function telefonoCompleto(inv) {
  if (!inv?.telefono) return ''
  return `${inv.lada || ''} ${inv.telefono}`.trim()
}

// Nombre de archivo seguro: "Invitados - Paola y Jorge.xlsx"
function nombreArchivo(prefijo, boda) {
  const pareja = [boda?.nombre_novio_1, boda?.nombre_novio_2].filter(Boolean).join(' y ')
  const base = pareja ? `${prefijo} - ${pareja}` : prefijo
  return `${base.replace(/[\\/:*?"<>|]/g, '')}.xlsx`
}

// Crea una hoja a partir de filas (objetos) y ajusta el ancho de columnas
function crearHoja(filas, encabezados) {
  const hoja = XLSX.utils.json_to_sheet(filas, { header: encabezados })
  hoja['!cols'] = encabezados.map(enc => {
    const largo = Math.max(enc.length, ...filas.map(f => String(f[enc] ?? '').length))
    return { wch: Math.min(60, largo + 2) }
  })
  // Encabezados en negritas
  encabezados.forEach((_, c) => {
    const celda = hoja[XLSX.utils.encode_cell({ r: 0, c })]
    if (celda) celda.s = ESTILO_ENCABEZADO
  })
  return hoja
}

const ESTILO_ENCABEZADO = {
  font: { bold: true, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'EFEFEF' } },
}
const ESTILO_TITULO_MESA = {
  font: { bold: true, sz: 18 },
  fill: { patternType: 'solid', fgColor: { rgb: 'E8EFE9' } },
  alignment: { vertical: 'center' },
}
const ESTILO_TOTAL = { font: { bold: true } }

// Mapa invitado_id -> nombre de la mesa donde está sentado
function mapaMesaPorInvitado(mesas) {
  const mapa = {}
  for (const mesa of mesas || []) {
    for (const a of mesa.asignaciones || []) {
      mapa[a.invitado_id] = mesa.nombre
    }
  }
  return mapa
}

// Mismo orden que en pantalla (el que elegiste moviendo las mesas);
// las que no tienen orden van al final por nombre ("Mesa 2" antes que "Mesa 10")
function ordenarMesas(mesas) {
  return [...(mesas || [])].sort((a, b) => {
    const oa = a.orden ?? Infinity
    const ob = b.orden ?? Infinity
    if (oa !== ob) return oa - ob
    return String(a.nombre).localeCompare(String(b.nombre), 'es', { numeric: true })
  })
}

// ============================================
// INVITADOS / ASISTENTES
// Hoja 1 "Asistentes": solo confirmados (los que sí van)
// Hoja 2 "Todos los invitados": la lista completa con su estado
// ============================================
export function exportarInvitadosExcel(boda, invitados, mesas) {
  const mesaDe = mapaMesaPorInvitado(mesas)
  const encabezados = ['Familia / Invitado', 'Teléfono', 'Pases asignados', 'Pases confirmados', 'Estado', 'Mesa', 'Mensaje para los novios']

  const fila = inv => ({
    'Familia / Invitado': inv.nombre_familia || '',
    'Teléfono': telefonoCompleto(inv),
    'Pases asignados': Number(inv.pases_asignados) || 0,
    'Pases confirmados': inv.pases_confirmados ?? '',
    'Estado': textoEstado(inv.estado_rsvp),
    'Mesa': mesaDe[inv.id] || '',
    'Mensaje para los novios': inv.mensaje_novios || '',
  })

  const confirmados = invitados.filter(i => i.estado_rsvp === 'confirmado')
  const filasAsistentes = confirmados.map(fila)
  filasAsistentes.push({})
  filasAsistentes.push({
    'Familia / Invitado': `TOTAL: ${confirmados.length} familias`,
    'Pases confirmados': confirmados.reduce((s, i) => s + (Number(i.pases_confirmados) || 0), 0),
  })

  const filasTodos = invitados.map(fila)
  filasTodos.push({})
  filasTodos.push({
    'Familia / Invitado': `TOTAL: ${invitados.length} familias`,
    'Pases asignados': invitados.reduce((s, i) => s + (Number(i.pases_asignados) || 0), 0),
    'Pases confirmados': confirmados.reduce((s, i) => s + (Number(i.pases_confirmados) || 0), 0),
  })

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, crearHoja(filasAsistentes, encabezados), 'Asistentes')
  XLSX.utils.book_append_sheet(libro, crearHoja(filasTodos, encabezados), 'Todos los invitados')
  XLSX.writeFile(libro, nombreArchivo('Invitados', boda))
}

// ============================================
// MESAS
// Hoja 1 "Mesas": cada mesa con sus familias debajo (para imprimir)
// Hoja 2 "Resumen": una fila por mesa con capacidad y ocupados
// Hoja 3 "Sin mesa": confirmados que todavía no tienen lugar
// ============================================
export function exportarMesasExcel(boda, mesas, invitados) {
  const invitadoPorId = Object.fromEntries((invitados || []).map(i => [i.id, i]))
  const ordenadas = ordenarMesas(mesas)

  // Hoja "Mesas": cada mesa empieza con un título grande
  // ("MESA 1 · familia paola") y debajo sus invitados como siempre.
  const encDetalle = ['Mesa', 'Familia / Invitado', 'Lugares', 'Teléfono', 'Estado']
  const filas = [encDetalle]
  const filasTitulo = []
  const filasTotal = []
  ordenadas.forEach((mesa, i) => {
    const asignaciones = mesa.asignaciones || []
    const ocupados = asignaciones.reduce((s, a) => s + (a.lugares_ocupados || 0), 0)

    filasTitulo.push(filas.length)
    filas.push([`MESA ${i + 1} · ${mesa.nombre}`, '', '', '', ''])

    if (asignaciones.length === 0) {
      filas.push([mesa.nombre, '(vacía)', 0, '', ''])
    }
    for (const a of asignaciones) {
      const inv = invitadoPorId[a.invitado_id]
      filas.push([
        mesa.nombre,
        a.nombre_familia || inv?.nombre_familia || '',
        a.lugares_ocupados || 0,
        telefonoCompleto(inv),
        textoEstado(inv?.estado_rsvp),
      ])
    }
    filasTotal.push(filas.length)
    filas.push(['', `Total ${mesa.nombre}`, `${ocupados} de ${mesa.capacidad}`, '', ''])
    filas.push(['', '', '', '', ''])
  })

  const hojaMesas = XLSX.utils.aoa_to_sheet(filas)
  // Ancho de columnas (sin contar los títulos, que ocupan toda la fila)
  hojaMesas['!cols'] = encDetalle.map((enc, c) => {
    const largo = Math.max(enc.length, ...filas
      .filter((_, r) => !filasTitulo.includes(r))
      .map(f => String(f[c] ?? '').length))
    return { wch: Math.min(60, largo + 2) }
  })
  // Títulos: celdas combinadas de la columna A a la E, letra grande
  hojaMesas['!merges'] = filasTitulo.map(r => ({ s: { r, c: 0 }, e: { r, c: encDetalle.length - 1 } }))
  hojaMesas['!rows'] = []
  filasTitulo.forEach(r => {
    hojaMesas['!rows'][r] = { hpt: 30 }
    for (let c = 0; c < encDetalle.length; c++) {
      const ref = XLSX.utils.encode_cell({ r, c })
      if (!hojaMesas[ref]) hojaMesas[ref] = { t: 's', v: '' }
      hojaMesas[ref].s = ESTILO_TITULO_MESA
    }
  })
  encDetalle.forEach((_, c) => {
    hojaMesas[XLSX.utils.encode_cell({ r: 0, c })].s = ESTILO_ENCABEZADO
  })
  filasTotal.forEach(r => {
    for (const c of [1, 2]) {
      const celda = hojaMesas[XLSX.utils.encode_cell({ r, c })]
      if (celda) celda.s = ESTILO_TOTAL
    }
  })

  const encResumen = ['Mesa', 'Capacidad', 'Ocupados', 'Lugares libres', 'Familias en la mesa']
  const filasResumen = ordenadas.map(mesa => {
    const asignaciones = mesa.asignaciones || []
    const ocupados = asignaciones.reduce((s, a) => s + (a.lugares_ocupados || 0), 0)
    return {
      'Mesa': mesa.nombre,
      'Capacidad': Number(mesa.capacidad) || 0,
      'Ocupados': ocupados,
      'Lugares libres': (Number(mesa.capacidad) || 0) - ocupados,
      'Familias en la mesa': asignaciones.map(a => `${a.nombre_familia} (${a.lugares_ocupados})`).join(', '),
    }
  })

  const sentados = new Set((mesas || []).flatMap(m => (m.asignaciones || []).map(a => a.invitado_id)))
  const encSinMesa = ['Familia / Invitado', 'Pases confirmados', 'Teléfono']
  const filasSinMesa = (invitados || [])
    .filter(i => i.estado_rsvp === 'confirmado' && !sentados.has(i.id))
    .map(i => ({
      'Familia / Invitado': i.nombre_familia || '',
      'Pases confirmados': i.pases_confirmados ?? i.pases_asignados ?? '',
      'Teléfono': telefonoCompleto(i),
    }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hojaMesas, 'Mesas')
  XLSX.utils.book_append_sheet(libro, crearHoja(filasResumen, encResumen), 'Resumen')
  XLSX.utils.book_append_sheet(libro, crearHoja(filasSinMesa, encSinMesa), 'Sin mesa')
  XLSX.writeFile(libro, nombreArchivo('Mesas', boda))
}
