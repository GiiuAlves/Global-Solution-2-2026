import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, Clock, Pill, PauseCircle, PlayCircle, AlertCircle, Stethoscope } from 'lucide-react'
import { api } from '../services/api'
import type { Medicamento, NovoMedicamento } from '../types'
import { Aviso, Badge, BotaoOuvir, Button, Card, Carregando, Field, ResumoErros, aria, campoClass } from './ui'
import { useConfirm } from './ConfirmDialog'
import { LembreteRemedio, LembreteTodosRemedios } from './Lembretes'
import { erroObrigatorio, focarPrimeiroErro, type Erros } from '../services/validacao'

const VAZIO: NovoMedicamento = { nome: '', dosagem: '', horarios: ['08:00'], ativo: true, observacoes: '' }

function validar(f: NovoMedicamento): Erros {
  const preenchidos = f.horarios.filter(Boolean)
  const repetido = preenchidos.find((h, i) => preenchidos.indexOf(h) !== i)
  return {
    nome: erroObrigatorio(f.nome, 'o nome do remédio'),
    dosagem: erroObrigatorio(f.dosagem, 'a dose'),
    horarios: !preenchidos.length
      ? 'Informe pelo menos um horário.'
      : preenchidos.length < f.horarios.length
        ? 'Há um horário em branco. Preencha ou remova.'
        : repetido
          ? `O horário ${repetido} está repetido.`
          : '',
  }
}

/**
 * Prescrição do paciente.
 * editavel = true  → profissional vinculado: prescrever, ajustar dose/horários, suspender, excluir.
 * editavel = false → paciente: só vê, ouve e cria alarmes no celular.
 */
