import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, Droplet, Phone, Accessibility, Pill, HeartPulse, ShieldCheck, ShieldOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { api } from '../services/api'
import type { CarteirinhaPublica as TPublica } from '../types'
import { BotaoOuvir, Carregando } from '../components/ui'
import { Logo } from '../components/Logo'
import { A11yToolbar } from '../components/A11yToolbar'

function Bloco({ icone, titulo, children, destaque }: { icone: ReactNode; titulo: string; children: ReactNode; destaque?: boolean }) {
  return (
    <section className={`card rounded-2xl border-2 p-5 ${destaque ? 'border-danger/50 bg-danger/5' : 'border-line bg-card'}`}>
      <h2 className={`flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider ${destaque ? 'text-danger' : 'text-muted'}`}>
        {icone} {titulo}
      </h2>
      <div className="mt-2 text-xl font-bold text-ink">{children}</div>
    </section>
  )
}

/** Página aberta ao escanear o QR Code: só as informações autorizadas, em letras grandes. */
export default function CarteirinhaPublica() {
  const { token = '' } = useParams()
  const [dados, setDados] = useState<TPublica | null>()

  useEffect(() => {
    document.title = 'Informações essenciais — Saúde Fácil'
    api.getCarteirinhaPublica(token).then(setDados)
  }, [token])

  const topo = (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-4">
        <Logo />
        <A11yToolbar />
      </div>
    </header>
  )

  if (dados === undefined) return <>{topo}<Carregando /></>

  if (dados === null)
    return (
      <div className="min-h-dvh bg-page">
        {topo}
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <ShieldOff size={56} className="mx-auto text-muted" aria-hidden />
          <h1 className="mt-4 text-3xl font-extrabold text-ink">Informações indisponíveis</h1>
          <p className="mt-3 text-lg text-muted">
            Este QR Code foi revogado pelo titular ou não é mais válido. Em caso de emergência, ligue <a href="tel:192" className="font-extrabold text-danger underline">192 (SAMU)</a>.
          </p>
          <Link to="/" className="mt-8 inline-block font-bold text-brand underline">Conhecer o Saúde Fácil</Link>
        </main>
      </div>
    )

  const d = dados
  const falado = [
    `Informações essenciais de ${d.nome}${d.idade ? `, ${d.idade} anos` : ''}.`,
    d.alergias && `Atenção, alergias: ${d.alergias}.`,
    d.tipoSanguineo && `Tipo sanguíneo ${d.tipoSanguineo}.`,
    d.condicoes && `Condições de saúde: ${d.condicoes}.`,
    d.necessidadesAcessibilidade && `Acessibilidade: ${d.necessidadesAcessibilidade}.`,
    d.medicamentos?.length && `Medicamentos em uso: ${d.medicamentos.map((m) => m.nome).join(', ')}.`,
    d.contatoEmergencia && `Contato de emergência: ${d.contatoEmergencia.nome}, telefone ${d.contatoEmergencia.telefone}.`,
  ].filter(Boolean).join(' ')

  return (
    <div className="min-h-dvh bg-page">
      {topo}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-soft px-4 py-1.5 font-bold text-brand-strong">
          <HeartPulse size={18} aria-hidden /> Informações essenciais de saúde
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink">{d.nome}</h1>
        {d.idade !== undefined && <p className="mt-1 text-2xl font-bold text-muted">{d.idade} anos</p>}
        <div className="mt-4"><BotaoOuvir texto={falado} rotulo="Ouvir informações" /></div>

        <div className="mt-6 flex flex-col gap-4">
          {d.alergias && <Bloco destaque icone={<AlertTriangle size={18} aria-hidden />} titulo="Alergias">{d.alergias}</Bloco>}
          <div className="grid gap-4 sm:grid-cols-2">
            {d.tipoSanguineo && <Bloco icone={<Droplet size={18} aria-hidden />} titulo="Tipo sanguíneo"><span className="text-4xl font-extrabold">{d.tipoSanguineo}</span></Bloco>}
            {d.condicoes && <Bloco icone={<HeartPulse size={18} aria-hidden />} titulo="Condições de saúde">{d.condicoes}</Bloco>}
          </div>
          {d.necessidadesAcessibilidade && <Bloco icone={<Accessibility size={18} aria-hidden />} titulo="Acessibilidade">{d.necessidadesAcessibilidade}</Bloco>}
          {d.medicamentos && d.medicamentos.length > 0 && (
            <Bloco icone={<Pill size={18} aria-hidden />} titulo="Medicamentos em uso">
              <ul className="flex flex-col gap-1">
                {d.medicamentos.map((m) => <li key={m.nome}>{m.nome} <span className="font-semibold text-muted">— {m.dosagem}</span></li>)}
              </ul>
            </Bloco>
          )}
          {d.contatoEmergencia && (
            <Bloco icone={<Phone size={18} aria-hidden />} titulo="Contato de emergência">
              <p>{d.contatoEmergencia.nome}</p>
              <a href={`tel:${d.contatoEmergencia.telefone.replace(/\D/g, '')}`} className="mt-3 inline-flex min-h-14 items-center gap-2 rounded-xl bg-brand px-6 text-lg font-extrabold text-white hover:bg-brand-strong">
                <Phone size={20} aria-hidden /> Ligar {d.contatoEmergencia.telefone}
              </a>
            </Bloco>
          )}
        </div>

        <p className="mt-8 flex items-start gap-2 text-muted">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />
          Informações compartilhadas com autorização do titular, que pode revogar este acesso a qualquer momento. Atualizado em {new Date(d.atualizadaEm).toLocaleDateString('pt-BR')}.
        </p>
      </main>
    </div>
  )
}
