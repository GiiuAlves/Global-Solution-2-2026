import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarClock, Pill, Clock, MapPin, ArrowRight, Lightbulb, IdCard } from 'lucide-react'
import { api } from '../services/api'
import type { Consulta, Estatisticas, Medicamento, Usuario } from '../types'
import { Card, Carregando, BotaoOuvir, btnClass, formatarData, diaDaSemana, hojeISO, Badge } from '../components/ui'
import { StatCard } from '../components/StatCard'

export default function Dashboard() {
  const [usuario, setUsuario] = useState<Usuario>()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [meds, setMeds] = useState<Medicamento[]>([])
  const [stats, setStats] = useState<Estatisticas>()
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([api.getUsuario(), api.listarConsultas(), api.listarMedicamentos(), api.getEstatisticas()])
      .then(([u, c, m, s]) => { setUsuario(u); setConsultas(c); setMeds(m); setStats(s) })
      .catch((e: Error) => setErro(e.message))
  }, [])

  const proxima = useMemo(
    () => consultas.filter((c) => c.status === 'AGENDADA' && c.data >= hojeISO()).sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))[0],
    [consultas],
  )

  const dosesHoje = useMemo(() => {
    const agora = new Date().toTimeString().slice(0, 5)
    return meds
      .filter((m) => m.ativo)
      .flatMap((m) => m.horarios.map((h) => ({ h, m, passou: h < agora })))
      .sort((a, b) => a.h.localeCompare(b.h))
  }, [meds])

  if (erro) return <p role="alert" className="rounded-xl bg-danger/10 p-4 font-semibold text-danger">Não foi possível carregar: {erro}</p>
  if (!usuario || !stats) return <Carregando />

  const primeiroNome = usuario.nome.split(' ')[0]
  const maxMes = Math.max(1, ...stats.consultasPorMes.map((m) => m.total))
  const maxEsp = Math.max(1, ...stats.consultasPorEspecialidade.map((e) => e.total))
  const mediaMes = (stats.consultasPorMes.reduce((s, m) => s + m.total, 0) / stats.consultasPorMes.length).toFixed(1)
  const taxaComparecimento = stats.consultasRealizadas + stats.consultasCanceladas > 0
    ? Math.round((stats.consultasRealizadas / (stats.consultasRealizadas + stats.consultasCanceladas)) * 100)
    : 100

  const resumoFalado = `Olá, ${primeiroNome}. ${
    proxima
      ? `Sua próxima consulta é de ${proxima.especialidade}, ${diaDaSemana(proxima.data)}, ${formatarData(proxima.data, { day: 'numeric', month: 'long' })}, às ${proxima.horario.replace(':', ' e ')}, em ${proxima.local}.`
      : 'Você não tem consultas agendadas.'
  } Hoje você tem ${dosesHoje.length} doses de remédio para tomar.`

  return (
    <>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Olá, {primeiroNome}!</h1>
          <p className="mt-1 text-lg text-muted">Bem-vinda ao seu espaço de saúde.</p>
        </div>
        <BotaoOuvir texto={resumoFalado} rotulo="Ouvir resumo" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard valor={stats.consultasAgendadas} rotulo="Consultas agendadas" icone={<CalendarClock size={24} />} />
        <StatCard valor={stats.consultasRealizadas} rotulo="Consultas realizadas" detalhe="nos registros" icone={<CalendarCheck size={24} />} />
        <StatCard valor={stats.medicamentosAtivos} rotulo="Remédios em uso" icone={<Pill size={24} />} />
        <StatCard valor={stats.dosesPorDia} rotulo="Doses por dia" icone={<Clock size={24} />} />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Próxima consulta */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-ink">Próxima consulta</h2>
            {proxima && <Badge>Agendada</Badge>}
          </div>
          {proxima ? (
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-brand text-white" aria-hidden>
                <div className="text-center leading-none">
                  <p className="text-4xl font-extrabold">{formatarData(proxima.data, { day: '2-digit' })}</p>
                  <p className="mt-1 text-sm font-bold uppercase">{formatarData(proxima.data, { month: 'short' }).replace('.', '')}</p>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold text-ink">{proxima.especialidade}</p>
                {proxima.profissional && <p className="text-lg text-muted">{proxima.profissional}</p>}
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-semibold text-ink">
                  <span className="inline-flex items-center gap-1.5"><Clock size={18} aria-hidden /><span><span>{diaDaSemana(proxima.data)}</span>, {proxima.horario}</span></span>
                  <span className="inline-flex items-center gap-1.5"><MapPin size={18} aria-hidden /> {proxima.local}</span>
                </p>
                {proxima.observacoes && <p className="mt-2 rounded-lg bg-warn-soft px-3 py-1.5 text-warn">{proxima.observacoes}</p>}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-lg text-muted">Nenhuma consulta agendada.</p>
          )}
          <Link to="/consultas" className={btnClass('ghost', 'mt-5 -ml-3')}>Ver minhas consultas <ArrowRight size={18} aria-hidden /></Link>
        </Card>

        {/* Remédios de hoje */}
        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-ink">Remédios de hoje</h2>
          {dosesHoje.length ? (
            <ul className="mt-4 flex flex-col gap-2">
              {dosesHoje.map(({ h, m, passou }) => (
                <li key={m.id + h} className={`flex items-center gap-3 rounded-xl border border-line p-3 ${passou ? 'opacity-60' : ''}`}>
                  <span className="w-14 text-lg font-extrabold text-brand">{h}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink">{m.nome}</span>
                    <span className="block truncate text-sm text-muted">{m.dosagem}</span>
                  </span>
                  {passou && <span className="ml-auto text-sm text-muted">horário passou</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-muted">Nenhum remédio cadastrado.</p>
          )}
          <Link to="/medicamentos" className={btnClass('ghost', 'mt-4 -ml-3')}>Gerenciar remédios <ArrowRight size={18} aria-hidden /></Link>
        </Card>
      </div>

      {/* Indicadores estatísticos */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-ink">Consultas nos últimos 6 meses</h2>
          <p className="text-muted">Consultas agendadas e realizadas (sem canceladas).</p>
          <div className="mt-6 flex h-48 items-end gap-3" role="img" aria-label={`Gráfico: ${stats.consultasPorMes.map((m) => `${m.mes}, ${m.total}`).join('; ')}`}>
            {stats.consultasPorMes.map((m) => (
              <div key={m.mes} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-sm font-extrabold text-ink">{m.total}</span>
                <div className="w-full max-w-14 rounded-t-lg bg-brand" style={{ height: `${Math.max(4, (m.total / maxMes) * 100)}%`, opacity: m.total ? 1 : 0.2 }} />
                <span className="text-sm font-bold capitalize text-muted">{m.mes}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-ink">Consultas por especialidade</h2>
          <p className="text-muted">Onde você mais tem buscado atendimento.</p>
          <ul className="mt-5 flex flex-col gap-3">
            {stats.consultasPorEspecialidade.map((e) => (
              <li key={e.especialidade}>
                <div className="flex justify-between font-bold text-ink"><span>{e.especialidade}</span><span>{e.total}</span></div>
                <div className="mt-1 h-3 rounded-full bg-page" aria-hidden>
                  <div className="h-3 rounded-full bg-brand" style={{ width: `${(e.total / maxEsp) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Interpretação dos dados */}
      <Card className="mt-6 flex gap-4 border-brand/30 bg-soft p-6">
        <Lightbulb size={28} className="shrink-0 text-brand-strong" aria-hidden />
        <div>
          <h2 className="text-xl font-extrabold text-ink">O que esses números mostram</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">
            <li>Média de <strong>{mediaMes} consultas por mês</strong> no período.</li>
            <li><strong>{taxaComparecimento}%</strong> das consultas passadas foram realizadas ({stats.consultasCanceladas} cancelada{stats.consultasCanceladas === 1 ? '' : 's'}).</li>
            <li>{stats.consultasPorEspecialidade[0] ? <>A especialidade mais frequente é <strong>{stats.consultasPorEspecialidade[0].especialidade}</strong>.</> : 'Ainda não há consultas suficientes para análise.'}</li>
            <li>São <strong>{stats.dosesPorDia} doses diárias</strong> de {stats.medicamentosAtivos} remédio{stats.medicamentosAtivos === 1 ? '' : 's'} — vale manter os horários sempre atualizados.</li>
          </ul>
        </div>
      </Card>

      <Card className="mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-white" aria-hidden><IdCard size={24} /></span>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-ink">Minha carteirinha digital</h2>
          <p className="text-muted">Acesse seus dados essenciais e o QR Code para emergências.</p>
        </div>
        <Link to="/carteirinha" className={btnClass('primary')}>Visualizar carteirinha</Link>
      </Card>
    </>
  )
}
