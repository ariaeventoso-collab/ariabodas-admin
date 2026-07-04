import { runTransaction, doc, collection, getDocs } from 'firebase/firestore'
import { db } from './firebaseClient'

/**
 * Quita a un invitado de cualquier mesa donde esté asignado, de forma
 * transaccional. Se usa cada vez que un invitado se elimina o cambia
 * su estado de RSVP (para que no quede "fantasma" sentado en una mesa).
 */
export async function quitarInvitadoDeMesas(bodaId, invitadoId) {
  const mesasSnap = await getDocs(collection(db, 'bodas', bodaId, 'mesas'))
  const mesasConEsteInvitado = mesasSnap.docs.filter(mesaDoc =>
    (mesaDoc.data().asignaciones || []).some(a => a.invitado_id === invitadoId)
  )

  for (const mesaDoc of mesasConEsteInvitado) {
    const mesaRef = doc(db, 'bodas', bodaId, 'mesas', mesaDoc.id)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(mesaRef)
      if (!snap.exists()) return
      const asignaciones = snap.data().asignaciones || []
      const nuevas = asignaciones.filter(a => a.invitado_id !== invitadoId)
      if (nuevas.length !== asignaciones.length) {
        tx.update(mesaRef, { asignaciones: nuevas })
      }
    })
  }
}

/**
 * Asigna un invitado a una mesa de forma transaccional, revalidando la
 * capacidad justo antes de escribir (evita que dos "soltar" casi
 * simultáneos excedan el límite sin confirmación, o que un mismo
 * invitado quede asignado a dos mesas por una carrera de datos).
 *
 * Devuelve { ok: true } si se asignó, o { ok: false, motivo } si no.
 * El caller decide qué hacer con exceso de capacidad (confirm) ANTES de
 * volver a llamar a esta función pasando forzar=true.
 */
export async function asignarInvitadoAMesa(bodaId, mesaId, invitado, forzar = false) {
  const mesaRef = doc(db, 'bodas', bodaId, 'mesas', mesaId)
  const lugaresQueOcupa = invitado.pases_confirmados ?? invitado.pases_asignados ?? 1

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(mesaRef)
    if (!snap.exists()) return { ok: false, motivo: 'mesa_no_existe' }

    const data = snap.data()
    const asignaciones = data.asignaciones || []

    // Evita duplicar si ya está asignado a ESTA mesa (doble submit)
    if (asignaciones.some(a => a.invitado_id === invitado.id)) {
      return { ok: false, motivo: 'ya_asignado' }
    }

    const ocupados = asignaciones.reduce((acc, a) => acc + (a.lugares_ocupados || 0), 0)
    const excede = ocupados + lugaresQueOcupa > data.capacidad

    if (excede && !forzar) {
      return { ok: false, motivo: 'excede_capacidad', ocupados, capacidad: data.capacidad }
    }

    tx.update(mesaRef, {
      asignaciones: [
        ...asignaciones,
        {
          invitado_id: invitado.id,
          nombre_familia: invitado.nombre_familia,
          lugares_ocupados: lugaresQueOcupa,
        },
      ],
    })
    return { ok: true }
  })
}

/**
 * Actualiza el número de lugares que ocupa un invitado en la mesa donde
 * esté sentado, sin moverlo ni tocar su asignación. Se usa cuando el admin
 * edita el número de pases de alguien que ya estaba confirmado y sentado
 * — sin esto, la mesa se queda mostrando el número de pases viejo aunque
 * el invitado (en Invitados) ya muestre el número correcto.
 */
export async function actualizarLugaresEnMesas(bodaId, invitadoId, nuevosLugares) {
  const mesasSnap = await getDocs(collection(db, 'bodas', bodaId, 'mesas'))
  const mesasConEsteInvitado = mesasSnap.docs.filter(mesaDoc =>
    (mesaDoc.data().asignaciones || []).some(a => a.invitado_id === invitadoId)
  )

  for (const mesaDoc of mesasConEsteInvitado) {
    const mesaRef = doc(db, 'bodas', bodaId, 'mesas', mesaDoc.id)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(mesaRef)
      if (!snap.exists()) return
      const asignaciones = snap.data().asignaciones || []
      const nuevas = asignaciones.map(a =>
        a.invitado_id === invitadoId ? { ...a, lugares_ocupados: nuevosLugares } : a
      )
      tx.update(mesaRef, { asignaciones: nuevas })
    })
  }
}

/**
 * Quita a un invitado de una mesa específica, transaccional.
 */
export async function quitarDeMesaEspecifica(bodaId, mesaId, invitadoId) {
  const mesaRef = doc(db, 'bodas', bodaId, 'mesas', mesaId)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(mesaRef)
    if (!snap.exists()) return
    const asignaciones = snap.data().asignaciones || []
    tx.update(mesaRef, {
      asignaciones: asignaciones.filter(a => a.invitado_id !== invitadoId),
    })
  })
}
