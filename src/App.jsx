import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './lib/firebaseClient'
import AdminPanel from './components/AdminPanel'
import PanelLimitado from './components/PanelLimitado'
import Login from './components/Login'

export default function AdminApp() {
  const [usuario, setUsuario] = useState(undefined) // undefined = verificando, null = sin sesión
  const [perfilUsuario, setPerfilUsuario] = useState(undefined) // undefined = cargando, null = no encontrado

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, async (u) => {
      setUsuario(u)
      if (u) {
        try {
          const perfilDoc = await getDoc(doc(db, 'usuarios', u.uid))
          setPerfilUsuario(perfilDoc.exists() ? perfilDoc.data() : null)
        } catch (e) {
          setPerfilUsuario(null)
        }
      } else {
        setPerfilUsuario(undefined)
      }
    })
    return () => desuscribir()
  }, [])

  if (usuario === undefined || (usuario && perfilUsuario === undefined)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Cargando…</p>
      </div>
    )
  }

  if (!usuario) {
    return <Login onLoginExitoso={() => {}} />
  }

  if (!perfilUsuario) {
    return (
      <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <p style={{ fontSize: 14, color: 'var(--color-coral-text)' }}>
          Tu cuenta no tiene un perfil configurado. Contacta al administrador.
        </p>
        <button
          onClick={() => signOut(auth)}
          style={{ fontSize: 13, background: 'transparent', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '6px 14px', marginTop: 12 }}
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  if (perfilUsuario.rol === 'admin') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem 0' }}>
          <button
            onClick={() => signOut(auth)}
            style={{
              fontSize: 13, background: 'transparent', border: '0.5px solid var(--color-border)',
              borderRadius: 8, padding: '5px 12px', color: 'var(--color-text-secondary)',
            }}
          >
            Cerrar sesión
          </button>
        </div>
        <AdminPanel />
      </div>
    )
  }

  // rol: novios o wedding_planner
  return <PanelLimitado perfilUsuario={perfilUsuario} />
}
