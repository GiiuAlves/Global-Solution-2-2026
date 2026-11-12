import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink, RefreshCw, ShieldOff, ShieldCheck, Lock, Minus } from 'lucide-react'
import { api, ROTULOS_CAMPOS } from '../services/api'
import type { CampoCarteirinha, Carteirinha, Paciente } from '../types'
import { Aviso, Badge, BotaoOuvir, Button, Card, Carregando, btnClass } from './ui'
import { HealthCard } from './HealthCard'
import { useConfirm } from './ConfirmDialog'
import { ExportarCarteirinha } from './ExportarCarteirinha'
import { PREVIA } from './Lembretes'

const CAMPOS = Object.keys(ROTULOS_CAMPOS) as CampoCarteirinha[]

/** Link que vai dentro do QR Code. Só contém o token aleatório, nunca dados de saúde. */
export function linkPublico(token: string) {
  return `${window.location.origin}${window.location.pathname}#/c/${token}`
}

/**
 * Carteirinha com QR Code.
 * editavel = true  → profissional: escolhe o que aparece, gera novo código, liga/desliga.
 * editavel = false → paciente: vê o que aparece, exporta e pode desligar o QR (direito do titular).
 */
export function PainelCarteirinha({ paciente, editavel, onMudou }: { paciente: Paciente; editavel: boolean; onMudou?: () => void }) {
  const [c, setC] = useState<Carteirinha>()
  const [campos, setCampos] = useState<CampoCarteirinha[]>([])
  const [aviso, setAviso] = useState({ texto: '', tom: 'ok' as 'ok' | 'erro' })
  const confirmar = useConfirm()

  useEffect(() => {
    api.getCarteirinha(paciente.id)
      .then((cart) => { setC(cart); setCampos(cart.camposAutorizados) })
      .catch((e: Error) => setAviso({ texto: e.message, tom: 'erro' }))
  }, [paciente.id])

  const mostra = (k: CampoCarteirinha) => !!c?.camposAutorizados.includes(k)
  const dadosExport = useMemo(
    () => c && ({
      nome: paciente.nome,
      tipoSanguineo: mostra('tipoSanguineo') ? paciente.tipoSanguineo : undefined,
      alergias: mostra('alergias') ? paciente.alergias : undefined,
      contato: mostra('contatoEmergencia') ? `${paciente.contatoEmergenciaNome.split(' ')[0]} (${paciente.contatoEmergenciaParentesco.toLowerCase()})` : undefined,
      telefoneContato: mostra('contatoEmergencia') ? paciente.contatoEmergenciaTelefone : undefined,
      url: linkPublico(c.token),
    }),
    [c, paciente], // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!c || !dadosExport) return <><Aviso {...aviso} /><Carregando /></>

  const url = linkPublico(c.token)
  const alterado = [...campos].sort().join() !== [...c.camposAutorizados].sort().join()
  const alternar = (k: CampoCarteirinha) => setCampos((cs) => (cs.includes(k) ? cs.filter((x) => x !== k) : [...cs, k]))

  async function salvarCampos() {
    setC(await api.atualizarCampos(paciente.id, campos))
    setAviso({ texto: 'Informações do QR Code atualizadas.', tom: 'ok' })
    onMudou?.()
  }
  async function novoCodigo() {
    const ok = await confirmar({
      titulo: 'Gerar um novo QR Code?',
      mensagem: 'O código atual deixa de funcionar na hora. Use se a carteirinha foi perdida. Será preciso exportar ou imprimir de novo.',
      confirmar: 'Gerar novo código',
    })
    if (!ok) return
    setC(await api.gerarNovoToken(paciente.id))
    setAviso({ texto: 'Novo QR Code gerado. O anterior não funciona mais.', tom: 'ok' })
    onMudou?.()
  }
  async function alternarAtiva() {
    if (c!.ativa) {
      const ok = await confirmar({
        titulo: 'Desligar o QR Code?',
        mensagem: editavel
          ? 'Ninguém conseguirá abrir as informações pelo QR Code até que ele seja ligado de novo.'
          : 'Ninguém conseguirá ver suas informações pelo QR Code, nem em uma emergência, até você ligar de novo.',
        confirmar: 'Desligar',
        perigo: true,
      })
      if (!ok) return
    }
    setC(await api.definirAtiva(paciente.id, !c!.ativa))
    setAviso({ texto: c!.ativa ? 'QR Code desligado.' : 'QR Code ligado de novo.', tom: 'ok' })
    onMudou?.()
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setAviso({ texto: 'Link copiado.', tom: 'ok' })
    } catch {
      setAviso({ texto: `Não foi possível copiar automaticamente. Link: ${url}`, tom: 'erro' })
    }
  }

  const visiveis = c.camposAutorizados.map((k) => ROTULOS_CAMPOS[k])
  const textoFalado = `Carteirinha de ${paciente.nome}. ${c.ativa ? 'QR Code ligado.' : 'QR Code desligado.'} Quem escanear vê: nome, idade${visiveis.length ? ', ' + visiveis.join(', ') : ''}.`

  return (
    <>
      <Aviso texto={aviso.texto} tom={aviso.tom} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-5">
          <HealthCard nome={paciente.nome} tipoSanguineo={dadosExport.tipoSanguineo} contato={dadosExport.contato} url={url} ativa={c.ativa} />
          <div className="no-print grid w-full max-w-md grid-cols-3 gap-2">
            <a href={`#/c/${c.token}`} {...(PREVIA ? {} : { target: '_blank', rel: 'noreferrer' })} className={btnClass('primary', '!px-2')}>
              <ExternalLink size={18} aria-hidden /> Abrir
            </a>
            <Button variant="secondary" className="!px-2" onClick={copiar}><Copy size={18} aria-hidden /> Copiar</Button>
            <ExportarCarteirinha dados={dadosExport} desabilitado={!c.ativa} />
          </div>
          <div className="no-print"><BotaoOuvir texto={textoFalado} rotulo="Ouvir o que aparece" /></div>
          <p className="no-print flex max-w-md items-start gap-2 text-sm text-muted">
            <Lock size={16} className="mt-0.5 shrink-0" aria-hidden />
            O QR Code guarda só um código aleatório. Quem escanear vê o resumo de emergência; um profissional de saúde logado vê a ficha técnica completa.
          </p>
        </div>

        <div className="no-print flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-ink">O que aparece na emergência</h2>
              <Badge tom={c.ativa ? 'brand' : 'danger'}>{c.ativa ? 'Ligado' : 'Desligado'}</Badge>
            </div>
            <p className="mt-1 text-muted">Nome e idade sempre aparecem.{editavel ? ' Marque o restante:' : ''}</p>
            {editavel ? (
              <>
                <fieldset className="mt-4">
                  <legend className="sr-only">Informações visíveis no QR Code</legend>
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
                <Button className="mt-5 w-full" onClick={salvarCampos} disabled={!alterado}>{alterado ? 'Salvar escolhas' : 'Escolhas salvas'}</Button>
              </>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {CAMPOS.map((k) => {
                  const sim = mostra(k)
                  return (
                    <li key={k} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 font-bold ${sim ? 'bg-soft text-ink' : 'text-muted'}`}>
                      {sim ? <Check size={20} className="text-brand" aria-hidden /> : <Minus size={20} aria-hidden />}
                      {ROTULOS_CAMPOS[k]}
                      <span className="sr-only">{sim ? ': aparece' : ': não aparece'}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-extrabold text-ink">Segurança</h2>
            <p className="mt-1 text-muted">{editavel ? 'Carteirinha perdida? Gere um código novo: o antigo para de funcionar.' : 'Você pode desligar o QR Code quando quiser.'}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {editavel && <Button variant="secondary" className="flex-1" onClick={novoCodigo}><RefreshCw size={18} aria-hidden /> Gerar novo QR Code</Button>}
              <Button variant={c.ativa ? 'danger' : 'primary'} className="flex-1" onClick={alternarAtiva}>
                {c.ativa ? <><ShieldOff size={18} aria-hidden /> Desligar QR Code</> : <><ShieldCheck size={18} aria-hidden /> Ligar QR Code</>}
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">Última alteração: {new Date(c.atualizadaEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
          </Card>
        </div>
      </div>
    </>
  )
}
