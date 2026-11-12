import { useEffect, useState } from 'react'
import { Carregando, PageHeader } from '../../components/ui'
import { PainelCarteirinha } from '../../components/PainelCarteirinha'
import { usePaciente } from '../../context/AuthContext'
import { api } from '../../services/api'
import type { Paciente } from '../../types'

export default function Carteirinha() {
  const eu = usePaciente()
  const [p, setP] = useState<Paciente>()
  useEffect(() => { api.getPaciente(eu.id).then(setP) }, [eu.id])
  return (
    <>
      <PageHeader titulo="Carteirinha digital" descricao="Mostre o QR Code em uma emergência ou no atendimento." />
      {p ? <PainelCarteirinha paciente={p} editavel={false} /> : <Carregando />}
    </>
  )
}
