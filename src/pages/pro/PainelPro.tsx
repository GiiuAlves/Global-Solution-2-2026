import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, CalendarClock, ChevronRight, QrCode, Search, Target, UserPlus, Users, PartyPopper } from 'lucide-react'
import { api, idade } from '../../services/api'
import type { ResumoPaciente } from '../../types'
import { Badge, Card, Carregando, btnClass, formatarData, hojeISO, inputClass } from '../../components/ui'
import { StatCard } from '../../components/StatCard'
import { META_ADESAO, leituraAdesao } from '../../components/Indicadores'
import { useProfissional } from '../../context/AuthContext'
import { soDigitos } from '../../services/validacao'

type Filtro = 'todos' | 'atencao'

const precisaAtencao = (r: ResumoPaciente) => (r.adesaoPercentual7Dias !== null && r.adesaoPercentual7Dias < META_ADESAO) || r.dosesHoje.atrasadas > 0

export default function PainelPro() {
  const pro = useProfissional()
  const boasVindas = (useLocation().state as { boasVindas?: boolean } | null)?.boasVindas
  const [lista, setLista] = useState<ResumoPaciente[]>()
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  useEffect(() => { api.listarPacientes().then(setLista).catch((e: Error) => setErro(e.message)) }, [])

  const hoje = hojeISO()
  const em7 = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 7); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }, [])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const qd = soDigitos(busca)
    return (lista ?? [])
      .filter((r) => !q || r.paciente.nome.toLowerCase().includes(q) || (qd.length >= 3 && soDigitos(r.paciente.cpf).includes(qd)))
      .filter((r) => filtro === 'todos' || precisaAtencao(r))
      .sort((a, b) => Number(precisaAtencao(b)) - Number(precisaAtencao(a)) || (a.adesaoPercentual7Dias ?? 101) - (b.adesaoPercentual7Dias ?? 101))
  }, [lista, busca, filtro])

  if (erro) return <p role="alert" className="rounded-xl bg-danger/10 p-4 font-semibold text-danger">{erro}</p>
  if (!lista) return <Carregando />

  const comAdesao = lista.filter((r) => r.adesaoPercentual7Dias !== null)
  const media = comAdesao.length ? Math.round(comAdesao.reduce((s, r) => s + r.adesaoPercentual7Dias!, 0) / comAdesao.length) : null
  const atencao = lista.filter(precisaAtencao).length
  const consultas7 = lista.filter((r) => r.proximaConsulta && r.proximaConsulta.data <= em7).length
  const titulo = pro.nome.split(' ').slice(0, 2).join(' ')

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Olá, {titulo}</h1>
          <p className="mt-1 text-lg text-muted">{pro.especialidade} · {pro.conselho}{pro.instituicao ? ` · ${pro.instituicao}` : ''}</p>
        </div>
        <Link to="/pro/novo" className={btnClass('primary', '!min-h-14 !px-6 text-lg')}><UserPlus size={22} aria-hidden /> Cadastrar paciente</Link>
      </header>

      {boasVindas && (
        <Card className="mb-6 border-brand/40 bg-soft p-6">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink"><PartyPopper size={26} className="text-brand" aria-hidden /> Conta criada!</h2>
          <p className="mt-1 text-lg text-ink">Comece cadastrando seu primeiro paciente. Ao final, o sistema gera a senha de acesso para você entregar a ele.</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard valor={lista.length} rotulo="Pacientes" detalhe="vinculados a você" icone={<Users size={24} />} />
        <StatCard valor={media === null ? '—' : `${media}%`} rotulo="Adesão média" detalhe="últimos 7 dias" icone={<Target size={24} />} />
        <StatCard valor={atencao} rotulo="Precisam de atenção" detalhe={`adesão < ${META_ADESAO}% ou dose atrasada`} icone={<AlertTriangle size={24} />} />
        <StatCard valor={consultas7} rotulo="Consultas na semana" detalhe="próximos 7 dias" icone={<CalendarClock size={24} />} />
      </div>

      <Card className="mt-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-extrabold text-ink">Meus pacientes</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-72">
              <Search size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <label htmlFor="busca" className="sr-only">Buscar por nome ou CPF</label>
              <input id="busca" type="search" className={`${inputClass} pl-11`} placeholder="Buscar por nome ou CPF" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div role="group" aria-label="Filtrar" className="flex rounded-xl border-2 border-line p-1">
              {(['todos', 'atencao'] as Filtro[]).map((f) => (
                <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)} className={`min-h-10 flex-1 whitespace-nowrap rounded-lg px-3 font-bold ${filtro === f ? 'bg-brand text-white' : 'text-ink hover:bg-soft'}`}>
                  {f === 'todos' ? `Todos (${lista.length})` : `Atenção (${atencao})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {lista.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-line p-10 text-center">
            <p className="text-lg text-muted">Nenhum paciente ainda.</p>
            <Link to="/pro/novo" className={btnClass('primary', 'mt-4')}><UserPlus size={20} aria-hidden /> Cadastrar o primeiro</Link>
          </div>
        ) : filtrados.length === 0 ? (
          <p className="mt-6 text-center text-lg text-muted" role="status">Nenhum paciente encontrado.</p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {filtrados.map((r) => {
              const a = leituraAdesao(r.adesaoPercentual7Dias)
              const pct = r.adesaoPercentual7Dias
              return (
                <li key={r.paciente.id}>
                  <Link to={`/pro/paciente/${r.paciente.id}`} className="group grid gap-4 rounded-2xl border-2 border-line p-4 transition-colors hover:border-brand md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto] md:items-center">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-soft text-lg font-extrabold text-brand-strong" aria-hidden>
                        {r.paciente.nome.split(' ').filter((_, i, arr) => i === 0 || i === arr.length - 1).map((n) => n[0]).join('')}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-lg font-extrabold text-ink">{r.paciente.nome}</span>
                        <span className="block text-sm text-muted">{idade(r.paciente.dataNascimento)} anos · CPF {r.paciente.cpf}</span>
                        {r.paciente.necessidadesAcessibilidade.length > 0 && (
                          <span className="mt-1 block truncate text-sm font-bold text-brand-strong">♿ {r.paciente.necessidadesAcessibilidade.join(' · ')}</span>
                        )}
                      </span>
                    </span>

                    <span className="flex flex-col gap-1.5">
                      <span className="flex items-center justify-between gap-2 text-sm font-bold text-muted">
                        Adesão 7 dias <Badge tom={a.tom}>{pct === null ? '—' : `${pct}%`}</Badge>
                      </span>
                      <span className="h-2.5 rounded-full bg-page" aria-hidden>
                        <span className={`block h-2.5 rounded-full ${pct === null ? '' : pct >= META_ADESAO ? 'bg-brand' : pct >= 50 ? 'bg-[#d79b1c]' : 'bg-danger'}`} style={{ width: `${pct ?? 0}%` }} />
                      </span>
                      <span className="text-sm text-muted">
                        Hoje: {r.dosesHoje.tomadas}/{r.dosesHoje.total} doses
                        {r.dosesHoje.atrasadas > 0 && <strong className="text-warn"> · {r.dosesHoje.atrasadas} atrasada{r.dosesHoje.atrasadas > 1 ? 's' : ''}</strong>}
                      </span>
                    </span>

                    <span className="text-sm">
                      <span className="block font-bold text-muted">Próxima consulta</span>
                      {r.proximaConsulta ? (
                        <span className="block font-bold text-ink">
                          {r.proximaConsulta.data === hoje ? 'Hoje' : formatarData(r.proximaConsulta.data, { day: '2-digit', month: 'short' }).replace('.', '')} · {r.proximaConsulta.horario} — {r.proximaConsulta.especialidade}
                        </span>
                      ) : <span className="block text-muted">Nenhuma agendada</span>}
                    </span>

                    <span className="inline-flex items-center gap-1 justify-self-start font-extrabold text-brand md:justify-self-end">
                      Abrir ficha <ChevronRight size={20} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card className="mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink text-white" aria-hidden><QrCode size={24} /></span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-ink">Paciente chegou com a carteirinha?</h2>
          <p className="text-muted">Aponte a câmera do celular para o QR Code. Com você logado neste aparelho, abre a ficha técnica completa — e você pode vincular o paciente à sua lista.</p>
        </div>
      </Card>
    </>
  )
}
