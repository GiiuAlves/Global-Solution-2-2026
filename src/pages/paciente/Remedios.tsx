import { Info } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { ListaMedicamentos } from '../../components/ListaMedicamentos'
import { usePaciente } from '../../context/AuthContext'

export default function Remedios() {
  const eu = usePaciente()
  return (
    <>
      <PageHeader titulo="Meus remédios" descricao="O que tomar e em que horário, como o seu profissional de saúde prescreveu." />
      <p className="mb-6 flex items-start gap-2 rounded-xl bg-page p-4 text-muted">
        <Info size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />
        Para evitar erros, só o profissional pode mudar dose e horário. Aqui você ouve as instruções e cria alarmes no celular.
      </p>
      <ListaMedicamentos pacienteId={eu.id} editavel={false} />
    </>
  )
}
