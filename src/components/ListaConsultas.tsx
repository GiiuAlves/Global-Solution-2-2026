import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2, MapPin, Clock, X } from 'lucide-react'
import { api } from '../services/api'
import type { Consulta, NovaConsulta, StatusConsulta } from '../types'
import { Aviso, Badge, BotaoOuvir, Button, Card, Carregando, Field, ResumoErros, aria, campoClass, formatarData, diaDaSemana, hojeISO } from './ui'
import { useConfirm } from './ConfirmDialog'
import { LembreteConsulta } from './Lembretes'
import { erroDataConsulta, erroObrigatorio, focarPrimeiroErro, type Erros } from '../services/validacao'

const VAZIA: NovaConsulta = { especialidade: '', profissional: '', local: '', data: '', horario: '', status: 'AGENDADA', observacoes: '' }
const ESPECIALIDADES = ['Clínico geral', 'Cardiologia', 'Endocrinologia', 'Oftalmologia', 'Ortopedia', 'Dermatologia', 'Geriatria', 'Neurologia', 'Exame de sangue', 'Fisioterapia', 'Retorno']
export const STATUS_CONSULTA: Record<StatusConsulta, { rotulo: string; tom: 'brand' | 'muted' | 'danger' }> = {
  AGENDADA: { rotulo: 'Agendada', tom: 'brand' },
  REALIZADA: { rotulo: 'Realizada', tom: 'muted' },
  CANCELADA: { rotulo: 'Cancelada', tom: 'danger' },
}

/**
 * Lista de consultas de um paciente.
 * editavel = true  → profissional vinculado: cadastrar, editar, cancelar, excluir.
 * editavel = false → paciente: só vê, ouve e coloca na agenda do celular.
 */
