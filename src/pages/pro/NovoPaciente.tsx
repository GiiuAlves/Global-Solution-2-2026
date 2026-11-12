import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CircleCheckBig, Pill, UserPlus } from 'lucide-react'
import { api } from '../../services/api'
import type { Paciente } from '../../types'
import { Button, Card, ResumoErros, btnClass } from '../../components/ui'
import { A11yToolbar } from '../../components/A11yToolbar'
import { SenhaAcesso } from '../../components/SenhaAcesso'
import {
  ETAPAS_PACIENTE, PACIENTE_VAZIO, SecaoAcessibilidade, SecaoConsentimento, SecaoEmergencia, SecaoIdentificacao, SecaoSaude,
  normalizarPaciente, validarPaciente, type FormPacienteDados,
} from '../../components/FormPaciente'
import { focarPrimeiroErro, type Erros } from '../../services/validacao'

export default function NovoPaciente() {
  const formRef = useRef<HTMLFormElement>(null)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const [etapa, setEtapa] = useState<0 | 1 | 2>(0)
  const [f, setF] = useState<FormPacienteDados>(PACIENTE_VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [erroServidor, setErroServidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [criado, setCriado] = useState<{ paciente: Paciente; senhaAcesso: string } | null>(null)
  const primeira = useRef(true)

  // Ao trocar de etapa, o foco vai para o título ("Etapa 2 de 3") para o leitor de tela anunciar.
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return }
    tituloRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [etapa, criado])

  const set = <K extends keyof FormPacienteDados>(k: K, v: FormPacienteDados[K]) => {
    setF((x) => ({ ...x, [k]: v }))
    if (erros[k as string]) setErros((e) => ({ ...e, [k]: '' }))
  }

  async function avancar(e: FormEvent) {
    e.preventDefault()
    const novos = validarPaciente(f, etapa)
    setErros(novos)
    setErroServidor('')
    if (Object.values(novos).some(Boolean)) return focarPrimeiroErro(formRef.current)
    if (etapa < 2) return setEtapa((etapa + 1) as 0 | 1 | 2)
    setEnviando(true)
    try {
      setCriado(await api.criarPaciente({ ...normalizarPaciente(f), consentimentoLgpd: f.consentimentoLgpd }))
    } catch (err) {
      const msg = (err as Error).message
      if (/CPF/.test(msg)) {
        setEtapa(0)
        setErros({ cpf: msg })
        focarPrimeiroErro(formRef.current)
      } else setErroServidor(msg)
    } finally {
      setEnviando(false)
    }
  }

  function outro() {
    setCriado(null)
    setF(PACIENTE_VAZIO)
    setEtapa(0)
    setErros({})
  }

  if (criado)
    return (
      <Card className="mx-auto max-w-2xl p-6 sm:p-8">
        <p className="flex items-center gap-2 font-extrabold text-brand"><CircleCheckBig size={22} aria-hidden /> Paciente cadastrado</p>
        <h1 ref={tituloRef} tabIndex={-1} className="mt-2 text-3xl font-extrabold tracking-tight text-ink outline-none">Entregue o acesso ao paciente</h1>
        <p className="mt-1 mb-6 text-lg text-muted">Com isto, {criado.paciente.nome.split(' ')[0]} vê os remédios, as consultas e a carteirinha no celular, sem poder alterar nada.</p>
        <SenhaAcesso nome={criado.paciente.nome} cpf={criado.paciente.cpf} senha={criado.senhaAcesso} />
        <div className="no-print mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row">
          <Link to={`/pro/paciente/${criado.paciente.id}`} state={{ aba: 'remedios' }} className={btnClass('primary', '!min-h-14 flex-1 text-lg')}>
            <Pill size={20} aria-hidden /> Prescrever remédios
          </Link>
          <Button variant="secondary" className="!min-h-14" onClick={outro}><UserPlus size={20} aria-hidden /> Cadastrar outro</Button>
        </div>
      </Card>
    )

  return (
    <Card className="mx-auto max-w-3xl p-6 sm:p-8">
      <Link to="/pro" className="inline-flex items-center gap-1 font-bold text-brand hover:underline"><ArrowLeft size={18} aria-hidden /> Meus pacientes</Link>
      <p className="mt-4 font-bold text-brand">Cadastrar paciente</p>

      <ol className="mt-3 grid grid-cols-3 gap-2" aria-label="Etapas do cadastro">
        {ETAPAS_PACIENTE.map((nome, i) => (
          <li key={nome} aria-current={i === etapa ? 'step' : undefined} className="flex min-w-0 flex-col gap-2">
            <span className={`h-2 rounded-full ${i <= etapa ? 'bg-brand' : 'bg-line'}`} aria-hidden />
            <span className={`flex flex-col items-start gap-1 text-sm font-bold sm:flex-row sm:gap-1.5 ${i === etapa ? 'text-ink' : 'text-muted'}`}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${i < etapa ? 'bg-brand text-white' : i === etapa ? 'border-2 border-brand text-brand' : 'border-2 border-line text-muted'}`} aria-hidden>
                {i < etapa ? <Check size={14} /> : i + 1}
              </span>
              <span className="min-w-0 break-words leading-tight">{nome}</span>
              {i < etapa && <span className="sr-only">(concluída)</span>}
            </span>
          </li>
        ))}
      </ol>

      <h1 ref={tituloRef} tabIndex={-1} className="mt-6 text-3xl font-extrabold tracking-tight text-ink outline-none">
        <span className="sr-only">Etapa {etapa + 1} de 3: </span>{ETAPAS_PACIENTE[etapa]}
      </h1>

      <form ref={formRef} onSubmit={avancar} noValidate className="mt-5 flex flex-col gap-6">
        <ResumoErros quantidade={Object.values(erros).filter(Boolean).length} />
        {erroServidor && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 font-bold text-danger">{erroServidor}</p>}

        {etapa === 0 && <SecaoIdentificacao f={f} set={set} erros={erros} />}
        {etapa === 1 && (
          <>
            <SecaoEmergencia f={f} set={set} erros={erros} />
            <div className="border-t border-line pt-6"><SecaoSaude f={f} set={set} erros={erros} /></div>
          </>
        )}
        {etapa === 2 && (
          <>
            <SecaoAcessibilidade f={f} set={set} erros={erros} />
            <div className="rounded-2xl bg-page p-4">
              <p className="font-bold text-ink">Ajustar a tela para mostrar ao paciente</p>
              <p className="mb-3 text-sm text-muted">Letra maior e contraste valem neste aparelho.</p>
              <A11yToolbar />
            </div>
            <SecaoConsentimento f={f} set={set} erros={erros} />
          </>
        )}

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {etapa > 0 ? (
            <Button variant="secondary" onClick={() => { setErros({}); setEtapa((etapa - 1) as 0 | 1 | 2) }}><ArrowLeft size={20} aria-hidden /> Voltar</Button>
          ) : <span />}
          <Button type="submit" disabled={enviando} className="!min-h-14 !px-8 text-lg">
            {etapa < 2 ? <>Continuar <ArrowRight size={20} aria-hidden /></> : enviando ? 'Cadastrando…' : <><Check size={20} aria-hidden /> Cadastrar e gerar acesso</>}
          </Button>
        </div>
      </form>
    </Card>
  )
}
