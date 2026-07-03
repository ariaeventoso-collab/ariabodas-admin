const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

initializeApp()
const db = getFirestore()
const authAdmin = getAuth()

// Función auxiliar: confirma que quien llama es admin, revisando su
// propio documento en la colección usuarios (con permisos de servidor,
// que sí pueden leer aunque las reglas normales lo bloqueen al público)
async function verificarEsAdmin(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }
  const perfilDoc = await db.collection('usuarios').doc(request.auth.uid).get()
  if (!perfilDoc.exists || perfilDoc.data().rol !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador puede hacer esto.')
  }
}

// ============================================
// FUNCIÓN: crearAcceso
// Crea un usuario nuevo (novios o wedding_planner) para una boda,
// sin cerrar la sesión del admin que lo está creando.
// ============================================
exports.crearAcceso = onCall(async (request) => {
  await verificarEsAdmin(request)

  const { email, password, nombre, rol, bodaId } = request.data

  if (!email || !password || !nombre || !rol || !bodaId) {
    throw new HttpsError('invalid-argument', 'Faltan datos para crear el acceso.')
  }
  if (!['novios', 'wedding_planner'].includes(rol)) {
    throw new HttpsError('invalid-argument', 'Rol inválido.')
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.')
  }

  // 1. Crear el usuario en Firebase Authentication
  const nuevoUsuario = await authAdmin.createUser({ email, password, displayName: nombre })

  // 2. Crear su perfil en Firestore, con el mismo UID como ID de documento
  await db.collection('usuarios').doc(nuevoUsuario.uid).set({
    email,
    nombre,
    rol,
    boda_id: bodaId,
  })

  return { ok: true, uid: nuevoUsuario.uid }
})

// ============================================
// FUNCIÓN: eliminarAcceso
// Elimina un usuario (novios/planner) tanto de Authentication como
// de su perfil en Firestore.
// ============================================
exports.eliminarAcceso = onCall(async (request) => {
  await verificarEsAdmin(request)

  const { uid } = request.data
  if (!uid) {
    throw new HttpsError('invalid-argument', 'Falta el identificador del usuario.')
  }

  await authAdmin.deleteUser(uid)
  await db.collection('usuarios').doc(uid).delete()

  return { ok: true }
})

// ============================================
// FUNCIÓN 1: buscarInvitado
// El invitado escribe su nombre y el slug de la boda (que va en el link).
// Busca coincidencias SOLO dentro de esa boda y devuelve nombre,
// pases asignados y estado - nada de teléfono ni datos sensibles.
// ============================================
exports.buscarInvitado = onCall(async (request) => {
  const { bodaSlug, nombreBusqueda } = request.data

  if (!bodaSlug || !nombreBusqueda) {
    throw new HttpsError('invalid-argument', 'Falta el nombre de la boda o el nombre a buscar.')
  }

  // 1. Encontrar la boda por su slug
  const bodasSnap = await db.collection('bodas').where('slug', '==', bodaSlug).limit(1).get()
  if (bodasSnap.empty) {
    throw new HttpsError('not-found', 'No se encontró esa boda.')
  }
  const bodaId = bodasSnap.docs[0].id

  // 2. Buscar invitados de esa boda cuyo nombre contenga el texto buscado
  //    (Firestore no tiene "contiene texto" nativo simple, así que
  //    traemos todos los invitados de la boda y filtramos en memoria -
  //    funciona bien para el tamaño de listas de una boda, hasta ~500)
  const invitadosSnap = await db.collection('bodas').doc(bodaId).collection('invitados').get()

  const coincidencias = invitadosSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(inv => inv.nombre_familia.toLowerCase().includes(nombreBusqueda.toLowerCase()))
    .map(inv => ({
      invitado_id: inv.id,
      nombre_familia: inv.nombre_familia,
      pases_asignados: inv.pases_asignados,
      estado_rsvp: inv.estado_rsvp,
    }))

  return { resultados: coincidencias }
})

// ============================================
// FUNCIÓN 2: confirmarRSVP
// El invitado ya encontró su nombre (tiene su invitado_id) y confirma
// cuántos van, o marca "no voy". Valida que no exceda su tope.
// ============================================
exports.confirmarRSVP = onCall(async (request) => {
  const { bodaSlug, invitadoId, pasesConfirmados, mensaje } = request.data

  if (!bodaSlug || !invitadoId || pasesConfirmados === undefined) {
    throw new HttpsError('invalid-argument', 'Faltan datos para confirmar.')
  }

  const bodasSnap = await db.collection('bodas').where('slug', '==', bodaSlug).limit(1).get()
  if (bodasSnap.empty) {
    throw new HttpsError('not-found', 'No se encontró esa boda.')
  }
  const bodaId = bodasSnap.docs[0].id

  const invitadoRef = db.collection('bodas').doc(bodaId).collection('invitados').doc(invitadoId)
  const invitadoDoc = await invitadoRef.get()

  if (!invitadoDoc.exists) {
    throw new HttpsError('not-found', 'Invitado no encontrado.')
  }

  const tope = invitadoDoc.data().pases_asignados

  // Regla clave: no puede confirmar más de lo asignado
  if (pasesConfirmados > tope) {
    throw new HttpsError('failed-precondition', `No puedes confirmar más de ${tope} pases.`)
  }

  // Actualiza el estado del invitado
  await invitadoRef.update({
    pases_confirmados: pasesConfirmados,
    estado_rsvp: pasesConfirmados === 0 ? 'no_confirmado' : 'confirmado',
    mensaje_novios: mensaje || '',
    actualizado_en: new Date(),
  })

  // REGLA DE MESAS: si este invitado ya estaba en una mesa, lo sacamos
  // automáticamente para forzar que lo vuelvan a acomodar a propósito
  const mesasSnap = await db.collection('bodas').doc(bodaId).collection('mesas').get()
  for (const mesaDoc of mesasSnap.docs) {
    const asignaciones = mesaDoc.data().asignaciones || []
    const tieneAlInvitado = asignaciones.some(a => a.invitado_id === invitadoId)
    if (tieneAlInvitado) {
      const nuevasAsignaciones = asignaciones.filter(a => a.invitado_id !== invitadoId)
      await mesaDoc.ref.update({ asignaciones: nuevasAsignaciones })
    }
  }

  return { ok: true }
})
