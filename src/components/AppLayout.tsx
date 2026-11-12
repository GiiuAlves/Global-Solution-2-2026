import { NavLink, Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { LayoutDashboard, CalendarDays, Pill, IdCard, UserRound, Info, LogOut, Users, UserPlus, Stethoscope } from 'lucide-react'
import { Logo } from './Logo'
import { A11yToolbar } from './A11yToolbar'
import { MODO_DEMO, SessaoExpirada, api } from '../services/api'
import { useA11y } from '../context/A11yContext'
import { inicioDoPerfil, useAuth } from '../context/AuthContext'
import type { Perfil } from '../types'

const LINKS: Record<Perfil, { to: string; rotulo: string; icone: typeof LayoutDashboard; fim?: boolean }[]> = {
  PACIENTE: [
    { to: '/painel', rotulo: 'Início', icone: LayoutDashboard },
    { to: '/consultas', rotulo: 'Consultas', icone: CalendarDays },
    { to: '/remedios', rotulo: 'Remédios', icone: Pill },
    { to: '/carteirinha', rotulo: 'Carteirinha', icone: IdCard },
    { to: '/perfil', rotulo: 'Meus dados', icone: UserRound },
  ],
  PROFISSIONAL: [
    { to: '/pro', rotulo: 'Pacientes', icone: Users, fim: true },
    { to: '/pro/novo', rotulo: 'Cadastrar paciente', icone: UserPlus },
  ],
}

/** Moldura das áreas logadas. Bloqueia quem não tem o perfil certo. */
export function AppLayout({ perfil }: { perfil: Perfil }) {
  const { pathname } = useLocation()
  const { pararFala } = useA11y()
  const { sessao, sair } = useAuth()
  const navegar = useNavigate()

  // Ao trocar de página: volta ao topo, para a leitura e leva o foco ao conteúdo (leitores de tela).
  useEffect(() => {
    window.scrollTo(0, 0)
    pararFala()
    document.getElementById('conteudo')?.focus({ preventScroll: true })
  }, [pathname, pararFala])

  // Confere se a sessão salva ainda vale (conta apagada ou token expirado no back-end).
  useEffect(() => {
    if (sessao) api.validarSessao().catch((e) => e instanceof SessaoExpirada && sair())
  }, [sessao?.usuario.id, sair]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!sessao) return <Navigate to="/entrar" replace state={{ de: pathname, perfil }} />
  if (sessao.perfil !== perfil) return <Navigate to={inicioDoPerfil(sessao.perfil)} replace />

  const links = LINKS[perfil]
  const nome = sessao.usuario.nome
  const fazerLogout = () => {
    sair()
    navegar('/entrar', { replace: true })
  }

  return (
    <div className="min-h-dvh">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
        Pular para o conteúdo
      </a>

      <header className="no-print sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/" aria-label="Saúde Fácil — página inicial" className="flex items-center gap-3">
            <span className="sm:hidden"><Logo compacto /></span>
            <span className="hidden sm:inline"><Logo /></span>
            {perfil === 'PROFISSIONAL' && (
              <span className="hidden items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white md:inline-flex">
                <Stethoscope size={14} aria-hidden /> Profissional
              </span>
            )}
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <A11yToolbar />
            <span className="hidden h-8 w-px bg-line md:block" aria-hidden />
            <span className="hidden max-w-48 truncate font-bold text-ink md:block">
              {perfil === 'PROFISSIONAL' ? nome : nome.split(' ')[0]}
            </span>
            <button
              type="button"
              onClick={fazerLogout}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border-2 border-line bg-card px-3 font-extrabold text-ink hover:border-brand"
            >
              <LogOut size={18} aria-hidden />
              <span className="sr-only sm:not-sr-only">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4">
        <nav aria-label="Menu principal" className="no-print sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 flex-col py-6 lg:flex">
          <ul className="flex flex-col gap-1.5">
            {links.map(({ to, rotulo, icone: Icone, fim }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={fim}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center gap-3 rounded-xl px-4 text-lg font-bold transition-colors ${isActive ? 'bg-brand text-white' : 'text-ink hover:bg-soft'}`
                  }
                >
                  <Icone size={22} aria-hidden />
                  {rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
          {MODO_DEMO && (
            <p className="mt-auto flex gap-2 rounded-xl bg-warn-soft p-3 text-sm text-warn">
              <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
              Modo demonstração: dados fictícios salvos só neste navegador.
            </p>
          )}
        </nav>

        <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1 py-6 pb-28 outline-none lg:py-8 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Navegação inferior no celular: botões grandes, fáceis de tocar */}
      <nav aria-label="Menu principal" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card lg:hidden">
        <ul className={`mx-auto grid max-w-lg ${links.length === 5 ? 'grid-cols-5' : 'grid-cols-2'}`}>
          {links.map(({ to, rotulo, icone: Icone, fim }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={fim}
                className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold ${isActive ? 'text-brand' : 'text-muted'}`}
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive ? 'bg-soft' : ''}`}>
                      <Icone size={22} aria-hidden />
                    </span>
                    {rotulo}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
