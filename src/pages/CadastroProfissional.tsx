import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff, Stethoscope } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { Button, Card, Field, ResumoErros, aria, campoClass } from '../components/ui'
import { inicioDoPerfil, useAuth } from '../context/AuthContext'
import {
  CONSELHOS, UFS, erroEmail, erroNome, erroNumeroConselho, erroObrigatorio, erroSenha,
  focarPrimeiroErro, forcaSenha, soDigitos, type Erros,
} from '../services/validacao'

const ESPECIALIDADES = ['Clínica médica', 'Cardiologia', 'Geriatria', 'Endocrinologia', 'Medicina de família', 'Enfermagem', 'Farmácia', 'Fisioterapia', 'Psicologia', 'Nutrição', 'Outra']

interface Form {
  nome: string; email: string; senha: string; confirmar: string
  conselho: string; numero: string; uf: string; especialidade: string; instituicao: string; declaracao: boolean
}
const INICIAL: Form = { nome: '', email: '', senha: '', confirmar: '', conselho: 'CRM', numero: '', uf: 'SP', especialidade: '', instituicao: '', declaracao: false }

export default function CadastroProfissional() {
  const { sessao, cadastrarProfissional } = useAuth()
  const navegar = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [f, setF] = useState<Form>(INICIAL)
  const [erros, setErros] = useState<Erros>({})
  const [erroServidor, setErroServidor] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)

  if (sessao && !enviando) return <Navigate to={inicioDoPerfil(sessao.perfil)} replace />

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((x) => ({ ...x, [k]: v }))
    if (erros[k as string]) setErros((e) => ({ ...e, [k]: '' }))
  }
  const forca = forcaSenha(f.senha)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const novos: Erros = {
      nome: erroNome(f.nome),
      email: erroEmail(f.email),
      numero: erroNumeroConselho(f.numero),
      especialidade: erroObrigatorio(f.especialidade, 'a especialidade ou área'),
      senha: erroSenha(f.senha),
      confirmar: !f.confirmar ? 'Repita a senha.' : f.confirmar !== f.senha ? 'As senhas não são iguais.' : '',
      declaracao: f.declaracao ? '' : 'Confirme que o registro é seu e está ativo.',
    }
    setErros(novos)
    setErroServidor('')
    if (Object.values(novos).some(Boolean)) return focarPrimeiroErro(formRef.current)
    setEnviando(true)
    try {
      await cadastrarProfissional({
        nome: f.nome.trim().replace(/\s+/g, ' '),
        email: f.email.trim(),
        senha: f.senha,
        conselho: `${f.conselho}-${f.uf} ${soDigitos(f.numero)}`,
        especialidade: f.especialidade,
        instituicao: f.instituicao.trim() || undefined,
      })
      navegar('/pro', { replace: true, state: { boasVindas: true } })
    } catch (err) {
      setEnviando(false)
      const msg = (err as Error).message
      if (/e-mail/i.test(msg)) setErros({ email: msg })
      else if (/registro/i.test(msg)) setErros({ numero: msg })
      else setErroServidor(msg)
      focarPrimeiroErro(formRef.current)
    }
  }

  return (
    <AuthShell>
      <Card className="mx-auto max-w-2xl p-6 sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-sm font-extrabold text-white">
          <Stethoscope size={16} aria-hidden /> Área do profissional
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">Criar conta de profissional</h1>
        <p className="mt-1 text-lg text-muted">Com ela você cadastra pacientes, prescreve e acompanha a adesão ao tratamento.</p>

        <form ref={formRef} onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-5">
          <ResumoErros quantidade={Object.values(erros).filter(Boolean).length} />
          {erroServidor && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 font-bold text-danger">{erroServidor}</p>}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="r-nome" label="Nome completo" obrigatorio erro={erros.nome} dica="Como aparece para o paciente. Ex.: Dra. Helena Costa">
              <input {...aria('r-nome', erros.nome, true)} autoComplete="name" className={campoClass(erros.nome)} value={f.nome} onChange={(e) => set('nome', e.target.value)} />
            </Field>
            <Field id="r-email" label="E-mail profissional" obrigatorio erro={erros.email}>
              <input {...aria('r-email', erros.email)} type="email" inputMode="email" autoComplete="email" className={campoClass(erros.email)} value={f.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 font-bold text-ink">Registro no conselho <span className="text-danger" aria-hidden>*</span><span className="sr-only">(obrigatório)</span></legend>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.8fr)] gap-3">
              <select id="r-conselho" aria-label="Conselho" className={campoClass()} value={f.conselho} onChange={(e) => set('conselho', e.target.value)}>
                {CONSELHOS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input {...aria('r-numero', erros.numero)} aria-label="Número do registro" inputMode="numeric" className={campoClass(erros.numero)} value={f.numero} onChange={(e) => set('numero', soDigitos(e.target.value).slice(0, 7))} placeholder="Número" />
              <select id="r-uf" aria-label="Estado (UF)" className={campoClass()} value={f.uf} onChange={(e) => set('uf', e.target.value)}>
                {UFS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            {erros.numero && <p id="r-numero-erro" className="mt-1.5 text-sm font-bold text-danger">{erros.numero}</p>}
            {!erros.numero && f.numero && <p className="mt-1.5 text-sm text-muted">Vai aparecer como <strong className="text-ink">{f.conselho}-{f.uf} {f.numero}</strong> nas prescrições.</p>}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="r-esp" label="Especialidade ou área" obrigatorio erro={erros.especialidade}>
              <select {...aria('r-esp', erros.especialidade)} className={campoClass(erros.especialidade)} value={f.especialidade} onChange={(e) => set('especialidade', e.target.value)}>
                <option value="">Escolha…</option>
                {ESPECIALIDADES.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field id="r-inst" label="Hospital, clínica ou UBS">
              <input id="r-inst" className={campoClass()} value={f.instituicao} onChange={(e) => set('instituicao', e.target.value)} placeholder="Ex.: Hospital São Lucas" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="r-senha" label="Senha" obrigatorio erro={erros.senha} dica="Mínimo 8 caracteres, com letras e números.">
              <div className="relative">
                <input {...aria('r-senha', erros.senha, true)} type={verSenha ? 'text' : 'password'} autoComplete="new-password" className={campoClass(erros.senha, 'pr-14')} value={f.senha} onChange={(e) => set('senha', e.target.value)} />
                <button type="button" onClick={() => setVerSenha((v) => !v)} aria-pressed={verSenha} aria-label={verSenha ? 'Esconder senhas' : 'Mostrar senhas'} className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-soft hover:text-brand">
                  {verSenha ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
                </button>
              </div>
              {f.senha && (
                <div className="flex items-center gap-2" aria-live="polite">
                  <div className="flex flex-1 gap-1" aria-hidden>
                    {[1, 2, 3].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${forca.nivel >= n ? (forca.nivel === 1 ? 'bg-danger' : forca.nivel === 2 ? 'bg-warn' : 'bg-brand') : 'bg-line'}`} />)}
                  </div>
                  <span className="text-sm font-bold text-muted">Senha {forca.rotulo.toLowerCase()}</span>
                </div>
              )}
            </Field>
            <Field id="r-confirmar" label="Repita a senha" obrigatorio erro={erros.confirmar}>
              <input {...aria('r-confirmar', erros.confirmar)} type={verSenha ? 'text' : 'password'} autoComplete="new-password" className={campoClass(erros.confirmar)} value={f.confirmar} onChange={(e) => set('confirmar', e.target.value)} />
            </Field>
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-3 font-bold text-ink">
              <input {...aria('r-declaracao', erros.declaracao)} type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-brand)]" checked={f.declaracao} onChange={(e) => set('declaracao', e.target.checked)} />
              Declaro que o registro informado é meu, está ativo, e que vou acessar dados de pacientes só para fins de atendimento.
            </label>
            {erros.declaracao && <p id="r-declaracao-erro" className="mt-2 text-sm font-bold text-danger">{erros.declaracao}</p>}
          </div>

          <Button type="submit" disabled={enviando} className="!min-h-14 text-lg">
            <Check size={20} aria-hidden /> {enviando ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-lg text-muted">
          Já tem conta? <Link to="/entrar" state={{ perfil: 'PROFISSIONAL' }} className="font-extrabold text-brand underline underline-offset-4">Entrar</Link>
        </p>
      </Card>
    </AuthShell>
  )
}
