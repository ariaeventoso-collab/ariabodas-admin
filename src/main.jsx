import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminApp from './App.jsx'
import PublicInvitation from './components/PublicInvitation.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/i/:slug" element={<PublicInvitation />} />
        <Route path="/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
