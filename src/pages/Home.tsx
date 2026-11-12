import { Link } from 'react-router-dom'
import {
  Pill, IdCard, BarChart3, Type, Contrast, Volume2, Keyboard, Hand, AlarmClock,
  QrCode, ShieldCheck, HeartPulse, Scale, ArrowRight, UserRound, Stethoscope,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { A11yToolbar } from '../components/A11yToolbar'
import { HealthCard } from '../components/HealthCard'
import { btnClass } from '../components/ui'
import { inicioDoPerfil, useAuth } from '../context/AuthContext'

const RECURSOS = [
  { icone: Stethoscope, titulo: 'Ficha feita pelo profissional', texto: 'O médico ou a equipe cadastra o paciente, a prescrição e as consultas. Sem risco de dose errada digitada em casa.' },
  { icone: Pill, titulo: '"Tomei" com um toque', texto: 'O paciente vê os remédios do dia e confirma cada dose. Simples para quem tem pouca prática com celular.' },
  { icone: AlarmClock, titulo: 'Alarme e agenda do celular', texto: 'Cada remédio e consulta vai para a agenda do celular, que toca na hora certa.' },
  { icone: BarChart3, titulo: 'Adesão acompanhada', texto: 'O profissional vê quem está esquecendo doses e age antes de o tratamento falhar.' },
]

const ACESSIBILIDADE = [
  { icone: Type, titulo: 'Letras grandes', texto: 'Aumente o texto com um toque.' },
  { icone: Contrast, titulo: 'Alto contraste', texto: 'Cores mais fortes para baixa visão.' },
  { icone: Volume2, titulo: 'Leitura em voz alta', texto: 'Ouça a carteirinha e as consultas.' },
  { icone: Keyboard, titulo: 'Teclado e leitor de tela', texto: 'Navegação completa sem mouse.' },
  { icone: Hand, titulo: 'Botões grandes', texto: 'Fáceis de tocar no celular.' },
]

const PASSOS = [
  { n: 1, titulo: 'O profissional cadastra', texto: 'Dados, contato de emergência, acessibilidade e prescrição. O paciente recebe CPF + senha impressos.' },
  { n: 2, titulo: 'O paciente acompanha', texto: 'Vê remédios e consultas, aperta "Tomei" e recebe alarmes. Não consegue alterar nada por engano.' },
  { n: 3, titulo: 'O QR Code abre a ficha', texto: 'Qualquer pessoa vê o resumo de emergência. Um profissional logado vê a ficha técnica completa.' },
]

export default function Home() {
  const { sessao } = useAuth()
  const inicio = sessao ? inicioDoPerfil(sessao.perfil) : null
  return (
    <div className="min-h-dvh bg-card">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" aria-label="Saúde Fácil — página inicial"><Logo /></Link>
          <nav aria-label="Seções" className="hidden items-center gap-6 font-bold text-ink md:flex">
            <a href="#recursos" className="hover:text-brand">Recursos</a>
            <a href="#acessibilidade" className="hover:text-brand">Acessibilidade</a>
            <a href="#como-funciona" className="hover:text-brand">Como funciona</a>
            <a href="#impacto" className="hover:text-brand">Impacto</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><A11yToolbar /></div>
            <Link to={inicio ?? '/entrar'} className={btnClass('primary', '!min-h-11')}>{inicio ? 'Meu painel' : 'Entrar'}</Link>
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="outline-none">
        {/* HERO */}
        <section className="relative overflow-hidden bg-page">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-soft px-4 py-1.5 font-bold text-brand-strong">
                <HeartPulse size={18} aria-hidden /> Tecnologia para todos
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                Sua saúde organizada, <span className="text-brand">simples e acessível.</span>
              </h1>
              <p className="mt-5 max-w-xl text-xl leading-relaxed text-muted">
                O profissional de saúde cadastra a ficha e a prescrição. O paciente acompanha os remédios do dia, recebe alarmes e leva a carteirinha com QR Code — com letras grandes, alto contraste e leitura em voz alta.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {inicio ? (
                  <Link to={inicio} className={btnClass('primary', '!min-h-14 !px-7 text-lg')}>Ir para meu painel <ArrowRight size={20} aria-hidden /></Link>
                ) : (
                  <>
                    <Link to="/entrar" state={{ perfil: 'PACIENTE' }} className={btnClass('primary', '!min-h-14 !px-7 text-lg')}><UserRound size={20} aria-hidden /> Sou paciente</Link>
                    <Link to="/entrar" state={{ perfil: 'PROFISSIONAL' }} className={btnClass('secondary', '!min-h-14 !px-7 text-lg')}><Stethoscope size={20} aria-hidden /> Sou profissional</Link>
                  </>
                )}
              </div>
              <p className="mt-6 flex items-center gap-2 text-muted">
                <ShieldCheck size={20} className="text-brand" aria-hidden /> Só o profissional edita. Toda alteração fica registrada.
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-md rotate-[-2deg]">
                <HealthCard nome="Maria Aparecida Silva" tipoSanguineo="O+" contato="Ana (filha)" url="https://saudefacil.app/c/demonstracao" />
                <p className="mt-3 rotate-[2deg] text-center text-sm text-muted">Exemplo ilustrativo com dados fictícios.</p>
              </div>
            </div>
          </div>
        </section>

        {/* RECURSOS */}
        <section id="recursos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">Cada um faz a parte que sabe fazer</h2>
          <p className="mt-2 max-w-2xl text-lg text-muted">O profissional cuida da informação técnica. O paciente só precisa seguir e confirmar.</p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RECURSOS.map(({ icone: I, titulo, texto }) => (
              <li key={titulo} className="card rounded-2xl border border-line bg-card p-6">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-soft text-brand" aria-hidden><I size={24} /></span>
                <h3 className="mt-4 text-xl font-extrabold text-ink">{titulo}</h3>
                <p className="mt-2 text-muted">{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ACESSIBILIDADE */}
        <section id="acessibilidade" className="scroll-mt-20 bg-ink text-white">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-3xl font-extrabold tracking-tight">Feito para quem mais precisa</h2>
            <p className="mt-2 max-w-2xl text-lg text-white/80">
              Pensado para idosos, pessoas com baixa visão, cegas, surdas e com pouca familiaridade com tecnologia — seguindo as diretrizes WCAG 2.2.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {ACESSIBILIDADE.map(({ icone: I, titulo, texto }) => (
                <li key={titulo} className="rounded-2xl bg-white/10 p-5">
                  <I size={28} aria-hidden />
                  <h3 className="mt-3 text-lg font-extrabold">{titulo}</h3>
                  <p className="mt-1 text-white/80">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CARTEIRINHA */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-white" aria-hidden><QrCode size={26} /></span>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">Como funciona</h2>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {PASSOS.map((p) => (
              <li key={p.n} className="card relative rounded-2xl border border-line bg-page p-6">
                <span className="text-5xl font-extrabold text-brand/25" aria-hidden>0{p.n}</span>
                <h3 className="mt-2 text-xl font-extrabold text-ink"><span className="sr-only">Passo {p.n}: </span>{p.titulo}</h3>
                <p className="mt-2 text-muted">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* IMPACTO / ODS */}
        <section id="impacto" className="scroll-mt-20 bg-soft">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">Impacto social</h2>
            <p className="mt-2 max-w-2xl text-lg text-muted">O Saúde Fácil contribui com os Objetivos de Desenvolvimento Sustentável da ONU.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <article className="card flex gap-5 rounded-2xl border border-line bg-card p-6">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#4C9F38] text-white" aria-hidden><HeartPulse size={30} /></span>
                <div>
                  <p className="font-extrabold text-brand-strong">ODS 3</p>
                  <h3 className="text-xl font-extrabold text-ink">Saúde e Bem-Estar</h3>
                  <p className="mt-2 text-muted">Ajuda a manter o tratamento em dia e agiliza o atendimento em emergências com informações confiáveis.</p>
                </div>
              </article>
              <article className="card flex gap-5 rounded-2xl border border-line bg-card p-6">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#DD1367] text-white" aria-hidden><Scale size={30} /></span>
                <div>
                  <p className="font-extrabold text-brand-strong">ODS 10</p>
                  <h3 className="text-xl font-extrabold text-ink">Redução das Desigualdades</h3>
                  <p className="mt-2 text-muted">Inclui idosos e pessoas com deficiência no cuidado digital da saúde, com uma interface que se adapta a cada um.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">Pronto para começar?</h2>
          <p className="mx-auto mt-2 max-w-xl text-lg text-muted">Profissional de saúde: crie sua conta e cadastre o primeiro paciente. Paciente: entre com o CPF e a senha que você recebeu.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/cadastro" className={btnClass('primary', '!min-h-14 !px-7 text-lg')}><Stethoscope size={20} aria-hidden /> Criar conta de profissional</Link>
            <Link to="/entrar" className={btnClass('secondary', '!min-h-14 !px-7 text-lg')}>Entrar <ArrowRight size={20} aria-hidden /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-page">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-muted sm:flex-row">
          <Logo />
          <p className="text-sm">FIAP · Global Solution 2 · CitizenTech 2026 — protótipo acadêmico com dados fictícios.</p>
        </div>
      </footer>
    </div>
  )
}
