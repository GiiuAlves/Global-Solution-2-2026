import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Volume2, Square, AlertCircle } from 'lucide-react'
import { useA11y } from '../context/A11yContext'

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTES: Record<Variante, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong',
  secondary: 'bg-card text-ink border-2 border-line hover:border-brand',
  ghost: 'text-brand hover:bg-soft',
  danger: 'bg-card text-danger border-2 border-danger/40 hover:bg-danger/5',
}

export const btnClass = (v: Variante = 'primary', extra = '') =>
  `inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[v]} ${extra}`

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variante }) {
  return <button type={type} className={btnClass(variant, className)} {...p} />
}

export function Card({ children, className = '', as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' | 'li' }) {
  return <Tag className={`card bg-card border border-line rounded-2xl shadow-[0_1px_2px_rgba(18,59,93,0.06)] ${className}`}>{children}</Tag>
}

export function PageHeader({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{titulo}</h1>
        {descricao && <p className="mt-1 text-lg text-muted">{descricao}</p>}
      </div>
      {acao}
    </header>
  )
}

export const inputClass =
  'w-full min-h-12 rounded-xl border-2 border-line bg-card px-4 py-2 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none'

/** Classe do campo, com borda vermelha quando há erro. */
export const campoClass = (erro?: string, extra = '') => `${inputClass} ${erro ? '!border-danger bg-danger/[0.03]' : ''} ${extra}`

/** Atributos de acessibilidade do campo: id, aria-invalid e aria-describedby (dica + erro). */
export function aria(id: string, erro?: string, dica?: boolean) {
  const desc = [dica && `${id}-dica`, erro && `${id}-erro`].filter(Boolean).join(' ')
  return { id, 'aria-invalid': erro ? (true as const) : undefined, 'aria-describedby': desc || undefined }
}

export function Field({ id, label, dica, erro, obrigatorio, children }: { id: string; label: string; dica?: string; erro?: string; obrigatorio?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="font-bold text-ink">
        {label} {obrigatorio && <span className="text-danger" aria-hidden>*</span>}
        {obrigatorio && <span className="sr-only">(obrigatório)</span>}
      </label>
      {children}
      {dica && !erro && <p id={`${id}-dica`} className="text-sm text-muted">{dica}</p>}
      {erro && (
        <p id={`${id}-erro`} className="flex items-start gap-1.5 text-sm font-bold text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {erro}
        </p>
      )}
    </div>
  )
}

/** Resumo de erros no topo do formulário, anunciado pelo leitor de tela. */
export function ResumoErros({ quantidade }: { quantidade: number }) {
  if (!quantidade) return null
  return (
    <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 font-bold text-danger">
      <AlertCircle size={20} aria-hidden />
      {quantidade === 1 ? 'Falta corrigir 1 campo.' : `Faltam corrigir ${quantidade} campos.`} Veja as mensagens em vermelho.
    </p>
  )
}

export function Badge({ children, tom = 'brand' }: { children: ReactNode; tom?: 'brand' | 'muted' | 'danger' | 'warn' }) {
  const t = {
    brand: 'bg-soft text-brand-strong',
    muted: 'bg-page text-muted border border-line',
    danger: 'bg-danger/10 text-danger',
    warn: 'bg-warn-soft text-warn',
  }[tom]
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${t}`}>{children}</span>
}

/** Mensagem anunciada por leitores de tela (aria-live). */
export function Aviso({ texto, tom = 'ok' }: { texto: string; tom?: 'ok' | 'erro' }) {
  return (
    <div role="status" aria-live="polite" className="min-h-0">
      {texto && (
        <p className={`mb-4 rounded-xl px-4 py-3 font-semibold ${tom === 'ok' ? 'bg-soft text-brand-strong' : 'bg-danger/10 text-danger'}`}>
          {texto}
        </p>
      )}
    </div>
  )
}

export function Carregando() {
  return (
    <p role="status" className="py-16 text-center text-lg text-muted">
      Carregando suas informações…
    </p>
  )
}

/** Botão "Ouvir" — lê o texto em voz alta (Web Speech API). */
export function BotaoOuvir({ texto, rotulo = 'Ouvir' }: { texto: string; rotulo?: string }) {
  const { falar, pararFala, falando, vozDisponivel } = useA11y()
  if (!vozDisponivel) return null
  return (
    <Button variant="ghost" className="!min-h-10 !px-3" onClick={() => (falando ? pararFala() : falar(texto))} aria-label={falando ? 'Parar leitura' : `${rotulo} em voz alta`}>
      {falando ? <Square size={18} aria-hidden /> : <Volume2 size={20} aria-hidden />}
      {falando ? 'Parar' : rotulo}
    </Button>
  )
}

export function formatarData(iso: string, opcoes: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' }) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', opcoes)
}
export function diaDaSemana(iso: string) {
  const d = new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })
  return d.charAt(0).toUpperCase() + d.slice(1)
}
export function hojeISO() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
