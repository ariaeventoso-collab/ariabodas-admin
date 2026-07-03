const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore()

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
  const { bodaSlug, invitadoId, pasesConfirmados } = request.data

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
