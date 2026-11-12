import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Sparkles, UserRound, Stethoscope, HelpCircle } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { Button, Card, Field, ResumoErros, aria, campoClass } from '../components/ui'
import { inicioDoPerfil, useAuth } from '../context/AuthContext'
import { DEMO, MODO_DEMO } from '../services/api'
import { erroCpf, erroEmail, focarPrimeiroErro, mascaraCpf, mascaraSenhaAcesso, soDigitos, type Erros } from '../services/validacao'
import type { Perfil } from '../types'

export default function Login() {
  const { sessao, entrar } = useAuth()
  const navegar = useNavigate()
  const estado = useLocation().state as { de?: string; perfil?: Perfil } | null
  const formRef = useRef<HTMLFormElement>(null)

  const [perfil, setPerfil] = useState<Perfil>(estado?.perfil ?? 'PACIENTE')
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erros, setErros] = useState<Erros>({})
  const [erroServidor, setErroServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (sessao && !enviando) return <Navigate to={estado?.de && estado.perfil === sessao.perfil ? estado.de : inicioDoPerfil(sessao.perfil)} replace />

  const paciente = perfil === 'PACIENTE'

  function trocarPerfil(p: Perfil) {
    setPerfil(p)
    setLogin('')
    setSenha('')
    setErros({})
    setErroServidor('')
  }

  async function enviar(e: FormEvent | null, cred?: { perfil: Perfil; login: string; senha: string }) {
    e?.preventDefault()
    const c = cred ?? { perfil, login, senha }
    const novos: Erros = c.perfil === 'PACIENTE'
      ? { login: erroCpf(c.login), senha: soDigitos(c.senha).length === 8 ? '' : 'A senha de acesso tem 8 números.' }
      : { login: erroEmail(c.login), senha: c.senha ? '' : 'Digite sua senha.' }
    setErros(novos)
    setErroServidor('')
    if (Object.values(novos).some(Boolean)) return focarPrimeiroErro(formRef.current)
    setEnviando(true)
    try {
      const s = await entrar(c.perfil, c.login, c.senha)
      const destino = estado?.de && (estado.perfil === s.perfil || estado.de.startsWith('/c/')) ? estado.de : inicioDoPerfil(s.perfil)
      navegar(destino, { replace: true })
    } catch (err) {
      setErroServidor((err as Error).message)
      setEnviando(false)
      setTimeout(() => document.getElementById('l-senha')?.focus(), 0)
    }
  }

  const demo = (p: Perfil) => {
    const cred = p === 'PACIENTE'
      ? { perfil: p, login: DEMO.paciente.cpf, senha: DEMO.paciente.senha }
      : { perfil: p, login: DEMO.profissional.email, senha: DEMO.profissional.senha }
    setPerfil(p)
    setLogin(cred.login)
    setSenha(cred.senha)
    enviar(null, cred)
  }

  const opcao = (p: Perfil, Icone: typeof UserRound, titulo: string, sub: string) => {
    const ativo = perfil === p
    return (
      <label className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-colors ${ativo ? 'border-brand bg-soft' : 'border-line hover:border-brand/50'}`}>
        <input type="radio" name="perfil" value={p} checked={ativo} onChange={() => trocarPerfil(p)} className="sr-only" />
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${ativo ? 'bg-brand text-white' : 'bg-page text-muted'}`} aria-hidden><Icone size={24} /></span>
        <span className="min-w-0">
          <span className="block text-lg font-extrabold leading-tight text-ink">{titulo}</span>
          <span className="block text-sm text-muted">{sub}</span>
        </span>
      </label>
    )
  }

  return (
    <AuthShell>
      <Card className="mx-auto max-w-lg p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Entrar</h1>

        <fieldset className="mt-5">
          <legend className="mb-2 font-bold text-ink">Quem é você?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {opcao('PACIENTE', UserRound, 'Sou paciente', 'CPF e senha de acesso')}
            {opcao('PROFISSIONAL', Stethoscope, 'Sou profissional', 'Médico ou equipe')}
          </div>
        </fieldset>

        <form ref={formRef} onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-5">
          <ResumoErros quantidade={Object.values(erros).filter(Boolean).length} />
          {erroServidor && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 font-bold text-danger">{erroServidor}</p>}

          {paciente ? (
            <Field id="l-login" label="CPF" erro={erros.login}>
              <input {...aria('l-login', erros.login)} inputMode="numeric" autoComplete="username" className={campoClass(erros.login, 'text-lg tracking-wide')} value={login} onChange={(e) => { setLogin(mascaraCpf(e.target.value)); setErros((x) => ({ ...x, login: '' })) }} placeholder="000.000.000-00" />
            </Field>
          ) : (
            <Field id="l-login" label="E-mail profissional" erro={erros.login}>
              <input {...aria('l-login', erros.login)} type="email" inputMode="email" autoComplete="email" className={campoClass(erros.login)} value={login} onChange={(e) => { setLogin(e.target.value); setErros((x) => ({ ...x, login: '' })) }} placeholder="nome@hospital.com" />
            </Field>
          )}

          <Field id="l-senha" label={paciente ? 'Senha de acesso' : 'Senha'} erro={erros.senha} dica={paciente ? 'São 8 números. Estão no papel entregue pelo seu médico ou pela equipe.' : undefined}>
            <div className="relative">
              <input
                {...aria('l-senha', erros.senha, paciente)}
                type={verSenha ? 'text' : 'password'}
                inputMode={paciente ? 'numeric' : undefined}
                autoComplete="current-password"
                className={campoClass(erros.senha, `pr-14 ${paciente ? 'text-lg tracking-widest' : ''}`)}
                value={senha}
                onChange={(e) => { setSenha(paciente ? mascaraSenhaAcesso(e.target.value) : e.target.value); setErros((x) => ({ ...x, senha: '' })) }}
                placeholder={paciente ? '0000-0000' : undefined}
              />
              <button type="button" onClick={() => setVerSenha((v) => !v)} aria-pressed={verSenha} aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'} className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-soft hover:text-brand">
                {verSenha ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
              </button>
            </div>
          </Field>

          <Button type="submit" disabled={enviando} className="!min-h-14 text-lg">
            <LogIn size={20} aria-hidden /> {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        {paciente ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-page p-4 text-muted">
            <HelpCircle size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />
            <span>Ainda não tem acesso ou perdeu a senha? O cadastro é feito pelo seu médico, posto de saúde ou hospital. Peça a eles.</span>
          </p>
        ) : (
          <p className="mt-6 text-center text-lg text-muted">
            Primeira vez aqui? <Link to="/cadastro" className="font-extrabold text-brand underline underline-offset-4">Criar conta de profissional</Link>
          </p>
        )}

        {MODO_DEMO && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-brand/40 bg-soft/60 p-4">
            <p className="font-bold text-ink">Contas de demonstração</p>
            <dl className="mt-1 grid gap-x-3 text-sm text-muted sm:grid-cols-[auto_1fr]">
              <dt className="font-bold text-ink">Paciente</dt><dd>CPF {DEMO.paciente.cpf} · senha {DEMO.paciente.senha}</dd>
              <dt className="font-bold text-ink">Profissional</dt><dd>{DEMO.profissional.email} · senha {DEMO.profissional.senha}</dd>
            </dl>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" disabled={enviando} onClick={() => demo('PACIENTE')}><Sparkles size={18} aria-hidden /> Entrar como Maria</Button>
              <Button variant="secondary" disabled={enviando} onClick={() => demo('PROFISSIONAL')}><Sparkles size={18} aria-hidden /> Entrar como Dra. Helena</Button>
            </div>
          </div>
        )}
      </Card>
    </AuthShell>
  )
}