export function ListaMedicamentos({ pacienteId, editavel, onMudou }: { pacienteId: number; editavel: boolean; onMudou?: () => void }) {
  const [lista, setLista] = useState<Medicamento[]>()
  const [form, setForm] = useState<NovoMedicamento>(VAZIO)
  const [editando, setEditando] = useState<number | null>(null)
  const [aberto, setAberto] = useState(false)
  const [aviso, setAviso] = useState({ texto: '', tom: 'ok' as 'ok' | 'erro' })
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const topoRef = useRef<HTMLDivElement>(null)
  const confirmar = useConfirm()

  const carregar = () => api.listarMedicamentos(pacienteId).then(setLista).catch((e: Error) => setAviso({ texto: e.message, tom: 'erro' }))
  useEffect(() => { carregar() }, [pacienteId]) // eslint-disable-line react-hooks/exhaustive-deps
  const mudou = () => { carregar(); onMudou?.() }

  function abrir(m?: Medicamento) {
    if (m) {
      setForm({ nome: m.nome, dosagem: m.dosagem, horarios: [...m.horarios], ativo: m.ativo, observacoes: m.observacoes ?? '' })
      setEditando(m.id)
      topoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      setForm({ ...VAZIO, horarios: ['08:00'] }); setEditando(null)
    }
    setErros({})
    setAberto(true)
    setTimeout(() => document.getElementById('m-nome')?.focus({ preventScroll: true }), 0)
  }
  const fechar = () => { setAberto(false); setEditando(null); setErros({}) }

  const atualizar = (parcial: Partial<NovoMedicamento>) => {
    setForm((f) => ({ ...f, ...parcial }))
    const chaves = Object.keys(parcial)
    if (chaves.some((k) => erros[k])) setErros((e) => ({ ...e, ...Object.fromEntries(chaves.map((k) => [k, ''])) }))
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const novos = validar(form)
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return focarPrimeiroErro(formRef.current)
    const limpo = { ...form, nome: form.nome.trim(), dosagem: form.dosagem.trim(), observacoes: form.observacoes?.trim(), horarios: [...form.horarios].sort() }
    setSalvando(true)
    try {
      if (editando) await api.atualizarMedicamento({ ...lista!.find((x) => x.id === editando)!, ...limpo })
      else await api.criarMedicamento(pacienteId, limpo)
      setAviso({ texto: editando ? 'Prescrição atualizada. O paciente já vê a mudança.' : 'Remédio prescrito. Já aparece para o paciente.', tom: 'ok' })
      fechar(); mudou()
    } catch (err) {
      setAviso({ texto: (err as Error).message, tom: 'erro' })
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(m: Medicamento) {
    await api.atualizarMedicamento({ ...m, ativo: !m.ativo })
    setAviso({ texto: m.ativo ? `${m.nome} suspenso. Não aparece mais nos remédios do dia do paciente.` : `${m.nome} voltou a ficar em uso.`, tom: 'ok' })
    mudou()
  }
  async function excluir(m: Medicamento) {
    const ok = await confirmar({
      titulo: `Excluir ${m.nome}?`,
      mensagem: 'O remédio e o histórico de doses confirmadas serão apagados. Para interromper por um tempo, use "Suspender".',
      confirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    await api.excluirMedicamento(m)
    setAviso({ texto: 'Remédio excluído da prescrição.', tom: 'ok' })
    mudou()
  }

  const setHorario = (i: number, v: string) => atualizar({ horarios: form.horarios.map((h, j) => (j === i ? v : h)) })

  return (
    <div ref={topoRef} className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap gap-3">
        {editavel && !aberto && <Button onClick={() => abrir()}><Plus size={20} aria-hidden /> Prescrever remédio</Button>}
        {!editavel && lista && <LembreteTodosRemedios meds={lista} />}
      </div>
      <Aviso texto={aviso.texto} tom={aviso.tom} />

      {aberto && (
        <Card className="mb-8 border-brand/40 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-ink">{editando ? 'Ajustar prescrição' : 'Prescrever remédio'}</h2>
            <Button variant="ghost" onClick={fechar} aria-label="Fechar formulário"><X size={22} aria-hidden /></Button>
          </div>
          <form ref={formRef} onSubmit={salvar} noValidate className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><ResumoErros quantidade={Object.values(erros).filter(Boolean).length} /></div>
            <Field id="m-nome" label="Nome do remédio" obrigatorio erro={erros.nome}>
              <input {...aria('m-nome', erros.nome)} className={campoClass(erros.nome)} value={form.nome} onChange={(e) => atualizar({ nome: e.target.value })} placeholder="Ex.: Losartana" />
            </Field>
            <Field id="m-dosagem" label="Dose" obrigatorio erro={erros.dosagem} dica="Escreva como o paciente vai entender. Ex.: 50 mg — 1 comprimido.">
              <input {...aria('m-dosagem', erros.dosagem, true)} className={campoClass(erros.dosagem)} value={form.dosagem} onChange={(e) => atualizar({ dosagem: e.target.value })} />
            </Field>
            <fieldset className="sm:col-span-2" aria-describedby={erros.horarios ? 'm-horarios-erro' : undefined}>
              <legend className="mb-1.5 font-bold text-ink">Horários <span className="text-danger" aria-hidden>*</span><span className="sr-only">(obrigatório)</span></legend>
              <div className="flex flex-wrap items-center gap-3">
                {form.horarios.map((h, i) => {
                  const ruim = !!erros.horarios && (!h || form.horarios.indexOf(h) !== i)
                  return (
                    <div key={i} className="flex items-center gap-1">
                      <input type="time" aria-label={`Horário ${i + 1}`} aria-invalid={ruim || undefined} className={campoClass(ruim ? 'x' : undefined, 'w-36')} value={h} onChange={(e) => setHorario(i, e.target.value)} />
                      {form.horarios.length > 1 && (
                        <Button variant="ghost" className="!min-h-11 !px-2" aria-label={`Remover horário ${i + 1}`} onClick={() => atualizar({ horarios: form.horarios.filter((_, j) => j !== i) })}>
                          <X size={18} aria-hidden />
                        </Button>
                      )}
                    </div>
                  )
                })}
                {form.horarios.length < 6 && (
                  <Button variant="secondary" onClick={() => { atualizar({ horarios: [...form.horarios, ''] }); setTimeout(() => formRef.current?.querySelectorAll<HTMLInputElement>('input[type=time]')[form.horarios.length]?.focus(), 0) }}>
                    <Plus size={18} aria-hidden /> Horário
                  </Button>
                )}
              </div>
              {erros.horarios && (
                <p id="m-horarios-erro" className="mt-1.5 flex items-start gap-1.5 text-sm font-bold text-danger">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> {erros.horarios}
                </p>
              )}
            </fieldset>
            <div className="sm:col-span-2">
              <Field id="m-obs" label="Orientações" dica="Ex.: tomar após o almoço, em jejum.">
                <input {...aria('m-obs', undefined, true)} maxLength={200} className={campoClass()} value={form.observacoes ?? ''} onChange={(e) => atualizar({ observacoes: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : editando ? 'Salvar prescrição' : 'Prescrever'}</Button>
              <Button variant="secondary" onClick={fechar}>Cancelar</Button>
            </div>
            <p className="text-sm text-muted sm:col-span-2">A prescrição fica assinada com seu nome e registro, e a alteração entra no histórico da ficha.</p>
          </form>
        </Card>
      )}

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-line p-10 text-center text-lg text-muted">
          {editavel ? 'Nenhum remédio prescrito ainda.' : 'Nenhum remédio cadastrado pelo seu profissional de saúde.'}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {[...lista].sort((a, b) => Number(b.ativo) - Number(a.ativo)).map((m) => (
            <Card as="li" key={m.id} className={`flex flex-col p-5 ${m.ativo ? '' : 'opacity-70'}`}>
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-soft text-brand" aria-hidden><Pill size={24} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-extrabold text-ink">{m.nome}</h3>
                    <Badge tom={m.ativo ? 'brand' : 'muted'}>{m.ativo ? 'Em uso' : 'Suspenso'}</Badge>
                  </div>
                  <p className="text-lg text-ink">{m.dosagem}</p>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Horários">
                {m.horarios.map((h) => (
                  <li key={h} className="inline-flex items-center gap-1.5 rounded-xl bg-page px-3 py-2 text-lg font-extrabold tabular-nums text-ink">
                    <Clock size={18} className="text-brand" aria-hidden /> {h}
                  </li>
                ))}
              </ul>
              {m.observacoes && <p className="mt-3 text-muted">📝 {m.observacoes}</p>}
              {m.prescritoPor && (
                <p className="mt-3 flex items-start gap-1.5 text-sm text-muted">
                  <Stethoscope size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden /> Prescrito por {m.prescritoPor}
                </p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4 [margin-top:1rem]">
                <BotaoOuvir texto={`${m.nome}. ${m.dosagem}. Horários: ${m.horarios.join(', ')}. ${m.observacoes ?? ''}`} />
                {!editavel && <LembreteRemedio m={m} />}
                {editavel && (
                  <>
                    <Button variant="secondary" className="!min-h-10" onClick={() => abrir(m)} aria-label={`Ajustar ${m.nome}`}><Pencil size={18} aria-hidden /> Ajustar</Button>
                    <Button variant="secondary" className="!min-h-10" onClick={() => alternarAtivo(m)}>
                      {m.ativo ? <><PauseCircle size={18} aria-hidden /> Suspender</> : <><PlayCircle size={18} aria-hidden /> Retomar</>}
                    </Button>
                    <Button variant="danger" className="!min-h-10" onClick={() => excluir(m)} aria-label={`Excluir ${m.nome}`}><Trash2 size={18} aria-hidden /></Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}
