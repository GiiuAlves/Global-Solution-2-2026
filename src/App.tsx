import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { A11yProvider } from './context/A11yContext'
import { AuthProvider } from './context/AuthContext'
import { ConfirmProvider } from './components/ConfirmDialog'
import { AppLayout } from './components/AppLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import CadastroProfissional from './pages/CadastroProfissional'
import LeituraQr from './pages/LeituraQr'
import Painel from './pages/paciente/Painel'
import Consultas from './pages/paciente/Consultas'
import Remedios from './pages/paciente/Remedios'
import Carteirinha from './pages/paciente/Carteirinha'
import MeusDados from './pages/paciente/MeusDados'
import PainelPro from './pages/pro/PainelPro'
import NovoPaciente from './pages/pro/NovoPaciente'
import FichaPaciente from './pages/pro/FichaPaciente'

// HashRouter (#/rota): funciona em qualquer hospedagem estática (Vercel, GitHub Pages) sem configurar rewrites.
export default function App() {
  return (
    <A11yProvider>
      <AuthProvider>
        <ConfirmProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/entrar" element={<Login />} />
              <Route path="/cadastro" element={<CadastroProfissional />} />
              <Route path="/c/:token" element={<LeituraQr />} />

              {/* Paciente: só visualiza (e confirma doses) */}
              <Route element={<AppLayout perfil="PACIENTE" />}>
                <Route path="/painel" element={<Painel />} />
                <Route path="/consultas" element={<Consultas />} />
                <Route path="/remedios" element={<Remedios />} />
                <Route path="/carteirinha" element={<Carteirinha />} />
                <Route path="/perfil" element={<MeusDados />} />
              </Route>

              {/* Profissional: cadastra, prescreve e edita */}
              <Route element={<AppLayout perfil="PROFISSIONAL" />}>
                <Route path="/pro" element={<PainelPro />} />
                <Route path="/pro/novo" element={<NovoPaciente />} />
                <Route path="/pro/paciente/:id" element={<FichaPaciente />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </ConfirmProvider>
      </AuthProvider>
    </A11yProvider>
  )
}
