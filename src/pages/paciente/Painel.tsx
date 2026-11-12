import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Pill, Clock, MapPin, ArrowRight, IdCard, Check, Undo2, Target, AlertCircle, Stethoscope } from 'lucide-react'
import { api, dosePrevista } from '../../services/api'
import type { Consulta, DoseRegistro, Estatisticas, Medicamento, Profissional } from '../../types'
import { Card, Carregando, BotaoOuvir, btnClass, formatarData, diaDaSemana, hojeISO, Badge } from '../../components/ui'
import { StatCard } from '../../components/StatCard'
import { GraficoAdesao, Interpretacao, leituraAdesao } from '../../components/Indicadores'
import { LembreteConsulta, LembreteTodosRemedios } from '../../components/Lembretes'
import { usePaciente } from '../../context/AuthContext'

export default function Painel() {
  const eu = usePaciente()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [meds, setMeds] = useState<Medicamento[]>([])
  const [doses, setDoses] = useState<DoseRegistro[]>([])
  const [stats, setStats] = useState<Estatisticas>()
  const [responsaveis, setResponsaveis] = useState<Profissional[]>([])
  const [erro, setErro] = useState('')
  const [anuncio, setAnuncio] = useState('')
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [agora, setAgora] = useState(() => new Date().toTimeString().slice(0, 5))
  const hoje = hojeISO()

  useEffect(() => {
    Promise.all([api.listarConsultas(eu.id), api.listarMedicamentos(eu.id), api.listarDoses(eu.id, hoje), api.getEstatisticas(eu.id), api.getResponsaveis(eu.id)])
      .then(([c, m, d, s, r]) => { setConsultas(c); setMeds(m); setDoses(d); setStats(s); setResponsaveis(r) })
      .catch((e: Error) => setErro(e.message))
    const t = setInterval(() => setAgora(new Date().toTimeString().slice(0, 5)), 60000)
    return () => clearInterval(t)
  }, [eu.id, hoje])

  const proxima = useMemo(
    () => consultas.filter((c) => c.status === 'AGENDADA' && c.data >= hoje).sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))[0],
    [consultas, hoje],
  )
  const dosesHoje = useMemo(
    () => meds.filter((m) => m.ativo).flatMap((m) => m.horarios.map((h) => ({ h, m, registro: doses.find((d) => d.medicamentoId === m.id && d.horario === h) })))
      .map((x) => ({ ...x, novo: !x.registro && !dosePrevista(x.m, hoje, x.h) })) // prescrito depois deste horário: começa amanhã
      .sort((a, b) => a.h.localeCompare(b.h)),
    [meds, doses, hoje],
  )

  const atualizarStats = useCallback(() => api.getEstatisticas(eu.id).then(setStats), [eu.id])

  async function tomei(m: Medicamento, h: string) {
    setOcupado(`${m.id}-${h}`)
    try {
      const d = await api.registrarDose(m.id, hoje, h)
      setDoses((x) => [...x, d])
      setAnuncio(`${m.nome} das ${h} registrado como tomado.`)
      atualizarStats()
    } catch (e) {
      setAnuncio((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }
  async function desfazer(m: Medicamento, d: DoseRegistro) {
    setOcupado(`${m.id}-${d.horario}`)
    try {
      await api.desfazerDose(d.id)
      setDoses((x) => x.filter((y) => y.id !== d.id))
      setAnuncio(`Registro de ${m.nome} das ${d.horario} desfeito.`)
      atualizarStats()
    } finally {
      setOcupado(null)
    }
  }

  if (erro) return <p role="alert" className="rounded-xl bg-danger/10 p-4 font-semibold text-danger">Não foi possível carregar: {erro}</p>
  if (!stats) return <Carregando />

  const primeiroNome = eu.nome.split(' ')[0]
  const contaveis = dosesHoje.filter((x) => !x.novo)
  const tomadasHoje = contaveis.filter((x) => x.registro).length
  const atrasadas = contaveis.filter((x) => !x.registro && x.h < agora).length
  const adesao = leituraAdesao(stats.adesaoPercentual7Dias)

  const resumoFalado = [
    `Olá, ${primeiroNome}.`,
    proxima
      ? `Sua próxima consulta é de ${proxima.especialidade}, ${diaDaSemana(proxima.data)}, ${formatarData(proxima.data, { day: 'numeric', month: 'long' })}, às ${proxima.horario.replace(':', ' e ')}, em ${proxima.local}.`
      : 'Você não tem consultas agendadas.',
    contaveis.length ? `Hoje você já tomou ${tomadasHoje} de ${contaveis.length} doses de remédio.` : '',
    atrasadas ? `Atenção: ${atrasadas} dose${atrasadas > 1 ? 's' : ''} ainda não confirmada${atrasadas > 1 ? 's' : ''}.` : '',
  ].join(' ')

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">{anuncio}</p>

      <header className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Olá, {primeiroNome}!</h1>
          <p className="mt-1 text-lg text-muted">{diaDaSemana(hoje)}, {formatarData(hoje, { day: 'numeric', month: 'long' })}</p>
        </div>
        <BotaoOuvir texto={resumoFalado} rotulo="Ouvir resumo do dia" />
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard valor={contaveis.length ? `${tomadasHoje}/${contaveis.length}` : '—'} rotulo="Doses tomadas hoje" detalhe={atrasadas ? `${atrasadas} sem confirmar` : contaveis.length ? 'Tudo em dia' : 'Nenhuma ainda'} icone={<Check size={24} />} />
        <StatCard valor={stats.adesaoPercentual7Dias === null ? '—' : `${stats.adesaoPercentual7Dias}%`} rotulo="Adesão em 7 dias" detalhe={adesao.texto} icone={<Target size={24} />} />
        <StatCard valor={stats.consultasAgendadas} rotulo="Consultas agendadas" detalhe={proxima ? `Próxima: ${formatarData(proxima.data, { day: '2-digit', month: '2-digit' })}` : 'Nenhuma marcada'} icone={<CalendarClock size={24} />} />
        <StatCard valor={stats.medicamentosAtivos} rotulo="Remédios em uso" detalhe={`${stats.dosesPorDia} dose${stats.dosesPorDia === 1 ? '' : 's'} por dia`} icone={<Pill size={24} />} />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-ink">Remédios de hoje</h2>
            {contaveis.length > 0 && <Badge tom={tomadasHoje === contaveis.length ? 'brand' : atrasadas ? 'warn' : 'muted'}>{tomadasHoje} de {contaveis.length} tomadas</Badge>}
          </div>
          {contaveis.length > 0 && (
            <div className="mt-3 h-3 rounded-full bg-page" aria-hidden>
              <div className="h-3 rounded-full bg-brand transition-all" style={{ width: `${(tomadasHoje / contaveis.length) * 100}%` }} />
            </div>
          )}
          {dosesHoje.length ? (
            <ul className="mt-4 flex flex-col gap-2">
              {dosesHoje.map(({ h, m, registro, novo }) => {
                const atrasada = !registro && !novo && h < agora
                const chave = `${m.id}-${h}`
                return (
                  <li key={chave} className={`flex items-center gap-2 rounded-2xl border-2 p-3 sm:gap-3 ${registro ? 'border-brand/30 bg-soft/60' : atrasada ? 'border-warn/40 bg-warn-soft/60' : 'border-line'}`}>
                    <span className={`w-12 shrink-0 text-lg font-extrabold tabular-nums sm:w-14 sm:text-xl ${registro ? 'text-brand' : atrasada ? 'text-warn' : 'text-ink'}`}>{h}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-bold text-ink ${registro ? 'line-through decoration-2 opacity-70' : ''}`}>{m.nome}</span>
                      <span className="block text-sm text-muted">
                        {registro
                          ? `Tomado às ${new Date(registro.tomadaEm).toTimeString().slice(0, 5)}`
                          : atrasada
                            ? <span className="inline-flex items-center gap-1 font-bold text-warn"><AlertCircle size={14} aria-hidden /> Ainda não confirmado</span>
                            : m.dosagem}
                      </span>
                    </span>
                    {novo ? (
                      <span className="ml-auto shrink-0 rounded-xl bg-page px-3 py-2 text-sm font-bold text-muted">Começa amanhã</span>
                    ) : registro ? (
                      <button type="button" disabled={ocupado === chave} onClick={() => desfazer(m, registro)} className="ml-auto inline-flex min-h-12 items-center gap-1.5 rounded-xl px-3 font-bold text-muted hover:bg-card hover:text-ink disabled:opacity-50" aria-label={`Desfazer: ${m.nome} das ${h}`}>
                        <Undo2 size={18} aria-hidden /> <span className="hidden sm:inline">Desfazer</span>
                      </button>
                    ) : (
                      <button type="button" disabled={ocupado === chave} onClick={() => tomei(m, h)} className="ml-auto inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-lg font-extrabold text-white hover:bg-brand-strong disabled:opacity-50" aria-label={`Tomei ${m.nome} das ${h}`}>
                        <Check size={22} strokeWidth={3} aria-hidden /> Tomei
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border-2 border-dashed border-line p-6 text-center text-lg text-muted">Seu profissional de saúde ainda não cadastrou remédios.</p>
          )}
          {dosesHoje.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <LembreteTodosRemedios meds={meds} />
              <Link to="/remedios" className={btnClass('ghost')}>Ver detalhes <ArrowRight size={18} aria-hidden /></Link>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-ink">Próxima consulta</h2>
              {proxima && <Badge>Agendada</Badge>}
            </div>
            {proxima ? (
              <>
                <div className="mt-4 flex gap-4">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-brand text-white" aria-hidden>
                    <div className="text-center leading-none">
                      <p className="text-3xl font-extrabold">{formatarData(proxima.data, { day: '2-digit' })}</p>
                      <p className="mt-1 text-sm font-bold uppercase">{formatarData(proxima.data, { month: 'short' }).replace('.', '')}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-extrabold text-ink">{proxima.especialidade}</p>
                    {proxima.profissional && <p className="text-muted">{proxima.profissional}</p>}
                    <p className="mt-1.5 flex items-center gap-1.5 font-semibold text-ink"><Clock size={16} aria-hidden /> {diaDaSemana(proxima.data)}, {proxima.horario}</p>
                    <p className="flex items-center gap-1.5 font-semibold text-ink"><MapPin size={16} aria-hidden /> {proxima.local}</p>
                  </div>
                </div>
                {proxima.observacoes && <p className="mt-3 rounded-lg bg-warn-soft px-3 py-1.5 text-warn">📝 {proxima.observacoes}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <LembreteConsulta c={proxima} />
                  <Link to="/consultas" className={btnClass('ghost')}>Todas as consultas <ArrowRight size={18} aria-hidden /></Link>
                </div>
              </>
            ) : (
              <p className="mt-3 text-lg text-muted">Nenhuma consulta agendada.</p>
            )}
          </Card>

          {responsaveis.length > 0 && (
            <Card className="p-6">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink"><Stethoscope size={20} className="text-brand" aria-hidden /> Quem cuida de você</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {responsaveis.map((r) => (
                  <li key={r.id}>
                    <p className="font-bold text-ink">{r.nome}</p>
                    <p className="text-sm text-muted">{r.especialidade} · {r.conselho}{r.instituicao ? ` · ${r.instituicao}` : ''}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">Remédio ou horário errado? Fale com eles: só o profissional pode alterar.</p>
            </Card>
          )}

          <Card className="flex items-center gap-4 p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white" aria-hidden><IdCard size={24} /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-extrabold text-ink">Carteirinha digital</h2>
              <p className="text-muted">QR Code para emergências.</p>
            </div>
            <Link to="/carteirinha" className={btnClass('secondary', '!px-4')}>Abrir</Link>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <GraficoAdesao stats={stats} />
        <Interpretacao stats={stats} />
      </div>
    </>
  )
}
