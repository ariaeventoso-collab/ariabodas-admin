import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminApp from './App.jsx'
import './index.css'

// La invitación pública se carga "de forma diferida" (lazy) a propósito:
// usa Tailwind CSS (para las plantillas visuales tipo Lovable), y cargarlo
// solo cuando alguien visita /i/algo evita que esos estilos choquen con
// el panel admin, que usa su propio sistema de estilos.
const PublicInvitation = lazy(() => import('./components/PublicInvitation.jsx'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/i/:slug"
          element={
            <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
              <PublicInvitation />
            </Suspense>
          }
        />
        <Route path="/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
