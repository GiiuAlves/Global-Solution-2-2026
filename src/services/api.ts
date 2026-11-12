import type {
  Atividade,
  CampoCarteirinha,
  Carteirinha,
  Consulta,
  DadosPaciente,
  DoseRegistro,
  Estatisticas,
  LeituraQr,
  Medicamento,
  NovaConsulta,
  NovoMedicamento,
  NovoPaciente,
  NovoProfissional,
  Paciente,
  Perfil,
  Profissional,
  ResumoPaciente,
  Sessao,
} from '../types'

/**
 * Camada de comunicação com o back-end Java.
 *
 * - Com VITE_API_URL definido (ex.: http://localhost:8080), as chamadas vão para a API Spring Boot,
 *   com o token da sessão no cabeçalho Authorization: Bearer <token>.
 * - Sem VITE_API_URL, o site roda em MODO DEMONSTRAÇÃO, com dados fictícios salvos no navegador.
 *   As mesmas regras de permissão do back-end são aplicadas aqui:
 *     • PROFISSIONAL vinculado: lê e edita a ficha do paciente.
 *     • PACIENTE: só lê a própria ficha; pode apenas confirmar doses e desligar o QR Code.
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
export const MODO_DEMO = !BASE_URL

export const DEMO = {
  profissional: { email: 'helena@saudefacil.com', senha: 'demo1234', nome: 'Dra. Helena Costa' },
  outroProfissional: { email: 'rafael@saudefacil.com', senha: 'demo1234', nome: 'Dr. Rafael Nunes' },
  paciente: { cpf: '123.456.789-09', senha: '4821-7395', nome: 'Maria Aparecida Silva' },
}

/* ------------------------------------------------------------------ */
/* Sessão                                                              */
/* ------------------------------------------------------------------ */

const SESSAO_KEY = 'saude-facil:sessao-v3'
let sessao: Sessao | null = (() => {
  try {
    return JSON.parse(localStorage.getItem(SESSAO_KEY) || 'null') as Sessao | null
  } catch {
    return null
  }
})()

function guardarSessao(s: Sessao | null) {
  sessao = s
  try {
    if (s) localStorage.setItem(SESSAO_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSAO_KEY)
  } catch {
    /* sem armazenamento: a sessão vale só enquanto a aba estiver aberta */
  }
}
export const getSessao = () => sessao

