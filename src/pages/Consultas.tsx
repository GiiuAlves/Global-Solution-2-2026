import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2, MapPin, Clock, X } from 'lucide-react'
import { api } from '../services/api'
import type { Consulta, NovaConsulta, StatusConsulta } from '../types'
import { Aviso, Badge, BotaoOuvir, Button, Card, Carregando, Field, PageHeader, formatarData, diaDaSemana, hojeISO, inputClass } from '../components/ui'

const VAZIA: NovaConsulta = { especialidade: '', profissional: '', local: '', data: '', horario: '', status: 'AGENDADA', observacoes: '' }
const ESPECIALIDADES = ['Clínico geral', 'Cardiologia', 'Oftalmologia', 'Ortopedia', 'Dermatologia', 'Geriatria', 'Neurologia', 'Exame de sangue', 'Fisioterapia']
const STATUS: Record<StatusConsulta, { rotulo: string; tom: 'brand' | 'muted' | 'danger' }> = {
  AGENDADA: { rotulo: 'Agendada', tom: 'brand' },
  REALIZADA: { rotulo: 'Realizada', tom: 'muted' },
  CANCELADA: { rotulo: 'Cancelada', tom: 'danger' },
}

export default function Consultas() {
  const [lista, setLista] = useState<Consulta[]>()
  const [form, setForm] = useState<NovaConsulta>(VAZIA)
  const [editando, setEditando] = useState<number | null>(null)
  const [aberto, setAberto] = useState(false)
  const [aviso, setAviso] = useState({ texto: '', tom: 'ok' as 'ok' | 'erro' })
  const [salvando, setSalvando] = useState(false)

  const carregar = () => api.listarConsultas().then(setLista).catch((e: Error) => setAviso({ texto: e.message, tom: 'erro' }))
  useEffect(() => { carregar() }, [])

  const hoje = hojeISO()
  const ordenar = (a: Consulta, b: Consulta) => (a.data + a.horario).localeCompare(b.data + b.horario)
  const proximas = useMemo(() => (lista ?? []).filter((c) => c.status === 'AGENDADA' && c.data >= hoje).sort(ordenar), [lista, hoje])
  const historico = useMemo(() => (lista ?? []).filter((c) => !(c.status === 'AGENDADA' && c.data >= hoje)).sort((a, b) => ordenar(b, a)), [lista, hoje])

  function abrirNova() {
    setForm(VAZIA); setEditando(null); setAberto(true)
    setTimeout(() => document.getElementById('c-especialidade')?.focus(), 0)
  }
  function abrirEdicao(c: Consulta) {
    const { id: _id, usuarioId: _u, ...resto } = c
    setForm({ ...VAZIA, ...resto }); setEditando(c.id); setAberto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => document.getElementById('c-especialidade')?.focus(), 0)
  }
  function fechar() { setAberto(false); setEditando(null) }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) {
        await api.atualizarConsulta({ ...form, id: editando, usuarioId: 1 })
        setAviso({ texto: 'Consulta atualizada com sucesso.', tom: 'ok' })
      } else {
        await api.criarConsulta(form)
        setAviso({ texto: 'Consulta cadastrada com sucesso.', tom: 'ok' })
      }
      fechar(); carregar()
    } catch (err) {
      setAviso({ texto: (err as Error).message, tom: 'erro' })
    } finally {
      setSalvando(false)
    }
  }

  async function mudarStatus(c: Consulta, status: StatusConsulta) {
    await api.atualizarConsulta({ ...c, status })
    setAviso({ texto: `Consulta marcada como ${STATUS[status].rotulo.toLowerCase()}.`, tom: 'ok' })
    carregar()
  }
  async function excluir(c: Consulta) {
    if (!window.confirm(`Excluir a consulta de ${c.especialidade} em ${formatarData(c.data)}?`)) return
    await api.excluirConsulta(c.id)
    setAviso({ texto: 'Consulta excluída.', tom: 'ok' })
    carregar()
  }

  const set = <K extends keyof NovaConsulta>(k: K, v: NovaConsulta[K]) => setForm((f) => ({ ...f, [k]: v }))

  const item = (c: Consulta) => (
    <Card as="li" key={c.id} className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-soft text-brand-strong" aria-hidden>
          <div className="text-center leading-none">
            <p className="text-3xl font-extrabold">{formatarData(c.data, { day: '2-digit' })}</p>
            <p className="mt-1 text-sm font-bold uppercase">{formatarData(c.data, { month: 'short' }).replace('.', '')}</p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold text-ink">{c.especialidade}</h3>
            <Badge tom={STATUS[c.status].tom}>{STATUS[c.status].rotulo}</Badge>
          </div>
          {c.profissional && <p className="text-muted">{c.profissional}</p>}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-semibold text-ink">
            <span className="inline-flex items-center gap-1.5"><Clock size={18} aria-hidden /><span><span>{diaDaSemana(c.data)}</span>, {formatarData(c.data, { day: 'numeric', month: 'long', year: 'numeric' })} às {c.horario}</span></span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={18} aria-hidden />{c.local}</span>
          </p>
          {c.observacoes && <p className="mt-2 text-muted">📝 {c.observacoes}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <BotaoOuvir texto={`Consulta de ${c.especialidade}, ${diaDaSemana(c.data)}, ${formatarData(c.data, { day: 'numeric', month: 'long' })}, às ${c.horario}, em ${c.local}. ${c.observacoes ?? ''}`} />
        {c.status === 'AGENDADA' && (
          <Button variant="secondary" className="!min-h-10" onClick={() => mudarStatus(c, 'REALIZADA')}><CheckCircle2 size={18} aria-hidden /> Marcar como realizada</Button>
        )}
        <Button variant="secondary" className="!min-h-10" onClick={() => abrirEdicao(c)} aria-label={`Editar consulta de ${c.especialidade}`}><Pencil size={18} aria-hidden /> Editar</Button>
        {c.status === 'AGENDADA' && (
          <Button variant="secondary" className="!min-h-10" onClick={() => mudarStatus(c, 'CANCELADA')}>Cancelar consulta</Button>
        )}
        <Button variant="danger" className="!min-h-10" onClick={() => excluir(c)} aria-label={`Excluir consulta de ${c.especialidade}`}><Trash2 size={18} aria-hidden /> Excluir</Button>
      </div>
    </Card>
  )

  return (
    <>
      <PageHeader
        titulo="Minhas consultas"
        descricao="Cadastre e acompanhe suas consultas e exames."
        acao={!aberto && <Button onClick={abrirNova}><Plus size={20} aria-hidden /> Nova consulta</Button>}
      />
      <Aviso texto={aviso.texto} tom={aviso.tom} />

      {aberto && (
        <Card className="mb-8 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-ink">{editando ? 'Editar consulta' : 'Nova consulta'}</h2>
            <Button variant="ghost" onClick={fechar} aria-label="Fechar formulário"><X size={22} aria-hidden /></Button>
          </div>
          <form onSubmit={salvar} className="grid gap-5 sm:grid-cols-2">
            <Field id="c-especialidade" label="Especialidade ou exame" obrigatorio>
              <input id="c-especialidade" list="especialidades" required className={inputClass} value={form.especialidade} onChange={(e) => set('especialidade', e.target.value)} placeholder="Ex.: Cardiologia" />
              <datalist id="especialidades">{ESPECIALIDADES.map((e) => <option key={e} value={e} />)}</datalist>
            </Field>
            <Field id="c-profissional" label="Profissional">
              <input id="c-profissional" className={inputClass} value={form.profissional ?? ''} onChange={(e) => set('profissional', e.target.value)} placeholder="Ex.: Dra. Helena" />
            </Field>
            <Field id="c-local" label="Local" obrigatorio>
              <input id="c-local" required className={inputClass} value={form.local} onChange={(e) => set('local', e.target.value)} placeholder="Ex.: UBS Vila Mariana" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="c-data" label="Data" obrigatorio>
                <input id="c-data" type="date" required className={inputClass} value={form.data} onChange={(e) => set('data', e.target.value)} />
              </Field>
              <Field id="c-horario" label="Horário" obrigatorio>
                <input id="c-horario" type="time" required className={inputClass} value={form.horario} onChange={(e) => set('horario', e.target.value)} />
              </Field>
            </div>
            {editando && (
              <Field id="c-status" label="Situação">
                <select id="c-status" className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value as StatusConsulta)}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
                </select>
              </Field>
            )}
            <div className="sm:col-span-2">
              <Field id="c-obs" label="Observações" dica="Ex.: levar exames, jejum, acompanhante.">
                <textarea id="c-obs" rows={2} className={`${inputClass} py-3`} value={form.observacoes ?? ''} onChange={(e) => set('observacoes', e.target.value)} aria-describedby="c-obs-dica" />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar consulta'}</Button>
              <Button variant="secondary" onClick={fechar}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {!lista ? <Carregando /> : (
        <>
          <section aria-labelledby="t-proximas">
            <h2 id="t-proximas" className="mb-3 text-xl font-extrabold text-ink">Próximas ({proximas.length})</h2>
            {proximas.length ? <ul className="flex flex-col gap-4">{proximas.map(item)}</ul> : <p className="rounded-2xl border-2 border-dashed border-line p-8 text-center text-lg text-muted">Nenhuma consulta agendada.</p>}
          </section>
          <section aria-labelledby="t-hist" className="mt-10">
            <h2 id="t-hist" className="mb-3 text-xl font-extrabold text-ink">Histórico ({historico.length})</h2>
            {historico.length ? <ul className="flex flex-col gap-4">{historico.map(item)}</ul> : <p className="text-muted">Sem histórico ainda.</p>}
          </section>
        </>
      )}
    </>
  )
}
