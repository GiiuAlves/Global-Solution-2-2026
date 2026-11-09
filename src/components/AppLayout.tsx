import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { LayoutDashboard, CalendarDays, Pill, IdCard, UserRound, Info } from 'lucide-react'
import { Logo } from './Logo'
import { A11yToolbar } from './A11yToolbar'
import { MODO_DEMO } from '../services/api'
import { useA11y } from '../context/A11yContext'

const LINKS = [
  { to: '/dashboard', rotulo: 'Início', icone: LayoutDashboard },
  { to: '/consultas', rotulo: 'Consultas', icone: CalendarDays },
  { to: '/medicamentos', rotulo: 'Remédios', icone: Pill },
  { to: '/carteirinha', rotulo: 'Carteirinha', icone: IdCard },
  { to: '/perfil', rotulo: 'Meu perfil', icone: UserRound },
]

export function AppLayout() {
  const { pathname } = useLocation()
  const { pararFala } = useA11y()

  // Ao trocar de página: volta ao topo, para a leitura e leva o foco ao conteúdo (leitores de tela).
  useEffect(() => {
    window.scrollTo(0, 0)
    pararFala()
    document.getElementById('conteudo')?.focus({ preventScroll: true })
  }, [pathname, pararFala])

  return (
    <div className="min-h-dvh">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
        Pular para o conteúdo
      </a>

      <header className="no-print sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/" aria-label="Saúde Fácil — página inicial">
            <span className="sm:hidden"><Logo compacto /></span>
            <span className="hidden sm:inline"><Logo /></span>
          </Link>
          <A11yToolbar />
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4">
        <nav aria-label="Menu principal" className="no-print sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 flex-col py-6 lg:flex">
          <ul className="flex flex-col gap-1.5">
            {LINKS.map(({ to, rotulo, icone: Icone }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center gap-3 rounded-xl px-4 text-lg font-bold transition-colors ${
                      isActive ? 'bg-brand text-white' : 'text-ink hover:bg-soft'
                    }`
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
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {LINKS.map(({ to, rotulo, icone: Icone }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold ${isActive ? 'text-brand' : 'text-muted'}`
                }
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
