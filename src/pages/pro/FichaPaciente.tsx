import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft, Droplet, AlertTriangle, Accessibility, KeyRound, Phone, Check, Clock, History,
  LayoutDashboard, Pill, CalendarDays, UserRound, IdCard, CircleAlert,
} from 'lucide-react'
import { api, dosePrevista, idade } from '../../services/api'
import type { Atividade, DoseRegistro, Estatisticas, Medicamento, Paciente } from '../../types'
import { Aviso, Badge, Button, Card, Carregando, ResumoErros, hojeISO } from '../../components/ui'
import { StatCard } from '../../components/StatCard'
import { GraficoAdesao, GraficosConsultas, Interpretacao, leituraAdesao } from '../../components/Indicadores'
import { ListaMedicamentos } from '../../components/ListaMedicamentos'
import { ListaConsultas } from '../../components/ListaConsultas'
import { PainelCarteirinha } from '../../components/PainelCarteirinha'
import { Modal } from '../../components/Modal'
import { SenhaAcesso } from '../../components/SenhaAcesso'
import { useConfirm } from '../../components/ConfirmDialog'
import {
  SecaoAcessibilidade, SecaoEmergencia, SecaoIdentificacao, SecaoSaude, normalizarPaciente, validarPaciente, type FormPacienteDados,
} from '../../components/FormPaciente'
import { focarPrimeiroErro, type Erros } from '../../services/validacao'

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo', icone: LayoutDashboard },
  { id: 'remedios', rotulo: 'Prescrição', icone: Pill },
  { id: 'consultas', rotulo: 'Consultas', icone: CalendarDays },
  { id: 'dados', rotulo: 'Dados e emergência', icone: UserRound },
  { id: 'carteirinha', rotulo: 'Carteirinha', icone: IdCard },
  { id: 'historico', rotulo: 'Histórico', icone: History },
] as const
type Aba = (typeof ABAS)[number]['id']

