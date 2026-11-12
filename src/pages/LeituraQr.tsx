import { useEffect, useState, type ReactNode } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Droplet, Phone, Accessibility, Pill, HeartPulse, ShieldCheck, ShieldOff, Stethoscope,
  ClipboardList, Pencil, Link2, CalendarDays, Eye, LogIn,
} from 'lucide-react'
import { api, idade } from '../services/api'
import type { FichaTecnica, LeituraQr as TLeitura, ResumoEmergencia } from '../types'
import { Badge, BotaoOuvir, Button, Carregando, btnClass, formatarData, hojeISO } from '../components/ui'
import { Logo } from '../components/Logo'
import { A11yToolbar } from '../components/A11yToolbar'
import { GraficoAdesao } from '../components/Indicadores'
import { STATUS_CONSULTA } from '../components/ListaConsultas'
import { useAuth } from '../context/AuthContext'

function Bloco({ icone, titulo, children, destaque }: { icone: ReactNode; titulo: string; children: ReactNode; destaque?: boolean }) {
  return (
    <section className={`card rounded-2xl border-2 p-5 ${destaque ? 'border-danger/50 bg-danger/5' : 'border-line bg-card'}`}>
      <h2 className={`flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider ${destaque ? 'text-danger' : 'text-muted'}`}>{icone} {titulo}</h2>
      <div className="mt-2 text-xl font-bold text-ink">{children}</div>
    </section>
  )
}

function Telefone({ nome, parentesco, telefone }: { nome: string; parentesco: string; telefone: string }) {
  return (
    <>
      <p>{nome} <span className="font-semibold text-muted">({parentesco.toLowerCase()})</span></p>
      <p className="mt-1 select-all text-2xl font-extrabold tabular-nums">{telefone}</p>
      <a href={`tel:${telefone.replace(/\D/g, '')}`} className="mt-3 inline-flex min-h-14 items-center gap-2 rounded-xl bg-brand px-6 text-lg font-extrabold text-white hover:bg-brand-strong">
        <Phone size={20} aria-hidden /> Ligar
      </a>
    </>
  )
}

/**
 * Página aberta ao escanear o QR Code.
 *  - Qualquer pessoa: resumo de emergência em letras grandes.
 *  - Profissional logado: ficha técnica completa, com acesso registrado no histórico.
 */
export default function LeituraQr() {
  const { token = '' } = useParams()
  const { sessao } = useAuth()
  const [leitura, setLeitura] = useState<TLeitura | null>()

  useEffect(() => {
    document.title = 'Carteirinha — Saúde Fácil'
    setLeitura(undefined)
    api.lerQr(token).then(setLeitura).catch(() => setLeitura(null))
  }, [token, sessao?.perfil])

  const topo = (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
        <Link to="/" aria-label="Saúde Fácil — página inicial"><Logo /></Link>
        <A11yToolbar />
      </div>
    </header>
  )

  let conteudo: ReactNode
  if (leitura === undefined) conteudo = <Carregando />
  else if (leitura === null)
    conteudo = (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <ShieldOff size={56} className="mx-auto text-muted" aria-hidden />
        <h1 className="mt-4 text-3xl font-extrabold text-ink">Informações indisponíveis</h1>
        <p className="mt-3 text-lg text-muted">Este QR Code foi desligado pelo titular ou não é mais válido.</p>
        <p className="mt-4 text-lg font-bold text-ink">Em emergência, ligue <span className="text-danger">192 (SAMU)</span>.</p>
      </div>
    )
  else if (leitura.tipo === 'EMERGENCIA') conteudo = <VisaoEmergencia d={leitura.dados} token={token} logadoComoPaciente={sessao?.perfil === 'PACIENTE'} />
  else conteudo = <VisaoFicha f={leitura.dados} token={token} />

  return (
    <div className="min-h-dvh bg-page">
      {topo}
      <main className="mx-auto max-w-4xl px-4 py-8">{conteudo}</main>
    </div>
  )
}

/* ---------------- Qualquer pessoa ---------------- */

