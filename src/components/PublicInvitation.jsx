import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { plantillas, plantillaPorDefecto } from './plantillas'

// Este componente NO dibuja la invitación directamente - solo carga los
// datos de la boda y decide qué plantilla visual usar según boda.plantilla_id.
// El diseño real vive en /plantillas/PlantillaX.jsx
export default function PublicInvitation() {
  const { slug } = useParams()
  const [boda, setBoda] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

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

  return <Plantilla boda={boda} />
}

function PantallaCentrada({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      {children}
    </div>
  )
}
