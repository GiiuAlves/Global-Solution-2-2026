// Contratos de dados combinados com o back-end Java (integrantes 2 e 3).
// Os nomes dos campos devem ser iguais aos dos DTOs do Spring Boot.

export interface Usuario {
  id: number
  nome: string
  dataNascimento?: string // AAAA-MM-DD
  telefone?: string
  contatoEmergenciaNome: string
  contatoEmergenciaTelefone: string
  tipoSanguineo?: string
  alergias?: string
  condicoes?: string
  necessidadesAcessibilidade?: string
}

export type StatusConsulta = 'AGENDADA' | 'REALIZADA' | 'CANCELADA'

export interface Consulta {
  id: number
  usuarioId: number
  especialidade: string
  profissional?: string
  local: string
  data: string // AAAA-MM-DD
  horario: string // HH:mm
  status: StatusConsulta
  observacoes?: string
}

export interface Medicamento {
  id: number
  usuarioId: number
  nome: string
  dosagem: string
  horarios: string[] // ["08:00", "20:00"]
  ativo: boolean
  observacoes?: string
}

export type CampoCarteirinha =
  | 'tipoSanguineo'
  | 'alergias'
  | 'condicoes'
  | 'medicamentos'
  | 'contatoEmergencia'
  | 'necessidadesAcessibilidade'

export interface Carteirinha {
  id: number
  usuarioId: number
  token: string // identificador aleatório usado no QR Code
  camposAutorizados: CampoCarteirinha[]
  ativa: boolean // false = compartilhamento revogado
  atualizadaEm: string
}

// O que a página pública (/c/:token) recebe — SOMENTE os campos autorizados.
export interface CarteirinhaPublica {
  nome: string
  idade?: number
  tipoSanguineo?: string
  alergias?: string
  condicoes?: string
  necessidadesAcessibilidade?: string
  contatoEmergencia?: { nome: string; telefone: string }
  medicamentos?: { nome: string; dosagem: string }[]
  atualizadaEm: string
}

export interface Estatisticas {
  totalConsultas: number
  consultasAgendadas: number
  consultasRealizadas: number
  consultasCanceladas: number
  totalMedicamentos: number
  medicamentosAtivos: number
  dosesPorDia: number
  consultasPorMes: { mes: string; total: number }[]
  consultasPorEspecialidade: { especialidade: string; total: number }[]
}

export type NovaConsulta = Omit<Consulta, 'id' | 'usuarioId'>
export type NovoMedicamento = Omit<Medicamento, 'id' | 'usuarioId'>
