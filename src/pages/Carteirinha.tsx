import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, ExternalLink, RefreshCw, ShieldOff, ShieldCheck, Printer, Lock } from 'lucide-react'
import { api, ROTULOS_CAMPOS } from '../services/api'
import type { CampoCarteirinha, Carteirinha as TCarteirinha, Usuario } from '../types'
import { Aviso, Badge, BotaoOuvir, Button, Card, Carregando, PageHeader, btnClass } from '../components/ui'
import { HealthCard } from '../components/HealthCard'

const PREVIA = import.meta.env.MODE === 'artifact'
const CAMPOS = Object.keys(ROTULOS_CAMPOS) as CampoCarteirinha[]

/** Link público que vai dentro do QR Code. Só contém o token aleatório. */
export function linkPublico(token: string) {
  return `${window.location.origin}${window.location.pathname}#/c/${token}`
}

export default function Carteirinha() {
  const [u, setU] = useState<Usuario>()
  const [c, setC] = useState<TCarteirinha>()
  const [campos, setCampos] = useState<CampoCarteirinha[]>([])
  const [aviso, setAviso] = useState({ texto: '', tom: 'ok' as 'ok' | 'erro' })

  useEffect(() => {
    Promise.all([api.getUsuario(), api.getCarteirinha()])
      .then(([usuario, cart]) => { setU(usuario); setC(cart); setCampos(cart.camposAutorizados) })
      .catch((e: Error) => setAviso({ texto: e.message, tom: 'erro' }))
  }, [])

  if (!u || !c) return <><Aviso {...aviso} /><Carregando /></>

  const url = linkPublico(c.token)
  const alterado = [...campos].sort().join() !== [...c.camposAutorizados].sort().join()
  const primeiroContato = u.contatoEmergenciaNome.split(' ')[0] + (u.contatoEmergenciaNome.match(/\(.+\)/)?.[0] ? ' ' + u.contatoEmergenciaNome.match(/\(.+\)/)![0] : '')

  const alternar = (k: CampoCarteirinha) => setCampos((cs) => (cs.includes(k) ? cs.filter((x) => x !== k) : [...cs, k]))

  async function salvarCampos() {
    setC(await api.atualizarCampos(campos))
    setAviso({ texto: 'Pronto! As informações compartilhadas foram atualizadas.', tom: 'ok' })
  }
  async function novoCodigo() {
    if (!window.confirm('Gerar um novo QR Code? O código antigo deixará de funcionar.')) return
    setC(await api.gerarNovoToken())
    setAviso({ texto: 'Novo QR Code gerado. O anterior não funciona mais.', tom: 'ok' })
  }
  async function alternarAtiva() {
    if (c!.ativa && !window.confirm('Revogar o acesso? Ninguém conseguirá ver suas informações pelo QR Code até você reativar.')) return
    setC(await api.definirAtiva(!c!.ativa))
    setAviso({ texto: c!.ativa ? 'Compartilhamento revogado.' : 'Compartilhamento reativado.', tom: 'ok' })
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setAviso({ texto: 'Link copiado.', tom: 'ok' })
    } catch {
      setAviso({ texto: `Não foi possível copiar automaticamente. Link: ${url}`, tom: 'erro' })
    }
  }

  const textoFalado = `Carteirinha de ${u.nome}. ${c.ativa ? 'Compartilhamento ativo.' : 'Compartilhamento revogado.'} Informações compartilhadas: ${c.camposAutorizados.map((k) => ROTULOS_CAMPOS[k]).join(', ') || 'nenhuma'}.`

  return (
    <>
      <PageHeader titulo="Carteirinha digital" descricao="Mostre o QR Code em uma emergência ou atendimento." acao={<BotaoOuvir texto={textoFalado} />} />
      <Aviso texto={aviso.texto} tom={aviso.tom} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-5">
          <HealthCard nome={u.nome} tipoSanguineo={c.camposAutorizados.includes('tipoSanguineo') ? u.tipoSanguineo : undefined} contato={c.camposAutorizados.includes('contatoEmergencia') ? primeiroContato : undefined} url={url} ativa={c.ativa} />
          <div className={`no-print grid w-full max-w-md ${PREVIA ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
            <a href={`#/c/${c.token}`} {...(PREVIA ? {} : { target: '_blank', rel: 'noreferrer' })} className={btnClass('primary', '!px-2')}>
              <ExternalLink size={18} aria-hidden /> Visualizar
            </a>
            <Button variant="secondary" className="!px-2" onClick={copiar}><Copy size={18} aria-hidden /> Copiar link</Button>
            {!PREVIA && <Button variant="secondary" className="!px-2" onClick={() => window.print()}><Printer size={18} aria-hidden /> Imprimir</Button>}
          </div>
          <p className="no-print flex max-w-md items-start gap-2 text-sm text-muted">
            <Lock size={16} className="mt-0.5 shrink-0" aria-hidden />
            O QR Code guarda apenas um código aleatório. Nenhum dado de saúde fica gravado nele.
          </p>
        </div>

        <div className="no-print flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-ink">O que pode ser visto</h2>
              <Badge tom={c.ativa ? 'brand' : 'danger'}>{c.ativa ? 'Ativo' : 'Revogado'}</Badge>
            </div>
            <p className="mt-1 text-muted">Seu nome e idade sempre aparecem. Marque o restante:</p>
            <fieldset className="mt-4">
              <legend className="sr-only">Informações autorizadas no QR Code</legend>
              <ul className="flex flex-col gap-2">
                {CAMPOS.map((k) => (
                  <li key={k}>
                    <label className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 font-bold transition-colors ${campos.includes(k) ? 'border-brand bg-soft text-ink' : 'border-line text-ink hover:border-brand/50'}`}>
                      <input type="checkbox" className="h-6 w-6 accent-[var(--color-brand)]" checked={campos.includes(k)} onChange={() => alternar(k)} />
                      {ROTULOS_CAMPOS[k]}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
            <Button className="mt-5 w-full" onClick={salvarCampos} disabled={!alterado}>
              {alterado ? 'Salvar escolhas' : 'Escolhas salvas'}
            </Button>
            <p className="mt-3 text-sm text-muted">
              Os dados vêm do seu <Link to="/perfil" className="font-bold text-brand underline">perfil</Link> e dos <Link to="/medicamentos" className="font-bold text-brand underline">remédios em uso</Link>.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-extrabold text-ink">Segurança do acesso</h2>
            <p className="mt-1 text-muted">Perdeu o celular ou mostrou o código para alguém? Você controla.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" className="flex-1" onClick={novoCodigo}><RefreshCw size={18} aria-hidden /> Gerar novo QR Code</Button>
              <Button variant={c.ativa ? 'danger' : 'primary'} className="flex-1" onClick={alternarAtiva}>
                {c.ativa ? <><ShieldOff size={18} aria-hidden /> Revogar acesso</> : <><ShieldCheck size={18} aria-hidden /> Reativar acesso</>}
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">
              Última alteração: {new Date(c.atualizadaEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}