export function ListaConsultas({ pacienteId, editavel, onMudou }: { pacienteId: number; editavel: boolean; onMudou?: () => void }) {
  const [lista, setLista] = useState<Consulta[]>()
  const [form, setForm] = useState<NovaConsulta>(VAZIA)
  const [editando, setEditando] = useState<number | null>(null)
  const [aberto, setAberto] = useState(false)
  const [aviso, setAviso] = useState({ texto: '', tom: 'ok' as 'ok' | 'erro' })
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Erros>({})
  const formRef = useRef<HTMLFormElement>(null)
  const topoRef = useRef<HTMLDivElement>(null)
  const confirmar = useConfirm()

  const carregar = () => api.listarConsultas(pacienteId).then(setLista).catch((e: Error) => setAviso({ texto: e.message, tom: 'erro' }))
  useEffect(() => { carregar() }, [pacienteId]) // eslint-disable-line react-hooks/exhaustive-deps
  const mudou = () => { carregar(); onMudou?.() }

  const hoje = hojeISO()
  const ordenar = (a: Consulta, b: Consulta) => (a.data + a.horario).localeCompare(b.data + b.horario)
  const proximas = useMemo(() => (lista ?? []).filter((c) => c.status === 'AGENDADA' && c.data >= hoje).sort(ordenar), [lista, hoje])
  const historico = useMemo(() => (lista ?? []).filter((c) => !(c.status === 'AGENDADA' && c.data >= hoje)).sort((a, b) => ordenar(b, a)), [lista, hoje])

  function abrirNova() {
    setForm(VAZIA); setEditando(null); setAberto(true); setErros({})
    setTimeout(() => document.getElementById('c-especialidade')?.focus(), 0)
  }
  function abrirEdicao(c: Consulta) {
    const { id: _id, pacienteId: _p, ...resto } = c
    setForm({ ...VAZIA, ...resto }); setEditando(c.id); setAberto(true); setErros({})
    topoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => document.getElementById('c-especialidade')?.focus({ preventScroll: true }), 0)
  }
  function fechar() { setAberto(false); setEditando(null); setErros({}) }

  function validar(f: NovaConsulta): Erros {
    return {
      especialidade: erroObrigatorio(f.especialidade, 'a especialidade ou exame'),
      local: erroObrigatorio(f.local, 'o local'),
      data: erroDataConsulta(f.data, f.horario, f.status),
      horario: f.horario ? '' : 'Escolha o horário.',
    }
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const novos = validar(form)
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return focarPrimeiroErro(formRef.current)
    const limpo = { ...form, especialidade: form.especialidade.trim(), local: form.local.trim(), profissional: form.profissional?.trim(), observacoes: form.observacoes?.trim() }
    setSalvando(true)
    try {
      if (editando) {
        await api.atualizarConsulta({ ...lista!.find((x) => x.id === editando)!, ...limpo })
        setAviso({ texto: 'Consulta atualizada. O paciente já vê a mudança.', tom: 'ok' })
      } else {
        await api.criarConsulta(pacienteId, limpo)
        setAviso({ texto: 'Consulta cadastrada. O paciente já vê no aplicativo.', tom: 'ok' })
      }
      fechar(); mudou()
    } catch (err) {
      setAviso({ texto: (err as Error).message, tom: 'erro' })
    } finally {
      setSalvando(false)
    }
  }

  async function mudarStatus(c: Consulta, status: StatusConsulta) {
    if (status === 'CANCELADA') {
      const ok = await confirmar({
        titulo: 'Cancelar consulta?',
        mensagem: `A consulta de ${c.especialidade} em ${formatarData(c.data)} ficará marcada como cancelada no histórico.`,
        confirmar: 'Cancelar consulta',
        cancelar: 'Manter agendada',
        perigo: true,
      })
      if (!ok) return
    }
    await api.atualizarConsulta({ ...c, status })
    setAviso({ texto: `Consulta marcada como ${STATUS_CONSULTA[status].rotulo.toLowerCase()}.`, tom: 'ok' })
    mudou()
  }
  async function excluir(c: Consulta) {
    const ok = await confirmar({
      titulo: 'Excluir consulta?',
      mensagem: `A consulta de ${c.especialidade} em ${formatarData(c.data)} será apagada. Isso não pode ser desfeito.`,
      confirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    await api.excluirConsulta(c)
    setAviso({ texto: 'Consulta excluída.', tom: 'ok' })
    mudou()
  }

  const set = <K extends keyof NovaConsulta>(k: K, v: NovaConsulta[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (erros[k as string] || ((k === 'horario' || k === 'status') && erros.data)) setErros((e) => ({ ...e, [k]: '', data: k === 'horario' || k === 'status' ? '' : e.data }))
  }

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
            {c.status === 'AGENDADA' && c.data < hoje
              ? <Badge tom="warn">{editavel ? 'Já passou — atualize a situação' : 'Data já passou'}</Badge>
              : <Badge tom={STATUS_CONSULTA[c.status].tom}>{STATUS_CONSULTA[c.status].rotulo}</Badge>}
          </div>
          {c.profissional && <p className="text-muted">{c.profissional}</p>}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-semibold text-ink">
            <span className="inline-flex items-center gap-1.5"><Clock size={18} aria-hidden /><span>{diaDaSemana(c.data)}, {formatarData(c.data, { day: 'numeric', month: 'long', year: 'numeric' })} às {c.horario}</span></span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={18} aria-hidden />{c.local}</span>
          </p>
          {c.observacoes && <p className="mt-2 text-muted">📝 {c.observacoes}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <BotaoOuvir texto={`Consulta de ${c.especialidade}, ${diaDaSemana(c.data)}, ${formatarData(c.data, { day: 'numeric', month: 'long' })}, às ${c.horario}, em ${c.local}. ${c.observacoes ?? ''}`} />
        {!editavel && c.data >= hoje && <LembreteConsulta c={c} />}
        {editavel && (
          <>
            {c.status === 'AGENDADA' && (
              <Button variant="secondary" className="!min-h-10" onClick={() => mudarStatus(c, 'REALIZADA')}><CheckCircle2 size={18} aria-hidden /> Marcar como realizada</Button>
            )}
            <Button variant="secondary" className="!min-h-10" onClick={() => abrirEdicao(c)} aria-label={`Editar consulta de ${c.especialidade}`}><Pencil size={18} aria-hidden /> Editar</Button>
            {c.status === 'AGENDADA' && (
              <Button variant="secondary" className="!min-h-10" onClick={() => mudarStatus(c, 'CANCELADA')}>Cancelar consulta</Button>
            )}
            <Button variant="danger" className="!min-h-10" onClick={() => excluir(c)} aria-label={`Excluir consulta de ${c.especialidade}`}><Trash2 size={18} aria-hidden /> Excluir</Button>
          </>
        )}
      </div>
    </Card>
  )

  return (
    <div ref={topoRef} className="scroll-mt-24">
      {editavel && !aberto && (
        <div className="mb-5"><Button onClick={abrirNova}><Plus size={20} aria-hidden /> Nova consulta</Button></div>
      )}
      <Aviso texto={aviso.texto} tom={aviso.tom} />

      {aberto && (
        <Card className="mb-8 border-brand/40 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-ink">{editando ? 'Editar consulta' : 'Nova consulta'}</h2>
            <Button variant="ghost" onClick={fechar} aria-label="Fechar formulário"><X size={22} aria-hidden /></Button>
          </div>
          <form ref={formRef} onSubmit={salvar} noValidate className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><ResumoErros quantidade={Object.values(erros).filter(Boolean).length} /></div>
            <Field id="c-especialidade" label="Especialidade ou exame" obrigatorio erro={erros.especialidade} dica="Escolha da lista ou escreva.">
              <input {...aria('c-especialidade', erros.especialidade, true)} list="especialidades" className={campoClass(erros.especialidade)} value={form.especialidade} onChange={(e) => set('especialidade', e.target.value)} placeholder="Ex.: Cardiologia" />
              <datalist id="especialidades">{ESPECIALIDADES.map((e) => <option key={e} value={e} />)}</datalist>
            </Field>
            <Field id="c-profissional" label="Profissional que vai atender">
              <input id="c-profissional" className={campoClass()} value={form.profissional ?? ''} onChange={(e) => set('profissional', e.target.value)} placeholder="Ex.: Dra. Helena Costa" />
            </Field>
            <Field id="c-local" label="Local" obrigatorio erro={erros.local}>
              <input {...aria('c-local', erros.local)} className={campoClass(erros.local)} value={form.local} onChange={(e) => set('local', e.target.value)} placeholder="Ex.: UBS Vila Mariana" />
            </Field>
            <Field id="c-status" label="Situação">
              <select id="c-status" className={campoClass()} value={form.status} onChange={(e) => set('status', e.target.value as StatusConsulta)}>
                {Object.entries(STATUS_CONSULTA).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
              </select>
            </Field>
            <Field id="c-data" label="Data" obrigatorio erro={erros.data}>
              <input {...aria('c-data', erros.data)} type="date" className={campoClass(erros.data)} value={form.data} onChange={(e) => set('data', e.target.value)} />
            </Field>
            <Field id="c-horario" label="Horário" obrigatorio erro={erros.horario}>
              <input {...aria('c-horario', erros.horario)} type="time" className={campoClass(erros.horario)} value={form.horario} onChange={(e) => set('horario', e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field id="c-obs" label="Orientações para o paciente" dica="Ex.: levar exames, jejum, acompanhante.">
                <textarea {...aria('c-obs', undefined, true)} rows={2} maxLength={300} className={campoClass(undefined, 'py-3')} value={form.observacoes ?? ''} onChange={(e) => set('observacoes', e.target.value)} />
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
    </div>
  )
}
