import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { A11yProvider } from './context/A11yContext'
import { AppLayout } from './components/AppLayout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Perfil from './pages/Perfil'
import Consultas from './pages/Consultas'
import Medicamentos from './pages/Medicamentos'
import Carteirinha from './pages/Carteirinha'
import CarteirinhaPublica from './pages/CarteirinhaPublica'

// HashRouter (#/rota): funciona em qualquer hospedagem estática (Vercel, GitHub Pages) sem configurar rewrites.
export default function App() {
  return (
    <A11yProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/c/:token" element={<CarteirinhaPublica />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/consultas" element={<Consultas />} />
            <Route path="/medicamentos" element={<Medicamentos />} />
            <Route path="/carteirinha" element={<Carteirinha />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </A11yProvider>
  )
}