export class SessaoExpirada extends Error {
  constructor() {
    super('Sua sessão terminou. Entre novamente.')
  }
}
export class SemPermissao extends Error {
  constructor(msg = 'Somente o profissional de saúde responsável pode alterar esta ficha.') {
    super(msg)
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(sessao ? { Authorization: `Bearer ${sessao.token}` } : {}),
    },
  })
  if (res.status === 401) {
    guardarSessao(null)
    throw new SessaoExpirada()
  }
  if (res.status === 403) throw new SemPermissao()
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Erro ${res.status} ao acessar o servidor`)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}
const body = (data: unknown) => JSON.stringify(data)

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export function iso(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
function emDias(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}
const agoraHHMM = () => new Date().toTimeString().slice(0, 5)
const soDigitos = (s: string) => s.replace(/\D/g, '')

export function idade(dataNascimento?: string) {
  if (!dataNascimento) return undefined
  const n = new Date(dataNascimento + 'T12:00:00')
  const h = new Date()
  let i = h.getFullYear() - n.getFullYear()
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) i--
  return i
}

function novoToken() {
  try {
    return crypto.randomUUID().replace(/-/g, '')
  } catch {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }
}

/** Senha de acesso do paciente: 8 números, fácil de digitar (ex.: 4821-7395). */
function gerarSenhaAcesso() {
  const n = new Uint32Array(2)
  try {
    crypto.getRandomValues(n)
  } catch {
    n[0] = Math.random() * 1e9
    n[1] = Math.random() * 1e9
  }
  const d = (String(n[0]).padStart(4, '0').slice(-4) + String(n[1]).padStart(4, '0').slice(-4))
  return `${d.slice(0, 4)}-${d.slice(4)}`
}

/** Senhas nunca ficam em texto: só o hash SHA-256 (no back-end real: BCrypt). */
async function hashSenha(senha: string) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('saude-facil:' + senha))
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    let h = 0
    for (const c of 'saude-facil:' + senha) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0
    return 'fallback-' + h
  }
}

export const assinatura = (p: Profissional) => `${p.nome} · ${p.conselho}`

/** Data e hora local no formato "AAAA-MM-DDTHH:mm". */
function agoraLocal() {
  const d = new Date()
  return `${iso(d)}T${d.toTimeString().slice(0, 5)}`
}
/** A dose daquele dia/horário já fazia parte da prescrição? (remédio novo não gera "esquecimento" retroativo) */
export function dosePrevista(m: Pick<Medicamento, 'inicio'>, data: string, horario: string) {
  return !m.inicio || `${data}T${horario}` >= m.inicio
}

/* ------------------------------------------------------------------ */
/* Modo demonstração: "banco de dados" no navegador                    */
/* ------------------------------------------------------------------ */

interface ProfissionalDB extends Profissional { senhaHash: string }
interface PacienteDB extends Paciente { senhaHash: string; consentimentoEm: string }
interface DB {
  profissionais: ProfissionalDB[]
  pacientes: PacienteDB[]
  consultas: Consulta[]
  medicamentos: Medicamento[]
  carteirinhas: Carteirinha[]
  doses: DoseRegistro[]
  atividades: Atividade[]
  seq: number
}

const STORAGE_KEY = 'saude-facil:demo-v3'
let memoria: DB | null = null

async function seed(): Promise<DB> {
  const senhaPro = await hashSenha(DEMO.profissional.senha)
  const helena: ProfissionalDB = { id: 1, nome: 'Dra. Helena Costa', email: DEMO.profissional.email, conselho: 'CRM-SP 123456', especialidade: 'Cardiologia', instituicao: 'Hospital São Lucas', senhaHash: senhaPro }
  const rafael: ProfissionalDB = { id: 2, nome: 'Dr. Rafael Nunes', email: DEMO.outroProfissional.email, conselho: 'CRM-SP 654321', especialidade: 'Clínica médica', instituicao: 'UPA Vila Mariana', senhaHash: senhaPro }
  const assHelena = assinatura(helena)
  const criado = new Date(Date.now() - 120 * 864e5).toISOString()

  const pacientes: PacienteDB[] = [
    {
      id: 10, nome: 'Maria Aparecida Silva', cpf: DEMO.paciente.cpf, dataNascimento: '1954-03-12', telefone: '(11) 98888-1234',
      contatoEmergenciaNome: 'Ana Silva', contatoEmergenciaParentesco: 'Filha', contatoEmergenciaTelefone: '(11) 97777-5678',
      tipoSanguineo: 'O+', alergias: 'Dipirona', condicoes: 'Hipertensão',
      necessidadesAcessibilidade: ['Baixa visão'], observacoesAcessibilidade: 'Prefere letras grandes e informações faladas.',
      profissionaisIds: [1], criadoEm: criado, senhaHash: await hashSenha(soDigitos(DEMO.paciente.senha)), consentimentoEm: criado,
    },
    {
      id: 11, nome: 'José Carlos Souza', cpf: '987.654.321-00', dataNascimento: '1948-07-02', telefone: '(11) 96666-2211',
      contatoEmergenciaNome: 'Rita Souza', contatoEmergenciaParentesco: 'Esposa', contatoEmergenciaTelefone: '(11) 95555-3344',
      tipoSanguineo: 'A+', alergias: '', condicoes: 'Diabetes tipo 2; insuficiência cardíaca',
      necessidadesAcessibilidade: ['Surdez (usa Libras)', 'Pouca prática com celular e computador'], observacoesAcessibilidade: 'Comunicar por escrito ou com intérprete de Libras.',
      profissionaisIds: [1], criadoEm: criado, senhaHash: await hashSenha('11223344'), consentimentoEm: criado,
    },
    {
      id: 12, nome: 'Lúcia Ferreira Lima', cpf: '456.123.789-55', dataNascimento: '1961-11-20', telefone: '(11) 94444-9090',
      contatoEmergenciaNome: 'Pedro Lima', contatoEmergenciaParentesco: 'Filho', contatoEmergenciaTelefone: '(11) 93333-1212',
      tipoSanguineo: 'B-', alergias: 'Penicilina', condicoes: 'Hipotireoidismo',
      necessidadesAcessibilidade: ['Cegueira (usa leitor de tela)'], observacoesAcessibilidade: 'Usa leitor de tela no celular. Descrever tudo em voz alta.',
      profissionaisIds: [1], criadoEm: criado, senhaHash: await hashSenha('55667788'), consentimentoEm: criado,
    },
  ]

  const med = (id: number, pacienteId: number, nome: string, dosagem: string, horarios: string[], observacoes?: string): Medicamento =>
    ({ id, pacienteId, nome, dosagem, horarios, ativo: true, observacoes, prescritoPor: assHelena, inicio: `${emDias(-90)}T00:00` })
  const medicamentos: Medicamento[] = [
    med(1, 10, 'Losartana', '50 mg — 1 comprimido', ['08:00', '20:00']),
    med(2, 10, 'Vitamina D', '1 cápsula', ['12:00'], 'Tomar após o almoço'),
    med(3, 10, 'Colírio lubrificante', '1 gota em cada olho', ['09:00', '15:00', '21:00']),
    med(4, 11, 'Metformina', '850 mg — 1 comprimido', ['07:30', '19:30'], 'Junto com a refeição'),
    med(5, 11, 'Furosemida', '40 mg — 1 comprimido', ['08:00'], 'Pela manhã'),
    med(6, 11, 'Carvedilol', '6,25 mg — 1 comprimido', ['08:00', '20:00']),
    med(7, 12, 'Levotiroxina', '75 mcg — 1 comprimido', ['06:30'], 'Em jejum, 30 min antes do café'),
  ]

  // Histórico de doses dos últimos 6 dias. Cada paciente tem um padrão de esquecimento diferente.
  const esquece: Record<number, (dia: number, h: string, k: number) => boolean> = {
    10: (dia, h) => ['-6|21:00', '-5|15:00', '-4|12:00', '-3|21:00', '-3|15:00', '-1|20:00'].includes(`${dia}|${h}`) || (dia === 0 && h === '09:00'),
    11: (dia, h, k) => (k + dia * 3) % 5 < 3 || h >= '19:00',
    12: () => false,
  }
  const doses: DoseRegistro[] = []
  let doseId = 1
  for (let dia = -6; dia <= 0; dia++)
    medicamentos.forEach((m, mi) =>
      m.horarios.forEach((h, hi) => {
        if (dia === 0 && h > agoraHHMM()) return
        if (esquece[m.pacienteId](dia, h, mi * 2 + hi)) return
        const t = new Date(`${emDias(dia)}T${h}:00`)
        if (dia < 0) t.setMinutes(t.getMinutes() + ((mi * 7 + hi * 3 + dia + 21) % 20)) // confirmou alguns minutos depois
        doses.push({ id: doseId++, pacienteId: m.pacienteId, medicamentoId: m.id, data: emDias(dia), horario: h, tomadaEm: t.toISOString() })
      }),
    )

  const c = (id: number, pacienteId: number, especialidade: string, profissional: string | undefined, local: string, dia: number, horario: string, status: Consulta['status'], observacoes?: string): Consulta =>
    ({ id, pacienteId, especialidade, profissional, local, data: emDias(dia), horario, status, observacoes })
  const consultas: Consulta[] = [
    c(1, 10, 'Clínico geral', 'Dr. Paulo Mendes', 'UBS Vila Mariana', -112, '08:30', 'REALIZADA'),
    c(2, 10, 'Cardiologia', 'Dra. Helena Costa', 'Hospital São Lucas', -80, '10:00', 'REALIZADA'),
    c(3, 10, 'Exame de sangue', undefined, 'Laboratório Central', -52, '07:00', 'REALIZADA', 'Jejum de 8 horas'),
    c(4, 10, 'Oftalmologia', 'Dr. Ricardo Lima', 'Clínica Visão', -24, '14:00', 'CANCELADA'),
    c(5, 10, 'Clínico geral', 'Dr. Paulo Mendes', 'UBS Vila Mariana', -9, '09:00', 'REALIZADA'),
    c(6, 10, 'Oftalmologia', 'Dr. Ricardo Lima', 'Clínica Visão', 8, '09:00', 'AGENDADA', 'Levar os óculos atuais'),
    c(7, 10, 'Cardiologia', 'Dra. Helena Costa', 'Hospital São Lucas', 23, '10:30', 'AGENDADA', 'Retorno com exames'),
    c(8, 11, 'Cardiologia', 'Dra. Helena Costa', 'Hospital São Lucas', -30, '11:00', 'REALIZADA'),
    c(9, 11, 'Endocrinologia', 'Dr. Marcos Tavares', 'Ambulatório Central', 3, '14:30', 'AGENDADA', 'Levar glicemias anotadas. Intérprete de Libras solicitado.'),
    c(10, 12, 'Endocrinologia', 'Dr. Marcos Tavares', 'Ambulatório Central', -45, '09:30', 'REALIZADA'),
    c(11, 12, 'Exame de sangue', undefined, 'Laboratório Central', 15, '07:00', 'AGENDADA', 'TSH e T4 livre. Jejum de 4 horas.'),
  ]

  const carteirinhas: Carteirinha[] = pacientes.map((p, i) => ({
    id: i + 1,
    pacienteId: p.id,
    token: novoToken(),
    camposAutorizados: ['tipoSanguineo', 'alergias', 'contatoEmergencia', 'necessidadesAcessibilidade', 'medicamentos'],
    ativa: true,
    atualizadaEm: criado,
  }))

  const atv = (id: number, pacienteId: number, dias: number, acao: string): Atividade =>
    ({ id, pacienteId, autor: assHelena, perfil: 'PROFISSIONAL', acao, quando: new Date(Date.now() - dias * 864e5).toISOString() })
  const atividades: Atividade[] = [
    atv(1, 10, 120, 'Cadastrou a paciente e gerou a senha de acesso'),
    atv(2, 10, 80, 'Prescreveu Losartana 50 mg — 08:00 e 20:00'),
    atv(3, 10, 80, 'Prescreveu Vitamina D — 12:00'),
    atv(4, 10, 24, 'Prescreveu Colírio lubrificante — 09:00, 15:00 e 21:00'),
    atv(5, 10, 9, 'Agendou Cardiologia (retorno com exames)'),
    atv(6, 11, 120, 'Cadastrou o paciente e gerou a senha de acesso'),
    atv(7, 11, 30, 'Ajustou Carvedilol para 6,25 mg'),
    atv(8, 12, 120, 'Cadastrou a paciente e gerou a senha de acesso'),
  ]

  return { seq: 1000, profissionais: [helena, rafael], pacientes, consultas, medicamentos, carteirinhas, doses, atividades }
}

async function db(): Promise<DB> {
  if (memoria) return memoria
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return (memoria = JSON.parse(raw) as DB)
  } catch {
    /* navegador sem armazenamento: segue só em memória */
  }
  memoria = await seed()
  salvar()
  return memoria
}
function salvar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoria))
  } catch {
    /* ignora */
  }
}
const espera = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 120))
const proximoId = (d: DB) => ++d.seq

const semSenhaPac = ({ senhaHash: _h, consentimentoEm: _c, ...p }: PacienteDB): Paciente => p
const semSenhaPro = ({ senhaHash: _h, ...p }: ProfissionalDB): Profissional => p

/* ---------- Regras de permissão (iguais às do back-end) ---------- */

function exigeSessao(): Sessao {
  if (!sessao) throw new SessaoExpirada()
  return sessao
}
function exigeProfissional(): Profissional {
  const s = exigeSessao()
  if (s.perfil !== 'PROFISSIONAL') throw new SemPermissao()
  return s.usuario
}
/** Paciente lê só a própria ficha; profissional lê fichas vinculadas. */
function podeLer(d: DB, pacienteId: number) {
  const s = exigeSessao()
  const p = d.pacientes.find((x) => x.id === pacienteId)
  if (!p) throw new Error('Paciente não encontrado.')
  if (s.perfil === 'PACIENTE' ? s.usuario.id !== pacienteId : !p.profissionaisIds.includes(s.usuario.id))
    throw new SemPermissao('Você não tem acesso a esta ficha.')
  return p
}
/** Só profissional vinculado edita. */
function podeEditar(d: DB, pacienteId: number) {
  const pro = exigeProfissional()
  const p = d.pacientes.find((x) => x.id === pacienteId)
  if (!p || !p.profissionaisIds.includes(pro.id)) throw new SemPermissao()
  return { p, pro }
}
function registrar(d: DB, pacienteId: number, acao: string) {
  const s = exigeSessao()
  d.atividades.push({
    id: proximoId(d),
    pacienteId,
    autor: s.perfil === 'PROFISSIONAL' ? assinatura(s.usuario) : `${s.usuario.nome} (paciente)`,
    perfil: s.perfil,
    acao,
    quando: new Date().toISOString(),
  })
}

/* ---------- Estatísticas ---------- */

function calcularEstatisticas(d: DB, pacienteId: number): Estatisticas {
  const c = d.consultas.filter((x) => x.pacienteId === pacienteId)
  const meds = d.medicamentos.filter((x) => x.pacienteId === pacienteId)
  const doses = d.doses.filter((x) => x.pacienteId === pacienteId)
  const hoje = new Date()

  const meses: { mes: string; total: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const chave = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`
    meses.push({
      mes: ref.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      total: c.filter((x) => x.data.startsWith(chave) && x.status !== 'CANCELADA').length,
    })
  }
  const porEsp = new Map<string, number>()
  c.filter((x) => x.status !== 'CANCELADA').forEach((x) => porEsp.set(x.especialidade, (porEsp.get(x.especialidade) ?? 0) + 1))

  // Adesão = doses confirmadas ÷ doses previstas. Hoje só contam horários que já passaram (ou já confirmados).
  const ativos = meds.filter((m) => m.ativo)
  const dosesPorDia = ativos.reduce((s, m) => s + m.horarios.length, 0)
  const hojeISO = iso(hoje)
  const agora = agoraHHMM()
  const adesao7Dias = Array.from({ length: 7 }, (_, k) => {
    const dt = new Date()
    dt.setDate(dt.getDate() - (6 - k))
    const data = iso(dt)
    const tomou = (m: Medicamento, h: string) => doses.some((x) => x.data === data && x.medicamentoId === m.id && x.horario === h)
    let previstas = 0, tomadas = 0
    for (const m of ativos)
      for (const h of m.horarios) {
        if (!dosePrevista(m, data, h) && !tomou(m, h)) continue // remédio ainda não existia
        if (data === hojeISO && h > agora && !tomou(m, h)) continue // ainda não chegou a hora
        previstas++
        if (tomou(m, h)) tomadas++
      }
    return { data, dia: dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), tomadas, previstas }
  })
  const totPrev = adesao7Dias.reduce((s, x) => s + x.previstas, 0)
  const totTom = adesao7Dias.reduce((s, x) => s + Math.min(x.tomadas, x.previstas), 0)

  return {
    totalConsultas: c.length,
    consultasAgendadas: c.filter((x) => x.status === 'AGENDADA').length,
    consultasRealizadas: c.filter((x) => x.status === 'REALIZADA').length,
    consultasCanceladas: c.filter((x) => x.status === 'CANCELADA').length,
    totalMedicamentos: meds.length,
    medicamentosAtivos: ativos.length,
    dosesPorDia,
    adesaoHoje: { tomadas: doses.filter((x) => x.data === hojeISO).length, previstas: dosesPorDia },
    adesao7Dias,
    adesaoPercentual7Dias: totPrev ? Math.round((totTom / totPrev) * 100) : null,
    consultasPorMes: meses,
    consultasPorEspecialidade: [...porEsp.entries()].map(([especialidade, total]) => ({ especialidade, total })).sort((a, b) => b.total - a.total),
  }
}

