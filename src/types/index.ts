// Contratos de dados combinados com o back-end Java (integrantes 2 e 3).
// Os nomes dos campos devem ser iguais aos dos DTOs do Spring Boot.

export type Perfil = 'PACIENTE' | 'PROFISSIONAL'

/** Médico, enfermeiro, farmacêutico… Único perfil que pode editar a ficha do paciente. */
export interface Profissional {
  id: number
  nome: string
  email: string
  conselho: string // ex.: "CRM-SP 123456"
  especialidade: string
  instituicao?: string
}

export const PARENTESCOS = [
  'Mãe', 'Pai', 'Filha', 'Filho', 'Esposa', 'Marido', 'Companheira', 'Companheiro',
  'Irmã', 'Irmão', 'Avó', 'Avô', 'Neta', 'Neto', 'Tia', 'Tio', 'Prima', 'Primo',
  'Sobrinha', 'Sobrinho', 'Nora', 'Genro', 'Cuidador(a)', 'Vizinho(a)', 'Amigo(a)', 'Outro',
] as const

export const NECESSIDADES = [
  'Baixa visão',
  'Cegueira (usa leitor de tela)',
  'Surdez (usa Libras)',
  'Dificuldade de fala',
  'Dificuldade de leitura',
  'Dificuldade de movimento',
  'Pouca prática com celular e computador',
] as const

/** Ficha do paciente. Criada e editada somente por um profissional vinculado. */
export interface Paciente {
  id: number
  nome: string
  cpf: string // 000.000.000-00 — usado para o paciente entrar
  dataNascimento: string // AAAA-MM-DD
  telefone?: string
  contatoEmergenciaNome: string
  contatoEmergenciaParentesco: string
  contatoEmergenciaTelefone: string
  tipoSanguineo?: string
  alergias?: string
  condicoes?: string
  necessidadesAcessibilidade: string[]
  observacoesAcessibilidade?: string
  profissionaisIds: number[] // profissionais vinculados (podem editar)
  criadoEm: string
}

export type DadosPaciente = Omit<Paciente, 'id' | 'profissionaisIds' | 'criadoEm'>
export type NovoPaciente = DadosPaciente & {
  consentimentoLgpd: boolean // paciente ou responsável autorizou o tratamento dos dados de saúde (LGPD, art. 11)
}

export type StatusConsulta = 'AGENDADA' | 'REALIZADA' | 'CANCELADA'

export interface Consulta {
  id: number
  pacienteId: number
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
  pacienteId: number
  nome: string
  dosagem: string
  horarios: string[] // ["08:00", "20:00"]
  ativo: boolean
  observacoes?: string
  prescritoPor?: string // "Dra. Helena Costa · CRM-SP 123456"
  inicio?: string // "AAAA-MM-DDTHH:mm" (horário local) — doses antes disso não contam na adesão
}

export type NovaConsulta = Omit<Consulta, 'id' | 'pacienteId'>
export type NovoMedicamento = Omit<Medicamento, 'id' | 'pacienteId' | 'prescritoPor' | 'inicio'>

export type CampoCarteirinha =
  | 'tipoSanguineo'
  | 'alergias'
  | 'condicoes'
  | 'medicamentos'
  | 'contatoEmergencia'
  | 'necessidadesAcessibilidade'

export interface Carteirinha {
  id: number
  pacienteId: number
  token: string // identificador aleatório usado no QR Code
  camposAutorizados: CampoCarteirinha[]
  ativa: boolean // false = compartilhamento desligado
  atualizadaEm: string
}

/** O que QUALQUER pessoa vê ao escanear o QR Code: só os campos autorizados. */
export interface ResumoEmergencia {
  nome: string
  idade?: number
  tipoSanguineo?: string
  alergias?: string
  condicoes?: string
  necessidadesAcessibilidade?: string
  contatoEmergencia?: { nome: string; parentesco: string; telefone: string }
  medicamentos?: { nome: string; dosagem: string }[]
  atualizadaEm: string
}

/** O que um PROFISSIONAL logado vê ao escanear: a ficha técnica completa. */
export interface FichaTecnica {
  paciente: Paciente
  medicamentos: Medicamento[]
  consultas: Consulta[]
  estatisticas: Estatisticas
  responsaveis: Profissional[]
  vinculado: boolean // true = este profissional pode editar
}

export type LeituraQr =
  | { tipo: 'EMERGENCIA'; dados: ResumoEmergencia }
  | { tipo: 'FICHA'; dados: FichaTecnica }

export interface DoseRegistro {
  id: number
  pacienteId: number
  medicamentoId: number
  data: string // AAAA-MM-DD
  horario: string // HH:mm previsto
  tomadaEm: string // ISO data/hora da confirmação
}

export interface Estatisticas {
  totalConsultas: number
  consultasAgendadas: number
  consultasRealizadas: number
  consultasCanceladas: number
  totalMedicamentos: number
  medicamentosAtivos: number
  dosesPorDia: number
  adesaoHoje: { tomadas: number; previstas: number }
  adesao7Dias: { data: string; dia: string; tomadas: number; previstas: number }[]
  adesaoPercentual7Dias: number | null
  consultasPorMes: { mes: string; total: number }[]
  consultasPorEspecialidade: { especialidade: string; total: number }[]
}

/** Linha da lista de pacientes do profissional. */
export interface ResumoPaciente {
  paciente: Paciente
  adesaoPercentual7Dias: number | null
  dosesHoje: { tomadas: number; total: number; atrasadas: number }
  proximaConsulta?: Consulta
  remediosAtivos: number
}

/** Histórico de alterações e acessos à ficha (rastreabilidade / LGPD). */
export interface Atividade {
  id: number
  pacienteId: number
  autor: string
  perfil: Perfil
  acao: string
  quando: string
}

export type Sessao =
  | { token: string; perfil: 'PACIENTE'; usuario: Paciente }
  | { token: string; perfil: 'PROFISSIONAL'; usuario: Profissional }

export type NovoProfissional = Omit<Profissional, 'id'> & { senha: string }
