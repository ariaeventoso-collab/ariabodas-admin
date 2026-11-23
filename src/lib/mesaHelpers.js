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
  const lugaresQueOcupa = lugaresDeInvitado(invitado)

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
 * Copia a la mesa los datos actuales de un invitado (lugares y/o nombre)
 * en cualquier mesa donde esté sentado, sin moverlo de lugar.
 * cambios: { lugares_ocupados?: number, nombre_familia?: string }
 */
export async function sincronizarInvitadoEnMesas(bodaId, invitadoId, cambios) {
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
        a.invitado_id === invitadoId ? { ...a, ...cambios } : a
      )
      tx.update(mesaRef, { asignaciones: nuevas })
    })
  }
}

/**
 * Cuántos lugares debe ocupar un invitado en su mesa: lo que confirmó,
 * o si sigue pendiente, los pases que tiene asignados.
 */
export function lugaresDeInvitado(invitado) {
  return invitado.pases_confirmados ?? invitado.pases_asignados ?? 1
}

/**
 * Revisa todas las mesas y corrige las que tengan lugares o nombres
 * distintos a los del invitado (por ejemplo, cambios hechos antes de que
 * existiera la sincronización). Devuelve las mesas ya corregidas.
 */
export async function corregirMesasDesactualizadas(bodaId, mesas, invitados) {
  const porId = Object.fromEntries(invitados.map(i => [i.id, i]))
  const resultado = []

  for (const mesa of mesas) {
    const asignaciones = mesa.asignaciones || []
    const hayDiferencias = asignaciones.some(a => {
      const inv = porId[a.invitado_id]
      return inv && (a.lugares_ocupados !== lugaresDeInvitado(inv) || a.nombre_familia !== inv.nombre_familia)
    })
    if (!hayDiferencias) {
      resultado.push(mesa)
      continue
    }

    const mesaRef = doc(db, 'bodas', bodaId, 'mesas', mesa.id)
    const nuevas = await runTransaction(db, async (tx) => {
      const snap = await tx.get(mesaRef)
      if (!snap.exists()) return asignaciones
      const actuales = (snap.data().asignaciones || []).map(a => {
        const inv = porId[a.invitado_id]
        if (!inv) return a
        return { ...a, lugares_ocupados: lugaresDeInvitado(inv), nombre_familia: inv.nombre_familia }
      })
      tx.update(mesaRef, { asignaciones: actuales })
      return actuales
    })
    resultado.push({ ...mesa, asignaciones: nuevas })
  }
  return resultado
}

/**
 * Cambia a un invitado de una mesa a otra en UNA sola transacción:
 * o se hacen los dos pasos (sacarlo de la mesa vieja y meterlo en la
 * nueva) o no se hace ninguno, para que nunca quede en dos mesas ni en
 * ninguna. Igual que asignarInvitadoAMesa, avisa si excede capacidad
 * antes de escribir; el caller vuelve a llamar con forzar=true.
 */
export async function moverInvitadoDeMesa(bodaId, mesaOrigenId, mesaDestinoId, invitadoId, forzar = false) {
  const origenRef = doc(db, 'bodas', bodaId, 'mesas', mesaOrigenId)
  const destinoRef = doc(db, 'bodas', bodaId, 'mesas', mesaDestinoId)

  return runTransaction(db, async (tx) => {
    const origenSnap = await tx.get(origenRef)
    const destinoSnap = await tx.get(destinoRef)
    if (!origenSnap.exists() || !destinoSnap.exists()) return { ok: false, motivo: 'mesa_no_existe' }

    const origen = origenSnap.data().asignaciones || []
    const destino = destinoSnap.data().asignaciones || []
    const asignacion = origen.find(a => a.invitado_id === invitadoId)
    if (!asignacion) return { ok: false, motivo: 'ya_no_esta' }
    if (destino.some(a => a.invitado_id === invitadoId)) return { ok: false, motivo: 'ya_asignado' }

    const capacidad = destinoSnap.data().capacidad
    const ocupados = destino.reduce((acc, a) => acc + (a.lugares_ocupados || 0), 0)
    if (ocupados + (asignacion.lugares_ocupados || 0) > capacidad && !forzar) {
      return { ok: false, motivo: 'excede_capacidad', ocupados, capacidad }
    }

    tx.update(origenRef, { asignaciones: origen.filter(a => a.invitado_id !== invitadoId) })
    tx.update(destinoRef, { asignaciones: [...destino, asignacion] })
    return { ok: true }
  })
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
