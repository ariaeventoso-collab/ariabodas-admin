import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { plantillas, plantillaPorDefecto } from './plantillas'

// Este componente NO dibuja la invitación directamente - solo carga los
// datos de la boda y decide qué plantilla visual usar según boda.plantilla_id.
// El diseño real vive en /plantillas/PlantillaX.jsx
export default function PublicInvitation() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const [boda, setBoda] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Modo preview: usado desde el landing (ariabodas.com) para mostrar
  // ejemplos de invitaciones reales sin exponer datos sensibles (ubicación
  // exacta, mapa, o permitir que cualquiera confirme asistencia como si
  // fuera un invitado real). Se activa con ?preview=true en la URL.
  const modoPreview = searchParams.get('preview') === 'true'

  useEffect(() => {
    cargarBoda()
  }, [slug])

  async function cargarBoda() {
    setCargando(true)
    try {
      const q = query(collection(db, 'bodas'), where('slug', '==', slug))
      const snap = await getDocs(q)
      if (snap.empty) {
        setError('No encontramos esta invitación.')
      } else {
        setBoda({ id: snap.docs[0].id, ...snap.docs[0].data() })
      }
    } catch (e) {
      setError('Ocurrió un problema al cargar la invitación.')
    }
    setCargando(false)
  }

  if (cargando) {
    return <PantallaCentrada><p style={{ color: '#999', fontSize: 14 }}>Cargando…</p></PantallaCentrada>
  }

  if (error || !boda) {
    return <PantallaCentrada><p style={{ color: '#a33', fontSize: 14 }}>{error}</p></PantallaCentrada>
  }

  const idPlantilla = boda.plantilla_id || plantillaPorDefecto
  const Plantilla = plantillas[idPlantilla] || plantillas[plantillaPorDefecto]

  // IMPORTANTE: pasar modoPreview a la plantilla no es suficiente por sí
  // solo — cada PlantillaX.jsx debe revisar este flag para:
  // 1. Ocultar o reemplazar links de mapa/ubicación (Google Maps, Waze, etc.)
  // 2. Deshabilitar el envío real del formulario de RSVP
  // 3. Mostrar un aviso tipo "Esta es una vista de muestra"
  // Sin ese trabajo en la plantilla, este flag no bloquea nada por sí mismo.
  return <Plantilla boda={boda} modoPreview={modoPreview} />
}

function PantallaCentrada({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      {children}
    </div>
  )
}