function resumoPaciente(d: DB, p: PacienteDB): ResumoPaciente {
  const est = calcularEstatisticas(d, p.id)
  const hoje = iso(new Date())
  const agora = agoraHHMM()
  const ativos = d.medicamentos.filter((m) => m.pacienteId === p.id && m.ativo)
  const dosesHoje = d.doses.filter((x) => x.pacienteId === p.id && x.data === hoje)
  let total = 0, tomadas = 0, atrasadas = 0
  for (const m of ativos)
    for (const h of m.horarios) {
      const ok0 = dosesHoje.some((x) => x.medicamentoId === m.id && x.horario === h)
      if (!dosePrevista(m, hoje, h) && !ok0) continue
      total++
      const ok = dosesHoje.some((x) => x.medicamentoId === m.id && x.horario === h)
      if (ok) tomadas++
      else if (h < agora) atrasadas++
    }
  const proximaConsulta = d.consultas
    .filter((c) => c.pacienteId === p.id && c.status === 'AGENDADA' && c.data >= hoje)
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))[0]
  return { paciente: semSenhaPac(p), adesaoPercentual7Dias: est.adesaoPercentual7Dias, dosesHoje: { tomadas, total, atrasadas }, proximaConsulta, remediosAtivos: ativos.length }
}

const ROTULO_STATUS = { AGENDADA: 'agendada', REALIZADA: 'realizada', CANCELADA: 'cancelada' }
const fmtData = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

