import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Stethoscope, Pill, QrCode, ShieldCheck } from 'lucide-react'
import { Logo } from './Logo'
import { A11yToolbar } from './A11yToolbar'

/** Moldura das telas Entrar e Criar conta. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
        Pular para o conteúdo
      </a>
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" aria-label="Saúde Fácil — página inicial">
            <span className="sm:hidden"><Logo compacto /></span>
            <span className="hidden sm:inline"><Logo /></span>
          </Link>
          <A11yToolbar />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:py-12">
        <aside className="sticky top-8 hidden flex-col self-start rounded-3xl bg-ink p-10 text-white lg:flex">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
            O profissional cuida da ficha. <span className="text-[#7FE0CF]">O paciente só acompanha.</span>
          </h2>
          <ul className="mt-8 flex flex-col gap-5 text-lg">
            <li className="flex gap-3"><Stethoscope className="mt-0.5 shrink-0 text-[#7FE0CF]" aria-hidden /> Médico ou equipe cadastra o paciente, a prescrição e as consultas</li>
            <li className="flex gap-3"><Pill className="mt-0.5 shrink-0 text-[#7FE0CF]" aria-hidden /> Paciente vê os remédios do dia, aperta "Tomei" e recebe alarmes no celular</li>
            <li className="flex gap-3"><QrCode className="mt-0.5 shrink-0 text-[#7FE0CF]" aria-hidden /> QR Code da carteirinha abre a ficha técnica para o profissional</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#7FE0CF]" aria-hidden /> Toda alteração fica registrada, com nome e registro de quem fez</li>
          </ul>
        </aside>
        <main id="conteudo" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
