import { useState } from 'react'
import { Copy, KeyRound, Printer } from 'lucide-react'
import { BotaoOuvir, Button } from './ui'
import { PREVIA } from './Lembretes'

/**
 * "Ficha de acesso" entregue ao paciente: CPF + senha de 8 números.
 * Aparece uma única vez; se perder, o profissional gera outra.
 */
export function SenhaAcesso({ nome, cpf, senha }: { nome: string; cpf: string; senha: string }) {
  const [copiado, setCopiado] = useState('')
  const site = `${window.location.origin}${window.location.pathname}`

  async function copiar() {
    const texto = `Saúde Fácil — acesso de ${nome}\nCPF: ${cpf}\nSenha: ${senha}\nEntre em: ${site}`
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado('Copiado. Você pode colar no WhatsApp do paciente ou do familiar.')
    } catch {
      setCopiado('Não deu para copiar automaticamente. Anote a senha acima.')
    }
  }

  return (
    <div>
      <div className="ficha-acesso rounded-3xl border-2 border-dashed border-brand bg-card p-6">
        <p className="flex items-center gap-2 font-extrabold uppercase tracking-wider text-brand">
          <KeyRound size={20} aria-hidden /> Saúde Fácil · Acesso do paciente
        </p>
        <p className="mt-3 text-2xl font-extrabold text-ink">{nome}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold uppercase tracking-wider text-muted">CPF</dt>
            <dd className="text-2xl font-extrabold tabular-nums text-ink">{cpf}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold uppercase tracking-wider text-muted">Senha de acesso</dt>
            <dd className="font-mono text-4xl font-extrabold tracking-widest text-brand-strong">{senha}</dd>
          </div>
        </dl>
        <p className="mt-4 text-ink">
          1. Abra <strong className="break-all">{site.replace(/^https?:\/\//, '')}</strong> · 2. Toque em <strong>Entrar</strong> → <strong>Sou paciente</strong> · 3. Digite o CPF e a senha.
        </p>
      </div>

      <div className="no-print mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={copiar}><Copy size={18} aria-hidden /> Copiar para enviar</Button>
        <BotaoOuvir texto={`Senha de acesso: ${senha.replace('-', '').split('').join(', ')}.`} rotulo="Ouvir a senha" />
        {!PREVIA && (
          <Button variant="secondary" onClick={() => {
            document.documentElement.classList.add('imprimir-ficha')
            const fim = () => { document.documentElement.classList.remove('imprimir-ficha'); window.removeEventListener('afterprint', fim) }
            window.addEventListener('afterprint', fim)
            setTimeout(() => window.print(), 50)
          }}>
            <Printer size={18} aria-hidden /> Imprimir para entregar
          </Button>
        )}
      </div>
      <p role="status" className="no-print mt-2 text-sm font-bold text-brand-strong">{copiado}</p>
      <p className="no-print mt-2 text-sm text-muted">Por segurança, esta senha só aparece agora. Se o paciente perder, gere uma nova na ficha dele.</p>
    </div>
  )
}