function VisaoEmergencia({ d, token, logadoComoPaciente }: { d: ResumoEmergencia; token: string; logadoComoPaciente: boolean }) {
  const falado = [
    `Informações essenciais de ${d.nome}${d.idade ? `, ${d.idade} anos` : ''}.`,
    d.alergias && `Atenção, alergias: ${d.alergias}.`,
    d.tipoSanguineo && `Tipo sanguíneo ${d.tipoSanguineo}.`,
    d.condicoes && `Condições de saúde: ${d.condicoes}.`,
    d.necessidadesAcessibilidade && `Acessibilidade: ${d.necessidadesAcessibilidade}.`,
    d.medicamentos?.length && `Medicamentos em uso: ${d.medicamentos.map((m) => m.nome).join(', ')}.`,
    d.contatoEmergencia && `Contato de emergência: ${d.contatoEmergencia.nome}, ${d.contatoEmergencia.parentesco}, telefone ${d.contatoEmergencia.telefone}.`,
  ].filter(Boolean).join(' ')

  return (
    <div className="mx-auto max-w-2xl">
      <p className="inline-flex items-center gap-2 rounded-full bg-soft px-4 py-1.5 font-bold text-brand-strong"><HeartPulse size={18} aria-hidden /> Informações de emergência</p>
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
            <ul className="flex flex-col gap-1">{d.medicamentos.map((m) => <li key={m.nome}>{m.nome} <span className="font-semibold text-muted">— {m.dosagem}</span></li>)}</ul>
          </Bloco>
        )}
        {d.contatoEmergencia && <Bloco icone={<Phone size={18} aria-hidden />} titulo="Contato de emergência"><Telefone {...d.contatoEmergencia} /></Bloco>}
      </div>

      {!logadoComoPaciente && (
        <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-ink p-5 text-white sm:flex-row sm:items-center">
          <Stethoscope size={28} className="shrink-0 text-[#7FE0CF]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold">É profissional de saúde?</p>
            <p className="text-white/80">Entre com sua conta para ver a ficha técnica completa: prescrição, adesão e consultas.</p>
          </div>
          <Link to="/entrar" state={{ de: `/c/${token}`, perfil: 'PROFISSIONAL' }} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 font-extrabold text-ink hover:bg-soft">
            <LogIn size={20} aria-hidden /> Entrar
          </Link>
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 text-muted">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />
        Informações compartilhadas com autorização do titular. Atualizado em {new Date(d.atualizadaEm).toLocaleDateString('pt-BR')}.
      </p>
    </div>
  )
}

/* ---------------- Profissional logado ---------------- */

