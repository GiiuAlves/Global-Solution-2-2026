import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, LogOut, Trash2, RotateCcw, Stethoscope } from 'lucide-react'
import { api, idade, MODO_DEMO } from '../../services/api'
import type { Paciente, Profissional } from '../../types'
import { BotaoOuvir, Button, Card, Carregando, PageHeader, formatarData } from '../../components/ui'
import { A11yToolbar } from '../../components/A11yToolbar'
import { useConfirm } from '../../components/ConfirmDialog'
import { useAuth, usePaciente } from '../../context/AuthContext'

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4">
      <dt className="font-bold text-muted">{rotulo}</dt>
      <dd className="text-lg font-bold text-ink">{children || <span className="font-semibold text-muted">Não informado</span>}</dd>
    </div>
  )
}

/** Dados do paciente: somente leitura. Quem corrige é o profissional vinculado. */
export default function MeusDados() {
  const eu = usePaciente()
  const { sair, excluirMinhaConta } = useAuth()
  const navegar = useNavigate()
  const confirmar = useConfirm()
  const [p, setP] = useState<Paciente>()
  const [resp, setResp] = useState<Profissional[]>([])

  useEffect(() => {
    Promise.all([api.getPaciente(eu.id), api.getResponsaveis(eu.id)]).then(([pac, r]) => { setP(pac); setResp(r) })
  }, [eu.id])
  if (!p) return <Carregando />

  async function apagar() {
    const ok = await confirmar({
      titulo: 'Apagar sua conta?',
      mensagem: 'Todos os seus dados serão apagados: ficha, consultas, remédios, doses e carteirinha. O QR Code para de funcionar. Isso não pode ser desfeito.',
      confirmar: 'Apagar tudo',
      cancelar: 'Manter minha conta',
      perigo: true,
    })
    if (!ok) return
    await excluirMinhaConta()
    navegar('/', { replace: true })
  }
  async function restaurar() {
    const ok = await confirmar({ titulo: 'Restaurar dados de exemplo?', mensagem: 'Tudo o que foi criado neste navegador será apagado e os exemplos voltam ao início.', confirmar: 'Restaurar', perigo: true })
    if (!ok) return
    await api.restaurarDemo()
    sair()
    navegar('/entrar', { replace: true })
  }

  const necessidades = [...p.necessidadesAcessibilidade, p.observacoesAcessibilidade].filter(Boolean).join('. ')
  const falado = `Seus dados. Nome: ${p.nome}. ${idade(p.dataNascimento)} anos. Contato de emergência: ${p.contatoEmergenciaNome}, ${p.contatoEmergenciaParentesco}, telefone ${p.contatoEmergenciaTelefone}. ${p.alergias ? 'Alergias: ' + p.alergias + '.' : ''}`

  return (
    <>
      <PageHeader titulo="Meus dados" descricao="Informações cadastradas pela sua equipe de saúde." acao={<BotaoOuvir texto={falado} />} />

      <p className="mb-6 flex items-start gap-2 rounded-xl bg-page p-4 text-muted">
        <Lock size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />
        Para sua segurança, só o profissional de saúde altera estes dados. Viu algo errado? Avise na próxima consulta{resp[0] ? ` ou fale com ${resp[0].nome}` : ''}.
      </p>

      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-ink">Identificação</h2>
          <dl className="mt-2">
            <Linha rotulo="Nome">{p.nome}</Linha>
            <Linha rotulo="CPF">{p.cpf}</Linha>
            <Linha rotulo="Nascimento">{formatarData(p.dataNascimento)} ({idade(p.dataNascimento)} anos)</Linha>
            <Linha rotulo="Telefone">{p.telefone}</Linha>
          </dl>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-ink">Emergência e saúde</h2>
          <dl className="mt-2">
            <Linha rotulo="Contato de emergência">{p.contatoEmergenciaNome} ({p.contatoEmergenciaParentesco.toLowerCase()}) · {p.contatoEmergenciaTelefone}</Linha>
            <Linha rotulo="Tipo sanguíneo">{p.tipoSanguineo}</Linha>
            <Linha rotulo="Alergias">{p.alergias}</Linha>
            <Linha rotulo="Condições de saúde">{p.condicoes}</Linha>
            <Linha rotulo="Acessibilidade">{necessidades}</Linha>
          </dl>
        </Card>
        {resp.length > 0 && (
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink"><Stethoscope size={22} className="text-brand" aria-hidden /> Profissionais com acesso à sua ficha</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {resp.map((r) => <li key={r.id}><p className="font-bold text-ink">{r.nome}</p><p className="text-sm text-muted">{r.especialidade} · {r.conselho}{r.instituicao ? ` · ${r.instituicao}` : ''}</p></li>)}
            </ul>
          </Card>
        )}
        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-ink">Tela do seu jeito</h2>
          <p className="mb-4 mt-1 text-muted">Tamanho da letra e contraste. Ficam salvos neste aparelho.</p>
          <A11yToolbar />
        </Card>
        <Card className="border-danger/30 p-6">
          <h2 className="text-xl font-extrabold text-ink">Conta e privacidade</h2>
          <p className="mt-1 text-muted">Pela LGPD, você pode apagar sua conta e todos os seus dados quando quiser.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => { sair(); navegar('/entrar', { replace: true }) }}><LogOut size={18} aria-hidden /> Sair</Button>
            <Button variant="danger" onClick={apagar}><Trash2 size={18} aria-hidden /> Apagar minha conta</Button>
            {MODO_DEMO && <Button variant="ghost" onClick={restaurar}><RotateCcw size={18} aria-hidden /> Restaurar dados de exemplo</Button>}
          </div>
        </Card>
      </div>
    </>
  )
}