/* ------------------------------------------------------------------ */
/* API usada pelas telas                                               */
/* ------------------------------------------------------------------ */

export const api = {
  /* ================= Autenticação ================= */

  /** Paciente entra com CPF + senha de acesso. Profissional entra com e-mail + senha. */
  entrar: async (perfil: Perfil, login: string, senha: string): Promise<Sessao> => {
    let s: Sessao
    if (!MODO_DEMO) {
      s = await http<Sessao>('/api/auth/login', { method: 'POST', body: body({ perfil, login, senha }) })
    } else {
      const d = await db()
      if (perfil === 'PACIENTE') {
        const p = d.pacientes.find((x) => soDigitos(x.cpf) === soDigitos(login))
        if (!p || p.senhaHash !== (await hashSenha(soDigitos(senha)))) {
          await espera(null)
          throw new Error('CPF ou senha de acesso incorretos. A senha está no papel entregue pelo seu profissional de saúde.')
        }
        s = { token: novoToken(), perfil, usuario: semSenhaPac(p) }
      } else {
        const p = d.profissionais.find((x) => x.email.toLowerCase() === login.trim().toLowerCase())
        if (!p || p.senhaHash !== (await hashSenha(senha))) {
          await espera(null)
          throw new Error('E-mail ou senha incorretos. Confira e tente de novo.')
        }
        s = { token: novoToken(), perfil, usuario: semSenhaPro(p) }
      }
    }
    guardarSessao(s)
    return espera(s)
  },

  cadastrarProfissional: async (novo: NovoProfissional): Promise<Sessao> => {
    let s: Sessao
    if (!MODO_DEMO) {
      s = await http<Sessao>('/api/auth/profissionais', { method: 'POST', body: body(novo) })
    } else {
      const d = await db()
      const email = novo.email.trim().toLowerCase()
      if (d.profissionais.some((x) => x.email.toLowerCase() === email)) throw new Error('Já existe uma conta com este e-mail. Use "Entrar".')
      if (d.profissionais.some((x) => x.conselho === novo.conselho)) throw new Error('Este registro profissional já está cadastrado.')
      const { senha, ...dados } = novo
      const p: ProfissionalDB = { ...dados, email, id: proximoId(d), senhaHash: await hashSenha(senha) }
      d.profissionais.push(p)
      salvar()
      s = { token: novoToken(), perfil: 'PROFISSIONAL', usuario: semSenhaPro(p) }
    }
    guardarSessao(s)
    return espera(s)
  },

  sair: () => guardarSessao(null),

  /** Confere se a sessão salva ainda vale (conta apagada, token expirado…). */
  validarSessao: async (): Promise<void> => {
    const s = exigeSessao()
    if (!MODO_DEMO) {
      await http('/api/auth/me')
      return
    }
    const d = await db()
    const existe = s.perfil === 'PACIENTE' ? d.pacientes.some((x) => x.id === s.usuario.id) : d.profissionais.some((x) => x.id === s.usuario.id)
    if (!existe) {
      guardarSessao(null)
      throw new SessaoExpirada()
    }
  },

  /* ================= Profissional: pacientes ================= */

  listarPacientes: async (): Promise<ResumoPaciente[]> => {
    const pro = exigeProfissional()
    if (!MODO_DEMO) return http('/api/profissionais/me/pacientes')
    const d = await db()
    return espera(d.pacientes.filter((p) => p.profissionaisIds.includes(pro.id)).map((p) => resumoPaciente(d, p)))
  },

  /** Cadastro feito pelo profissional. Devolve a senha de acesso (mostrada só uma vez). */
  criarPaciente: async (novo: NovoPaciente): Promise<{ paciente: Paciente; senhaAcesso: string }> => {
    if (!novo.consentimentoLgpd) throw new Error('Confirme a autorização do paciente ou responsável (LGPD).')
    if (!MODO_DEMO) return http('/api/pacientes', { method: 'POST', body: body(novo) })
    const pro = exigeProfissional()
    const d = await db()
    if (d.pacientes.some((x) => soDigitos(x.cpf) === soDigitos(novo.cpf))) throw new Error('Já existe um paciente com este CPF. Peça para ele mostrar o QR Code da carteirinha para vincular.')
    const senhaAcesso = gerarSenhaAcesso()
    const { consentimentoLgpd: _c, ...dados } = novo
    const agora = new Date().toISOString()
    const p: PacienteDB = { ...dados, id: proximoId(d), profissionaisIds: [pro.id], criadoEm: agora, senhaHash: await hashSenha(soDigitos(senhaAcesso)), consentimentoEm: agora }
    d.pacientes.push(p)
    d.carteirinhas.push({ id: proximoId(d), pacienteId: p.id, token: novoToken(), camposAutorizados: ['tipoSanguineo', 'alergias', 'contatoEmergencia', 'necessidadesAcessibilidade', 'medicamentos'], ativa: true, atualizadaEm: agora })
    registrar(d, p.id, 'Cadastrou o paciente e gerou a senha de acesso')
    salvar()
    return espera({ paciente: semSenhaPac(p), senhaAcesso })
  },

  atualizarPaciente: async (pacienteId: number, dados: DadosPaciente): Promise<Paciente> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}`, { method: 'PUT', body: body(dados) })
    const d = await db()
    const { p } = podeEditar(d, pacienteId)
    if (d.pacientes.some((x) => x.id !== pacienteId && soDigitos(x.cpf) === soDigitos(dados.cpf))) throw new Error('Este CPF já pertence a outro paciente.')
    Object.assign(p, dados)
    registrar(d, pacienteId, 'Atualizou dados pessoais, emergência e acessibilidade')
    salvar()
    return espera(semSenhaPac(p))
  },

  novaSenhaAcesso: async (pacienteId: number): Promise<string> => {
    if (!MODO_DEMO) return (await http<{ senhaAcesso: string }>(`/api/pacientes/${pacienteId}/senha`, { method: 'POST' })).senhaAcesso
    const d = await db()
    const { p } = podeEditar(d, pacienteId)
    const senha = gerarSenhaAcesso()
    p.senhaHash = await hashSenha(soDigitos(senha))
    registrar(d, pacienteId, 'Gerou uma nova senha de acesso (a anterior parou de funcionar)')
    salvar()
    return espera(senha)
  },

  /** Profissional que leu o QR Code passa a acompanhar (e poder editar) o paciente. */
  vincularPorToken: async (token: string): Promise<number> => {
    if (!MODO_DEMO) return (await http<{ pacienteId: number }>(`/api/carteirinha/${encodeURIComponent(token)}/vinculo`, { method: 'POST' })).pacienteId
    const pro = exigeProfissional()
    const d = await db()
    const c = d.carteirinhas.find((x) => x.token === token && x.ativa)
    const p = c && d.pacientes.find((x) => x.id === c.pacienteId)
    if (!p) throw new Error('QR Code inválido ou desligado.')
    if (!p.profissionaisIds.includes(pro.id)) {
      p.profissionaisIds.push(pro.id)
      registrar(d, p.id, 'Vinculou-se ao paciente pelo QR Code da carteirinha')
      salvar()
    }
    return espera(p.id)
  },

  listarAtividades: async (pacienteId: number): Promise<Atividade[]> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/atividades`)
    const d = await db()
    podeLer(d, pacienteId)
    return espera(d.atividades.filter((x) => x.pacienteId === pacienteId).sort((a, b) => b.quando.localeCompare(a.quando)))
  },

  /* ================= Ficha (paciente e profissional) ================= */

  getPaciente: async (pacienteId: number): Promise<Paciente> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}`)
    return espera(semSenhaPac(podeLer(await db(), pacienteId)))
  },

  /** Profissionais que cuidam do paciente (aparece para o paciente: "Quem cuida de você"). */
  getResponsaveis: async (pacienteId: number): Promise<Profissional[]> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/profissionais`)
    const d = await db()
    const p = podeLer(d, pacienteId)
    return espera(d.profissionais.filter((x) => p.profissionaisIds.includes(x.id)).map(semSenhaPro))
  },

  /** O próprio paciente pode apagar a conta e todos os dados (direito do titular, LGPD). */
  excluirMinhaConta: async (): Promise<void> => {
    const s = exigeSessao()
    if (s.perfil !== 'PACIENTE') throw new SemPermissao()
    const id = s.usuario.id
    if (!MODO_DEMO) await http(`/api/pacientes/${id}`, { method: 'DELETE' })
    else {
      const d = await db()
      d.pacientes = d.pacientes.filter((x) => x.id !== id)
      d.consultas = d.consultas.filter((x) => x.pacienteId !== id)
      d.medicamentos = d.medicamentos.filter((x) => x.pacienteId !== id)
      d.carteirinhas = d.carteirinhas.filter((x) => x.pacienteId !== id)
      d.doses = d.doses.filter((x) => x.pacienteId !== id)
      d.atividades = d.atividades.filter((x) => x.pacienteId !== id)
      salvar()
    }
    guardarSessao(null)
  },

  /* ---------- Consultas ---------- */

  listarConsultas: async (pacienteId: number): Promise<Consulta[]> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/consultas`)
    const d = await db()
    podeLer(d, pacienteId)
    return espera(d.consultas.filter((x) => x.pacienteId === pacienteId))
  },

  criarConsulta: async (pacienteId: number, c: NovaConsulta): Promise<Consulta> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/consultas`, { method: 'POST', body: body(c) })
    const d = await db()
    podeEditar(d, pacienteId)
    const nova: Consulta = { ...c, id: proximoId(d), pacienteId }
    d.consultas.push(nova)
    registrar(d, pacienteId, `Agendou ${c.especialidade} para ${fmtData(c.data)} às ${c.horario}`)
    salvar()
    return espera(nova)
  },

  atualizarConsulta: async (c: Consulta): Promise<Consulta> => {
    if (!MODO_DEMO) return http(`/api/consultas/${c.id}`, { method: 'PUT', body: body(c) })
    const d = await db()
    podeEditar(d, c.pacienteId)
    const antes = d.consultas.find((x) => x.id === c.id)
    d.consultas = d.consultas.map((x) => (x.id === c.id ? c : x))
    registrar(d, c.pacienteId, antes && antes.status !== c.status
      ? `Marcou ${c.especialidade} de ${fmtData(c.data)} como ${ROTULO_STATUS[c.status]}`
      : `Alterou a consulta de ${c.especialidade} (${fmtData(c.data)} às ${c.horario})`)
    salvar()
    return espera(c)
  },

  excluirConsulta: async (c: Consulta): Promise<void> => {
    if (!MODO_DEMO) return http(`/api/consultas/${c.id}`, { method: 'DELETE' })
    const d = await db()
    podeEditar(d, c.pacienteId)
    d.consultas = d.consultas.filter((x) => x.id !== c.id)
    registrar(d, c.pacienteId, `Excluiu a consulta de ${c.especialidade} de ${fmtData(c.data)}`)
    salvar()
    return espera(undefined)
  },

  /* ---------- Medicamentos (prescrição) ---------- */

  listarMedicamentos: async (pacienteId: number): Promise<Medicamento[]> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/medicamentos`)
    const d = await db()
    podeLer(d, pacienteId)
    return espera(d.medicamentos.filter((x) => x.pacienteId === pacienteId))
  },

  criarMedicamento: async (pacienteId: number, m: NovoMedicamento): Promise<Medicamento> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/medicamentos`, { method: 'POST', body: body(m) })
    const d = await db()
    const { pro } = podeEditar(d, pacienteId)
    const novo: Medicamento = { ...m, id: proximoId(d), pacienteId, prescritoPor: assinatura(pro), inicio: agoraLocal() }
    d.medicamentos.push(novo)
    registrar(d, pacienteId, `Prescreveu ${m.nome} (${m.dosagem}) — ${m.horarios.join(', ')}`)
    salvar()
    return espera(novo)
  },

  atualizarMedicamento: async (m: Medicamento): Promise<Medicamento> => {
    if (!MODO_DEMO) return http(`/api/medicamentos/${m.id}`, { method: 'PUT', body: body(m) })
    const d = await db()
    const { pro } = podeEditar(d, m.pacienteId)
    const antes = d.medicamentos.find((x) => x.id === m.id)
    const salvo = { ...m, prescritoPor: assinatura(pro) }
    d.medicamentos = d.medicamentos.map((x) => (x.id === m.id ? salvo : x))
    registrar(d, m.pacienteId, antes && antes.ativo !== m.ativo
      ? `${m.ativo ? 'Retomou' : 'Suspendeu'} ${m.nome}`
      : `Alterou a prescrição de ${m.nome}: ${m.dosagem} — ${m.horarios.join(', ')}`)
    salvar()
    return espera(salvo)
  },

  excluirMedicamento: async (m: Medicamento): Promise<void> => {
    if (!MODO_DEMO) return http(`/api/medicamentos/${m.id}`, { method: 'DELETE' })
    const d = await db()
    podeEditar(d, m.pacienteId)
    d.medicamentos = d.medicamentos.filter((x) => x.id !== m.id)
    d.doses = d.doses.filter((x) => x.medicamentoId !== m.id)
    registrar(d, m.pacienteId, `Excluiu ${m.nome} da prescrição`)
    salvar()
    return espera(undefined)
  },

  /* ---------- Doses ("Tomei") — só o próprio paciente confirma ---------- */

  listarDoses: async (pacienteId: number, data: string): Promise<DoseRegistro[]> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/doses?data=${data}`)
    const d = await db()
    podeLer(d, pacienteId)
    return espera(d.doses.filter((x) => x.pacienteId === pacienteId && x.data === data))
  },

  registrarDose: async (medicamentoId: number, data: string, horario: string): Promise<DoseRegistro> => {
    const s = exigeSessao()
    if (s.perfil !== 'PACIENTE') throw new SemPermissao('Só o paciente confirma as próprias doses.')
    const pacienteId = s.usuario.id
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/doses`, { method: 'POST', body: body({ medicamentoId, data, horario }) })
    const d = await db()
    const existente = d.doses.find((x) => x.pacienteId === pacienteId && x.medicamentoId === medicamentoId && x.data === data && x.horario === horario)
    if (existente) return espera(existente)
    const dose: DoseRegistro = { id: proximoId(d), pacienteId, medicamentoId, data, horario, tomadaEm: new Date().toISOString() }
    d.doses.push(dose)
    salvar()
    return espera(dose)
  },

  desfazerDose: async (doseId: number): Promise<void> => {
    const s = exigeSessao()
    if (s.perfil !== 'PACIENTE') throw new SemPermissao()
    if (!MODO_DEMO) return http(`/api/doses/${doseId}`, { method: 'DELETE' })
    const d = await db()
    d.doses = d.doses.filter((x) => !(x.id === doseId && x.pacienteId === s.usuario.id))
    salvar()
    return espera(undefined)
  },

  /* ---------- Carteirinha ---------- */

  getCarteirinha: async (pacienteId: number): Promise<Carteirinha> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/carteirinha`)
    const d = await db()
    podeLer(d, pacienteId)
    return espera(d.carteirinhas.find((x) => x.pacienteId === pacienteId)!)
  },

  atualizarCampos: async (pacienteId: number, campos: CampoCarteirinha[]): Promise<Carteirinha> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/carteirinha`, { method: 'PUT', body: body({ camposAutorizados: campos }) })
    const d = await db()
    podeEditar(d, pacienteId)
    const c = d.carteirinhas.find((x) => x.pacienteId === pacienteId)!
    c.camposAutorizados = campos
    c.atualizadaEm = new Date().toISOString()
    registrar(d, pacienteId, 'Alterou as informações visíveis no QR Code')
    salvar()
    return espera(c)
  },

  /** Gera um novo código: o QR Code antigo deixa de funcionar. */
  gerarNovoToken: async (pacienteId: number): Promise<Carteirinha> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/carteirinha/token`, { method: 'POST' })
    const d = await db()
    podeEditar(d, pacienteId)
    const c = d.carteirinhas.find((x) => x.pacienteId === pacienteId)!
    c.token = novoToken()
    c.ativa = true
    c.atualizadaEm = new Date().toISOString()
    registrar(d, pacienteId, 'Gerou um novo QR Code (o anterior parou de funcionar)')
    salvar()
    return espera(c)
  },

  /** Ligar/desligar o QR Code. Paciente (titular) e profissional vinculado podem. */
  definirAtiva: async (pacienteId: number, ativa: boolean): Promise<Carteirinha> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/carteirinha/${ativa ? 'ativar' : 'revogar'}`, { method: 'POST' })
    const d = await db()
    podeLer(d, pacienteId)
    const c = d.carteirinhas.find((x) => x.pacienteId === pacienteId)!
    c.ativa = ativa
    c.atualizadaEm = new Date().toISOString()
    registrar(d, pacienteId, ativa ? 'Ligou o QR Code da carteirinha' : 'Desligou o QR Code da carteirinha')
    salvar()
    return espera(c)
  },

  /**
   * Página aberta pelo QR Code.
   * - Sem login (ou paciente): resumo de emergência com os campos autorizados.
   * - Profissional logado: ficha técnica completa (o acesso fica registrado no histórico).
   * Retorna null se o código não existe ou foi desligado.
   */
  lerQr: async (token: string): Promise<LeituraQr | null> => {
    if (!MODO_DEMO) {
      try {
        return await http<LeituraQr>(`/api/carteirinha/${encodeURIComponent(token)}`)
      } catch (e) {
        if (e instanceof SessaoExpirada) throw e
        return null
      }
    }
    const d = await db()
    const c = d.carteirinhas.find((x) => x.token === token && x.ativa)
    const p = c && d.pacientes.find((x) => x.id === c.pacienteId)
    if (!c || !p) return espera(null)

    if (sessao?.perfil === 'PROFISSIONAL') {
      const pro = sessao.usuario
      registrar(d, p.id, 'Abriu a ficha técnica pelo QR Code')
      salvar()
      return espera<LeituraQr>({
        tipo: 'FICHA',
        dados: {
          paciente: semSenhaPac(p),
          medicamentos: d.medicamentos.filter((m) => m.pacienteId === p.id),
          consultas: d.consultas.filter((x) => x.pacienteId === p.id),
          estatisticas: calcularEstatisticas(d, p.id),
          responsaveis: d.profissionais.filter((x) => p.profissionaisIds.includes(x.id)).map(semSenhaPro),
          vinculado: p.profissionaisIds.includes(pro.id),
        },
      })
    }

    const tem = (k: CampoCarteirinha) => c.camposAutorizados.includes(k)
    const necessidades = [...p.necessidadesAcessibilidade, p.observacoesAcessibilidade].filter(Boolean).join('. ')
    return espera<LeituraQr>({
      tipo: 'EMERGENCIA',
      dados: {
        nome: p.nome,
        idade: idade(p.dataNascimento),
        tipoSanguineo: tem('tipoSanguineo') ? p.tipoSanguineo || undefined : undefined,
        alergias: tem('alergias') ? p.alergias || undefined : undefined,
        condicoes: tem('condicoes') ? p.condicoes || undefined : undefined,
        necessidadesAcessibilidade: tem('necessidadesAcessibilidade') ? necessidades || undefined : undefined,
        contatoEmergencia: tem('contatoEmergencia') ? { nome: p.contatoEmergenciaNome, parentesco: p.contatoEmergenciaParentesco, telefone: p.contatoEmergenciaTelefone } : undefined,
        medicamentos: tem('medicamentos') ? d.medicamentos.filter((m) => m.pacienteId === p.id && m.ativo).map(({ nome, dosagem }) => ({ nome, dosagem })) : undefined,
        atualizadaEm: c.atualizadaEm,
      },
    })
  },

  /* ---------- Estatísticas (no back-end: JPQL com COUNT / GROUP BY) ---------- */

  getEstatisticas: async (pacienteId: number): Promise<Estatisticas> => {
    if (!MODO_DEMO) return http(`/api/pacientes/${pacienteId}/estatisticas`)
    const d = await db()
    podeLer(d, pacienteId)
    return espera(calcularEstatisticas(d, pacienteId))
  },

  /** Apenas no modo demonstração: apaga tudo e volta aos dados fictícios iniciais. */
  restaurarDemo: async () => {
    memoria = await seed()
    salvar()
    guardarSessao(null)
  },
}

export const ROTULOS_CAMPOS: Record<CampoCarteirinha, string> = {
  tipoSanguineo: 'Tipo sanguíneo',
  alergias: 'Alergias',
  condicoes: 'Condições de saúde',
  medicamentos: 'Medicamentos em uso',
  contatoEmergencia: 'Contato de emergência',
  necessidadesAcessibilidade: 'Necessidades de acessibilidade',
}