function VisaoFicha({ f, token }: { f: FichaTecnica; token: string }) {
  const { paciente: p, medicamentos, consultas, estatisticas, responsaveis } = f
  const navegar = useNavigate()
  const [vinculando, setVinculando] = useState(false)
  const [erro, setErro] = useState('')
  const hoje = hojeISO()
  const ativos = medicamentos.filter((m) => m.ativo)
  const proximas = consultas.filter((c) => c.status === 'AGENDADA' && c.data >= hoje).sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
  const recentes = consultas.filter((c) => !(c.status === 'AGENDADA' && c.data >= hoje)).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3)
  const necessidades = [...p.necessidadesAcessibilidade, p.observacoesAcessibilidade].filter(Boolean)

  async function vincular() {
    setVinculando(true)
    setErro('')
    try {
      const id = await api.vincularPorToken(token)
      navegar(`/pro/paciente/${id}`)
    } catch (e) {
      setErro((e as Error).message)
      setVinculando(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl bg-ink p-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 font-bold"><Eye size={20} className="text-[#7FE0CF]" aria-hidden /> Acesso profissional — este acesso foi registrado no histórico do paciente.</p>
        {f.vinculado ? (
          <Link to={`/pro/paciente/${p.id}`} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 font-extrabold text-ink hover:bg-soft">
            <Pencil size={18} aria-hidden /> Editar ficha
          </Link>
        ) : (
          <Button onClick={vincular} disabled={vinculando} className="!bg-white !text-ink hover:!bg-soft">
            <Link2 size={18} aria-hidden /> {vinculando ? 'Vinculando…' : 'Vincular à minha lista'}
          </Button>
        )}
      </div>
      {erro && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-4 py-3 font-bold text-danger">{erro}</p>}
      {!f.vinculado && <p className="mt-3 text-muted">Você pode ver a ficha. Para prescrever ou alterar, vincule o paciente à sua lista: a ação fica registrada.</p>}

      <header className="mt-6">
        <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-brand"><ClipboardList size={16} aria-hidden /> Ficha técnica</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">{p.nome}</h1>
        <p className="mt-1 text-xl font-bold text-muted">{idade(p.dataNascimento)} anos · nasc. {formatarData(p.dataNascimento, { day: '2-digit', month: '2-digit', year: 'numeric' })} · CPF {p.cpf}</p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {p.alergias ? (
          <Bloco destaque icone={<AlertTriangle size={18} aria-hidden />} titulo="Alergias">{p.alergias}</Bloco>
        ) : (
          <Bloco icone={<AlertTriangle size={18} aria-hidden />} titulo="Alergias"><span className="text-muted">Nenhuma registrada</span></Bloco>
        )}
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
          <Bloco icone={<Droplet size={18} aria-hidden />} titulo="Sangue"><span className="text-4xl font-extrabold">{p.tipoSanguineo || '—'}</span></Bloco>
          <Bloco icone={<HeartPulse size={18} aria-hidden />} titulo="Condições">{p.condicoes || <span className="text-muted">Nenhuma registrada</span>}</Bloco>
        </div>
        {necessidades.length > 0 && (
          <Bloco icone={<Accessibility size={18} aria-hidden />} titulo="Como se comunicar">
            <ul className="flex flex-col gap-1">{necessidades.map((n) => <li key={n}>{n}</li>)}</ul>
          </Bloco>
        )}
        <Bloco icone={<Phone size={18} aria-hidden />} titulo="Contato de emergência">
          <Telefone nome={p.contatoEmergenciaNome} parentesco={p.contatoEmergenciaParentesco} telefone={p.contatoEmergenciaTelefone} />
        </Bloco>
      </div>

      <section className="card mt-6 rounded-2xl border-2 border-line bg-card p-5">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink"><Pill size={22} className="text-brand" aria-hidden /> Prescrição em uso ({ativos.length})</h2>
        {ativos.length === 0 ? <p className="mt-3 text-muted">Nenhum remédio em uso.</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left">
              <thead className="text-sm uppercase tracking-wider text-muted">
                <tr><th scope="col" className="pb-2 pr-4">Remédio</th><th scope="col" className="pb-2 pr-4">Dose</th><th scope="col" className="pb-2 pr-4">Horários</th><th scope="col" className="pb-2">Prescrito por</th></tr>
              </thead>
              <tbody>
                {ativos.map((m) => (
                  <tr key={m.id} className="border-t border-line align-top">
                    <th scope="row" className="py-3 pr-4 text-lg font-extrabold text-ink">{m.nome}{m.observacoes && <span className="block text-sm font-semibold text-muted">{m.observacoes}</span>}</th>
                    <td className="py-3 pr-4 font-bold text-ink">{m.dosagem}</td>
                    <td className="py-3 pr-4 font-extrabold tabular-nums text-ink">{m.horarios.join(' · ')}</td>
                    <td className="py-3 text-sm text-muted">{m.prescritoPor ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6"><GraficoAdesao stats={estatisticas} /></div>

      <section className="card mt-6 rounded-2xl border-2 border-line bg-card p-5">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink"><CalendarDays size={22} className="text-brand" aria-hidden /> Consultas</h2>
        <ul className="mt-3 flex flex-col">
          {[...proximas, ...recentes].map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line py-3 first:border-0">
              <span className="w-28 font-extrabold tabular-nums text-ink">{formatarData(c.data, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              <span className="min-w-0 flex-1 font-bold text-ink">{c.especialidade}<span className="font-semibold text-muted"> · {c.profissional ? `${c.profissional} · ` : ''}{c.local}</span></span>
              <Badge tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].rotulo}</Badge>
            </li>
          ))}
          {consultas.length === 0 && <li className="text-muted">Nenhuma consulta registrada.</li>}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl bg-soft p-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink"><Stethoscope size={20} className="text-brand" aria-hidden /> Profissionais responsáveis</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {responsaveis.map((r) => <li key={r.id} className="text-ink"><strong>{r.nome}</strong> · {r.especialidade} · {r.conselho}{r.instituicao ? ` · ${r.instituicao}` : ''}</li>)}
        </ul>
      </section>

      {f.vinculado && (
        <div className="mt-6">
          <Link to={`/pro/paciente/${p.id}`} className={btnClass('primary', '!min-h-14 w-full text-lg sm:w-auto')}><Pencil size={20} aria-hidden /> Editar ficha, prescrição e consultas</Link>
        </div>
      )}
    </>
  )
}
