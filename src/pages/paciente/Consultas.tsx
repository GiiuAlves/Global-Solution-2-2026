import { Info } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { ListaConsultas } from '../../components/ListaConsultas'
import { usePaciente } from '../../context/AuthContext'

export default function Consultas() {
  const eu = usePaciente()
  return (
    <>
      <PageHeader titulo="Minhas consultas" descricao="Consultas e exames marcados pela sua equipe de saúde." />
      <p className="mb-6 flex items-start gap-2 rounded-xl bg-page p-4 text-muted">
        <Info size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />
        Toque em <strong className="text-ink">Pôr na agenda</strong> para o celular avisar antes. Para marcar ou mudar uma consulta, fale com o seu profissional de saúde.
      </p>
      <ListaConsultas pacienteId={eu.id} editavel={false} />
    </>
  )
}
