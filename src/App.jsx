import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './lib/firebaseClient'
import AdminPanel from './components/AdminPanel'
import Login from './components/Login'

export default function App() {
  const [usuario, setUsuario] = useState(undefined) // undefined = verificando, null = sin sesión

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, (u) => setUsuario(u))
    return () => desuscribir()
  }, [])

  if (usuario === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Cargando…</p>
      </div>
    )
  }

  if (!usuario) {
    return <Login onLoginExitoso={() => {}} />
  }

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
