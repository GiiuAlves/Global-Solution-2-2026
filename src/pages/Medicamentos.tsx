import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, Clock, Pill, PauseCircle, PlayCircle } from 'lucide-react'
import { api } from '../services/api'
import type { Medicamento, NovoMedicamento } from '../types'
import { Aviso, Badge, BotaoOuvir, Button, Card, Carregando, Field, PageHeader, inputClass } from '../components/ui'

const VAZIO: NovoMedicamento = { nome: '', dosagem: '', horarios: ['08:00'], ativo: true, observacoes: '' }

export default function Medicamentos() {
  const [lista, setLista] = useState<Medicamento[]>()
  const [form, setForm] = useState<NovoMedicamento>(VAZIO)
  const [editando, setEditando] = useState<number | null>(null)
  const [aberto, setAberto] = useState(false)
  const [aviso, setAviso] = useState({ texto: '', tom: 'ok' as 'ok' | 'erro' })

  const carregar = () => api.listarMedicamentos().then(setLista).catch((e: Error) => setAviso({ texto: e.message, tom: 'erro' }))
  useEffect(() => { carregar() }, [])

  function abrir(m?: Medicamento) {
    if (m) {
      const { id: _id, usuarioId: _u, ...resto } = m
      setForm({ ...VAZIO, ...resto, horarios: [...m.horarios] }); setEditando(m.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setForm({ ...VAZIO, horarios: ['08:00'] }); setEditando(null)
    }
    setAberto(true)
    setTimeout(() => document.getElementById('m-nome')?.focus(), 0)
  }
  const fechar = () => { setAberto(false); setEditando(null) }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const horarios = [...new Set(form.horarios.filter(Boolean))].sort()
    if (!horarios.length) return setAviso({ texto: 'Informe pelo menos um horário.', tom: 'erro' })
    try {
      if (editando) await api.atualizarMedicamento({ ...form, horarios, id: editando, usuarioId: 1 })
      else await api.criarMedicamento({ ...form, horarios })
      setAviso({ texto: editando ? 'Remédio atualizado.' : 'Remédio cadastrado com sucesso.', tom: 'ok' })
      fechar(); carregar()
    } catch (err) {
      setAviso({ texto: (err as Error).message, tom: 'erro' })
    }
  }

  async function alternarAtivo(m: Medicamento) {
    await api.atualizarMedicamento({ ...m, ativo: !m.ativo })
    setAviso({ texto: m.ativo ? `${m.nome} pausado.` : `${m.nome} voltou a ficar em uso.`, tom: 'ok' })
    carregar()
  }
  async function excluir(m: Medicamento) {
    if (!window.confirm(`Excluir ${m.nome}?`)) return
    await api.excluirMedicamento(m.id)
    setAviso({ texto: 'Remédio excluído.', tom: 'ok' })
    carregar()
  }

  const setHorario = (i: number, v: string) => setForm((f) => ({ ...f, horarios: f.horarios.map((h, j) => (j === i ? v : h)) }))

  return (
    <>
      <PageHeader
        titulo="Meus remédios"
        descricao="Registre os medicamentos e os horários de cada dia."
        acao={!aberto && <Button onClick={() => abrir()}><Plus size={20} aria-hidden /> Novo remédio</Button>}
      />
      <Aviso texto={aviso.texto} tom={aviso.tom} />

      {aberto && (
        <Card className="mb-8 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-ink">{editando ? 'Editar remédio' : 'Novo remédio'}</h2>
            <Button variant="ghost" onClick={fechar} aria-label="Fechar formulário"><X size={22} aria-hidden /></Button>
          </div>
          <form onSubmit={salvar} className="grid gap-5 sm:grid-cols-2">
            <Field id="m-nome" label="Nome do remédio" obrigatorio>
              <input id="m-nome" required className={inputClass} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Losartana" />
            </Field>
            <Field id="m-dosagem" label="Quanto tomar" obrigatorio dica="Como está na receita. Ex.: 50 mg — 1 comprimido.">
              <input id="m-dosagem" required aria-describedby="m-dosagem-dica" className={inputClass} value={form.dosagem} onChange={(e) => setForm({ ...form, dosagem: e.target.value })} />
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 font-bold text-ink">Horários <span className="text-danger" aria-hidden>*</span></legend>
              <div className="flex flex-wrap items-center gap-3">
                {form.horarios.map((h, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input type="time" required aria-label={`Horário ${i + 1}`} className={`${inputClass} w-36`} value={h} onChange={(e) => setHorario(i, e.target.value)} />
                    {form.horarios.length > 1 && (
                      <Button variant="ghost" className="!min-h-11 !px-2" aria-label={`Remover horário ${i + 1}`} onClick={() => setForm((f) => ({ ...f, horarios: f.horarios.filter((_, j) => j !== i) }))}>
                        <X size={18} aria-hidden />
                      </Button>
                    )}
                  </div>
                ))}
                {form.horarios.length < 6 && (
                  <Button variant="secondary" onClick={() => setForm((f) => ({ ...f, horarios: [...f.horarios, ''] }))}><Plus size={18} aria-hidden /> Horário</Button>
                )}
              </div>
            </fieldset>
            <div className="sm:col-span-2">
              <Field id="m-obs" label="Observações" dica="Ex.: tomar após o almoço, em jejum.">
                <input id="m-obs" aria-describedby="m-obs-dica" className={inputClass} value={form.observacoes ?? ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <Button type="submit">{editando ? 'Salvar alterações' : 'Cadastrar remédio'}</Button>
              <Button variant="secondary" onClick={fechar}>Cancelar</Button>
            </div>
            <p className="text-sm text-muted sm:col-span-2">O Saúde Fácil apenas organiza o que foi prescrito. Siga sempre a orientação do seu médico ou farmacêutico.</p>
          </form>
        </Card>
      )}

      {!lista ? <Carregando /> : lista.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-line p-10 text-center text-lg text-muted">Nenhum remédio cadastrado ainda.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {[...lista].sort((a, b) => Number(b.ativo) - Number(a.ativo)).map((m) => (
            <Card as="li" key={m.id} className={`flex flex-col p-5 ${m.ativo ? '' : 'opacity-70'}`}>
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-soft text-brand" aria-hidden><Pill size={24} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold text-ink">{m.nome}</h2>
                    <Badge tom={m.ativo ? 'brand' : 'muted'}>{m.ativo ? 'Em uso' : 'Pausado'}</Badge>
                  </div>
                  <p className="text-muted">{m.dosagem}</p>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Horários">
                {m.horarios.map((h) => (
                  <li key={h} className="inline-flex items-center gap-1.5 rounded-xl bg-page px-3 py-2 text-lg font-extrabold text-ink">
                    <Clock size={18} className="text-brand" aria-hidden /> {h}
                  </li>
                ))}
              </ul>
              {m.observacoes && <p className="mt-3 text-muted">📝 {m.observacoes}</p>}
              <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4 [margin-top:1rem]">
                <BotaoOuvir texto={`${m.nome}. ${m.dosagem}. Horários: ${m.horarios.join(', ')}. ${m.observacoes ?? ''}`} />
                <Button variant="secondary" className="!min-h-10" onClick={() => abrir(m)} aria-label={`Editar ${m.nome}`}><Pencil size={18} aria-hidden /> Editar</Button>
                <Button variant="secondary" className="!min-h-10" onClick={() => alternarAtivo(m)}>
                  {m.ativo ? <><PauseCircle size={18} aria-hidden /> Pausar</> : <><PlayCircle size={18} aria-hidden /> Retomar</>}
                </Button>
                <Button variant="danger" className="!min-h-10" onClick={() => excluir(m)} aria-label={`Excluir ${m.nome}`}><Trash2 size={18} aria-hidden /></Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </>
  )
}
