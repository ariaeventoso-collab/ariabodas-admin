import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebaseClient'

export default function Login({ onLoginExitoso }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function manejarEnvio(e) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      onLoginExitoso()
    } catch (e) {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.')
    }

    setCargando(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '1.5rem',
    }}>
      <form onSubmit={manejarEnvio} style={{
        background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
        borderRadius: 'var(--radius)', padding: '2rem', width: '100%', maxWidth: 360,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            background: '#1E1E1C', borderRadius: 10, padding: '14px 20px',
            display: 'inline-flex', margin: '0 auto 14px',
          }}>
            <img src="/logo-aria.png" alt="Aria Eventos" style={{ height: 40, width: 'auto', display: 'block' }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Panel administrativo
          </p>
        </div>

        <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Correo</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={campoEstilo}
        />

        <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={campoEstilo}
        />

        {error && (
          <p style={{ fontSize: 13, color: 'var(--color-coral-text)', margin: '0 0 12px' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={cargando}
          style={{
            width: '100%', padding: '10px', background: 'var(--color-sage)', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, marginTop: 4,
          }}
        >
          {cargando ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}

const campoEstilo = {
  width: '100%', padding: '9px 10px', marginTop: 4, marginBottom: 14,
  border: '0.5px solid var(--color-border)', borderRadius: 8, fontSize: 14,
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
}