export default function FichaPaciente() {
  const id = Number(useParams().id)
  const abaInicial = (useLocation().state as { aba?: Aba } | null)?.aba ?? 'resumo'
  const [aba, setAba] = useState<Aba>(abaInicial)
  const [p, setP] = useState<Paciente>()
  const [stats, setStats] = useState<Estatisticas>()
  const [erro, setErro] = useState('')
  const [senha, setSenha] = useState('')
  const confirmar = useConfirm()
  const abasRef = useRef<(HTMLButtonElement | null)[]>([])

  const carregar = useCallback(() => {
    Promise.all([api.getPaciente(id), api.getEstatisticas(id)])
      .then(([pac, s]) => { setP(pac); setStats(s) })
      .catch((e: Error) => setErro(e.message))
  }, [id])
  useEffect(() => { carregar() }, [carregar])

  if (erro) return (
    <Card className="p-8 text-center">
      <CircleAlert size={40} className="mx-auto text-danger" aria-hidden />
      <p role="alert" className="mt-3 text-lg font-bold text-ink">{erro}</p>
      <p className="mt-1 text-muted">Se o paciente está com você, leia o QR Code da carteirinha para vincular.</p>
      <Link to="/pro" className="mt-4 inline-block font-bold text-brand underline">Voltar para meus pacientes</Link>
    </Card>
  )
  if (!p || !stats) return <Carregando />

  async function gerarSenha() {
    const ok = await confirmar({
      titulo: 'Gerar nova senha de acesso?',
      mensagem: `A senha atual de ${p!.nome.split(' ')[0]} para de funcionar. Use quando o paciente perdeu o papel ou esqueceu a senha.`,
      confirmar: 'Gerar nova senha',
    })
    if (!ok) return
    setSenha(await api.novaSenhaAcesso(p!.id))
  }

  function teclaAbas(e: KeyboardEvent, i: number) {
    const n = e.key === 'ArrowRight' ? (i + 1) % ABAS.length : e.key === 'ArrowLeft' ? (i - 1 + ABAS.length) % ABAS.length : e.key === 'Home' ? 0 : e.key === 'End' ? ABAS.length - 1 : -1
    if (n < 0) return
    e.preventDefault()
    setAba(ABAS[n].id)
    abasRef.current[n]?.focus()
  }

  const anos = idade(p.dataNascimento)

  return (
    <>
      <Link to="/pro" className="inline-flex items-center gap-1 font-bold text-brand hover:underline"><ArrowLeft size={18} aria-hidden /> Meus pacientes</Link>

      <header className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-wider text-brand">Ficha técnica</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{p.nome}</h1>
          <p className="mt-1 text-lg text-muted">{anos} anos · CPF {p.cpf}{p.telefone ? ` · ${p.telefone}` : ''}</p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Alertas da ficha">
            {p.tipoSanguineo && <li className="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1 text-sm font-extrabold text-ink"><Droplet size={14} className="text-danger" aria-hidden /> {p.tipoSanguineo}</li>}
            {p.alergias && <li className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-sm font-extrabold text-danger"><AlertTriangle size={14} aria-hidden /> Alergia: {p.alergias}</li>}
            {p.necessidadesAcessibilidade.map((n) => <li key={n} className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1 text-sm font-extrabold text-brand-strong"><Accessibility size={14} aria-hidden /> {n}</li>)}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
          <Button variant="secondary" onClick={gerarSenha}><KeyRound size={18} aria-hidden /> Nova senha de acesso</Button>
          <p className="flex items-center gap-1.5 text-sm text-muted"><Phone size={14} aria-hidden /> {p.contatoEmergenciaNome} ({p.contatoEmergenciaParentesco.toLowerCase()}) · {p.contatoEmergenciaTelefone}</p>
        </div>
      </header>

      <div role="tablist" aria-label="Seções da ficha" className="no-print -mx-4 mt-6 flex gap-1 overflow-x-auto border-b-2 border-line px-4">
        {ABAS.map(({ id: a, rotulo, icone: Icone }, i) => (
          <button
            key={a}
            ref={(el) => { abasRef.current[i] = el }}
            role="tab"
            id={`aba-${a}`}
            aria-selected={aba === a}
            aria-controls={`painel-${a}`}
            tabIndex={aba === a ? 0 : -1}
            onClick={() => setAba(a)}
            onKeyDown={(e) => teclaAbas(e, i)}
            className={`-mb-0.5 inline-flex min-h-12 shrink-0 items-center gap-2 whitespace-nowrap border-b-4 px-4 font-extrabold transition-colors ${aba === a ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}
          >
            <Icone size={18} aria-hidden /> {rotulo}
          </button>
        ))}
      </div>

      <section role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`} tabIndex={0} className="mt-6 outline-none">
        {aba === 'resumo' && <AbaResumo paciente={p} stats={stats} />}
        {aba === 'remedios' && <ListaMedicamentos pacienteId={p.id} editavel onMudou={carregar} />}
        {aba === 'consultas' && <ListaConsultas pacienteId={p.id} editavel onMudou={carregar} />}
        {aba === 'dados' && <AbaDados paciente={p} onSalvo={(np) => setP(np)} />}
        {aba === 'carteirinha' && <PainelCarteirinha paciente={p} editavel />}
        {aba === 'historico' && <AbaHistorico pacienteId={p.id} />}
      </section>

      <Modal titulo="Nova senha de acesso" aberto={!!senha} onFechar={() => setSenha('')} largura="max-w-xl">
        <SenhaAcesso nome={p.nome} cpf={p.cpf} senha={senha} />
      </Modal>
    </>
  )
}

/* ---------------- Resumo ---------------- */

function AbaResumo({ paciente, stats }: { paciente: Paciente; stats: Estatisticas }) {
  const [meds, setMeds] = useState<Medicamento[]>()
  const [doses, setDoses] = useState<DoseRegistro[]>([])
  const hoje = hojeISO()
  const agora = new Date().toTimeString().slice(0, 5)
  useEffect(() => {
    Promise.all([api.listarMedicamentos(paciente.id), api.listarDoses(paciente.id, hoje)]).then(([m, d]) => { setMeds(m); setDoses(d) })
  }, [paciente.id, hoje])

  const dosesHoje = (meds ?? []).filter((m) => m.ativo)
    .flatMap((m) => m.horarios.map((h) => ({ h, m, reg: doses.find((d) => d.medicamentoId === m.id && d.horario === h) })))
    .filter(({ h, m, reg }) => reg || dosePrevista(m, hoje, h))
    .sort((a, b) => a.h.localeCompare(b.h))
  const tomadas = dosesHoje.filter((x) => x.reg).length
  const atrasadas = dosesHoje.filter((x) => !x.reg && x.h < agora).length
  const a = leituraAdesao(stats.adesaoPercentual7Dias)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard valor={stats.adesaoPercentual7Dias === null ? '—' : `${stats.adesaoPercentual7Dias}%`} rotulo="Adesão 7 dias" detalhe={a.texto} icone={<Check size={24} />} />
        <StatCard valor={dosesHoje.length ? `${tomadas}/${dosesHoje.length}` : '—'} rotulo="Doses hoje" detalhe={atrasadas ? `${atrasadas} atrasada${atrasadas > 1 ? 's' : ''}` : 'sem atrasos'} icone={<Clock size={24} />} />
        <StatCard valor={stats.medicamentosAtivos} rotulo="Remédios em uso" detalhe={`${stats.dosesPorDia} dose${stats.dosesPorDia === 1 ? '' : 's'} por dia`} icone={<Pill size={24} />} />
        <StatCard valor={stats.consultasAgendadas} rotulo="Consultas agendadas" detalhe={`${stats.consultasRealizadas} realizadas`} icone={<CalendarDays size={24} />} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-ink">Doses de hoje</h2>
          <p className="text-muted">Confirmadas pelo paciente no aplicativo.</p>
          {!meds ? <Carregando /> : dosesHoje.length === 0 ? (
            <p className="mt-4 text-muted">{meds.some((m) => m.ativo) ? 'Nenhuma dose prevista hoje. Remédios prescritos agora começam no próximo horário.' : 'Nenhum remédio em uso.'}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {dosesHoje.map(({ h, m, reg }) => {
                const atrasada = !reg && h < agora
                return (
                  <li key={m.id + h} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <span className="w-12 font-extrabold tabular-nums text-ink">{h}</span>
                    <span className="min-w-0 flex-1 font-bold leading-tight text-ink">{m.nome}</span>
                    {reg ? <Badge>Tomou {new Date(reg.tomadaEm).toTimeString().slice(0, 5)}</Badge> : atrasada ? <Badge tom="warn">Não confirmou</Badge> : <Badge tom="muted">Pendente</Badge>}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
        <GraficoAdesao stats={stats} />
      </div>

      <GraficosConsultas stats={stats} />
      <Interpretacao stats={stats} pessoa="paciente" />
      <p className="text-sm text-muted">Paciente desde {new Date(paciente.criadoEm).toLocaleDateString('pt-BR')}.</p>
    </div>
  )
}

/* ---------------- Dados e emergência ---------------- */

function AbaDados({ paciente, onSalvo }: { paciente: Paciente; onSalvo: (p: Paciente) => void }) {
  const { id: _id, profissionaisIds: _p, criadoEm: _c, ...dados } = paciente
  const [f, setF] = useState<FormPacienteDados>({ ...dados, telefone: dados.telefone ?? '', tipoSanguineo: dados.tipoSanguineo ?? '', alergias: dados.alergias ?? '', condicoes: dados.condicoes ?? '', observacoesAcessibilidade: dados.observacoesAcessibilidade ?? '', consentimentoLgpd: true })
  const [erros, setErros] = useState<Erros>({})
  const [aviso, setAviso] = useState({ texto: '', tom: 'ok' as 'ok' | 'erro' })
  const [salvando, setSalvando] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const set = <K extends keyof FormPacienteDados>(k: K, v: FormPacienteDados[K]) => {
    setF((x) => ({ ...x, [k]: v }))
    if (erros[k as string]) setErros((e) => ({ ...e, [k]: '' }))
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const novos = validarPaciente(f, 'tudo')
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return focarPrimeiroErro(formRef.current)
    setSalvando(true)
    try {
      const salvo = await api.atualizarPaciente(paciente.id, normalizarPaciente(f))
      onSalvo(salvo)
      setAviso({ texto: 'Ficha atualizada. A alteração foi registrada no histórico.', tom: 'ok' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const msg = (err as Error).message
      if (/CPF/.test(msg)) { setErros({ cpf: msg }); focarPrimeiroErro(formRef.current) } else setAviso({ texto: msg, tom: 'erro' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={salvar} noValidate className="flex flex-col gap-6">
      <Aviso texto={aviso.texto} tom={aviso.tom} />
      <ResumoErros quantidade={Object.values(erros).filter(Boolean).length} />
      <Card className="p-6"><h2 className="mb-5 text-xl font-extrabold text-ink">Identificação</h2><SecaoIdentificacao f={f} set={set} erros={erros} /></Card>
      <Card className="p-6"><SecaoEmergencia f={f} set={set} erros={erros} /></Card>
      <Card className="p-6"><SecaoSaude f={f} set={set} erros={erros} /></Card>
      <Card className="flex flex-col gap-5 p-6"><SecaoAcessibilidade f={f} set={set} erros={erros} /></Card>
      <div><Button type="submit" disabled={salvando} className="!min-h-14 !px-8 text-lg">{salvando ? 'Salvando…' : 'Salvar ficha'}</Button></div>
    </form>
  )
}

/* ---------------- Histórico ---------------- */

function AbaHistorico({ pacienteId }: { pacienteId: number }) {
  const [lista, setLista] = useState<Atividade[]>()
  useEffect(() => { api.listarAtividades(pacienteId).then(setLista) }, [pacienteId])
  if (!lista) return <Carregando />
  return (
    <Card className="p-6">
      <h2 className="text-xl font-extrabold text-ink">Histórico de alterações e acessos</h2>
      <p className="text-muted">Quem mudou o quê, e quando. Os registros não podem ser editados.</p>
      <ol className="mt-5 flex flex-col">
        {lista.map((a, i) => (
          <li key={a.id} className="relative flex gap-4 pb-5 last:pb-0">
            {i < lista.length - 1 && <span className="absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-0.5 bg-line" aria-hidden />}
            <span className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full ${a.perfil === 'PROFISSIONAL' ? 'bg-brand text-white' : 'bg-page text-muted ring-2 ring-line'}`} aria-hidden>
              <span className="h-2 w-2 rounded-full bg-current" />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-ink">{a.acao}</p>
              <p className="text-sm text-muted">{a.autor} · <time dateTime={a.quando}>{new Date(a.quando).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time></p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
