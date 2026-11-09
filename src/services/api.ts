import type {
  CampoCarteirinha,
  Carteirinha,
  CarteirinhaPublica,
  Consulta,
  Estatisticas,
  Medicamento,
  NovaConsulta,
  NovoMedicamento,
  Usuario,
} from '../types'

/**
 * Camada de comunicação com o back-end Java.
 *
 * - Com VITE_API_URL definido (ex.: http://localhost:8080), todas as chamadas vão para a API Spring Boot.
 * - Sem VITE_API_URL, o site roda em MODO DEMONSTRAÇÃO com dados fictícios salvos no navegador.
 *
 * Assim o front-end pode ser desenvolvido e apresentado antes do back-end ficar pronto.
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
export const MODO_DEMO = !BASE_URL
const USUARIO_ID = 1 // protótipo com um usuário; login fica para uma próxima versão

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Erro ${res.status} ao acessar o servidor`)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}
const body = (data: unknown) => JSON.stringify(data)

/* ------------------------------------------------------------------ */
/* Modo demonstração (dados fictícios no navegador)                    */
/* ------------------------------------------------------------------ */

interface DB {
  usuario: Usuario
  consultas: Consulta[]
  medicamentos: Medicamento[]
  carteirinha: Carteirinha
  seq: number
}

const STORAGE_KEY = 'saude-facil:demo-v1'
let memoria: DB | null = null

function iso(d: Date) {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}
function emDias(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}
function novoToken() {
  try {
    return crypto.randomUUID().replace(/-/g, '')
  } catch {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }
}

function seed(): DB {
  const u = USUARIO_ID
  return {
    seq: 100,
    usuario: {
      id: u,
      nome: 'Maria Aparecida Silva',
      dataNascimento: '1954-03-12',
      telefone: '(11) 98888-1234',
      contatoEmergenciaNome: 'Ana Silva (filha)',
      contatoEmergenciaTelefone: '(11) 97777-5678',
      tipoSanguineo: 'O+',
      alergias: 'Dipirona',
      condicoes: 'Hipertensão',
      necessidadesAcessibilidade: 'Baixa visão — prefere letras grandes e informações faladas.',
    },
    consultas: [
      { id: 1, usuarioId: u, especialidade: 'Clínico geral', profissional: 'Dr. Paulo Mendes', local: 'UBS Vila Mariana', data: emDias(-112), horario: '08:30', status: 'REALIZADA' },
      { id: 2, usuarioId: u, especialidade: 'Cardiologia', profissional: 'Dra. Helena Costa', local: 'Hospital São Lucas', data: emDias(-80), horario: '10:00', status: 'REALIZADA' },
      { id: 3, usuarioId: u, especialidade: 'Exame de sangue', local: 'Laboratório Central', data: emDias(-52), horario: '07:00', status: 'REALIZADA', observacoes: 'Jejum de 8 horas' },
      { id: 4, usuarioId: u, especialidade: 'Oftalmologia', profissional: 'Dr. Ricardo Lima', local: 'Clínica Visão', data: emDias(-24), horario: '14:00', status: 'CANCELADA' },
      { id: 5, usuarioId: u, especialidade: 'Clínico geral', profissional: 'Dr. Paulo Mendes', local: 'UBS Vila Mariana', data: emDias(-9), horario: '09:00', status: 'REALIZADA' },
      { id: 6, usuarioId: u, especialidade: 'Oftalmologia', profissional: 'Dr. Ricardo Lima', local: 'Clínica Visão', data: emDias(9), horario: '09:00', status: 'AGENDADA', observacoes: 'Levar os óculos atuais' },
      { id: 7, usuarioId: u, especialidade: 'Cardiologia', profissional: 'Dra. Helena Costa', local: 'Hospital São Lucas', data: emDias(24), horario: '10:30', status: 'AGENDADA', observacoes: 'Retorno com exames' },
    ],
    medicamentos: [
      { id: 1, usuarioId: u, nome: 'Losartana', dosagem: '50 mg — 1 comprimido', horarios: ['08:00', '20:00'], ativo: true },
      { id: 2, usuarioId: u, nome: 'Vitamina D', dosagem: '1 cápsula', horarios: ['12:00'], ativo: true, observacoes: 'Tomar após o almoço' },
      { id: 3, usuarioId: u, nome: 'Colírio lubrificante', dosagem: '1 gota em cada olho', horarios: ['09:00', '15:00', '21:00'], ativo: true },
    ],
    carteirinha: {
      id: 1,
      usuarioId: u,
      token: novoToken(),
      camposAutorizados: ['tipoSanguineo', 'alergias', 'contatoEmergencia', 'necessidadesAcessibilidade', 'medicamentos'],
      ativa: true,
      atualizadaEm: new Date().toISOString(),
    },
  }
}

function db(): DB {
  if (memoria) return memoria
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return (memoria = JSON.parse(raw) as DB)
  } catch {
    /* navegador sem armazenamento: segue só em memória */
  }
  memoria = seed()
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
const proximoId = () => ++db().seq

function idade(dataNascimento?: string) {
  if (!dataNascimento) return undefined
  const n = new Date(dataNascimento + 'T12:00:00')
  const h = new Date()
  let i = h.getFullYear() - n.getFullYear()
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) i--
  return i
}

function calcularEstatisticas(d: DB): Estatisticas {
  const c = d.consultas
  const meses: { mes: string; total: number }[] = []
  const hoje = new Date()
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
  const ativos = d.medicamentos.filter((m) => m.ativo)
  return {
    totalConsultas: c.length,
    consultasAgendadas: c.filter((x) => x.status === 'AGENDADA').length,
    consultasRealizadas: c.filter((x) => x.status === 'REALIZADA').length,
    consultasCanceladas: c.filter((x) => x.status === 'CANCELADA').length,
    totalMedicamentos: d.medicamentos.length,
    medicamentosAtivos: ativos.length,
    dosesPorDia: ativos.reduce((s, m) => s + m.horarios.length, 0),
    consultasPorMes: meses,
    consultasPorEspecialidade: [...porEsp.entries()]
      .map(([especialidade, total]) => ({ especialidade, total }))
      .sort((a, b) => b.total - a.total),
  }
}

/* ------------------------------------------------------------------ */
/* API pública usada pelas telas                                       */
/* ------------------------------------------------------------------ */

export const api = {
  // Usuário
  getUsuario: (): Promise<Usuario> =>
    MODO_DEMO ? espera(db().usuario) : http(`/api/usuarios/${USUARIO_ID}`),

  atualizarUsuario: (dados: Usuario): Promise<Usuario> => {
    if (!MODO_DEMO) return http(`/api/usuarios/${USUARIO_ID}`, { method: 'PUT', body: body(dados) })
    db().usuario = { ...dados, id: USUARIO_ID }
    salvar()
    return espera(db().usuario)
  },

  // Consultas
  listarConsultas: (): Promise<Consulta[]> =>
    MODO_DEMO ? espera(db().consultas) : http(`/api/usuarios/${USUARIO_ID}/consultas`),

  criarConsulta: (c: NovaConsulta): Promise<Consulta> => {
    if (!MODO_DEMO) return http(`/api/usuarios/${USUARIO_ID}/consultas`, { method: 'POST', body: body(c) })
    const nova: Consulta = { ...c, id: proximoId(), usuarioId: USUARIO_ID }
    db().consultas.push(nova)
    salvar()
    return espera(nova)
  },

  atualizarConsulta: (c: Consulta): Promise<Consulta> => {
    if (!MODO_DEMO) return http(`/api/consultas/${c.id}`, { method: 'PUT', body: body(c) })
    db().consultas = db().consultas.map((x) => (x.id === c.id ? c : x))
    salvar()
    return espera(c)
  },

  excluirConsulta: (id: number): Promise<void> => {
    if (!MODO_DEMO) return http(`/api/consultas/${id}`, { method: 'DELETE' })
    db().consultas = db().consultas.filter((x) => x.id !== id)
    salvar()
    return espera(undefined)
  },

  // Medicamentos
  listarMedicamentos: (): Promise<Medicamento[]> =>
    MODO_DEMO ? espera(db().medicamentos) : http(`/api/usuarios/${USUARIO_ID}/medicamentos`),

  criarMedicamento: (m: NovoMedicamento): Promise<Medicamento> => {
    if (!MODO_DEMO) return http(`/api/usuarios/${USUARIO_ID}/medicamentos`, { method: 'POST', body: body(m) })
    const novo: Medicamento = { ...m, id: proximoId(), usuarioId: USUARIO_ID }
    db().medicamentos.push(novo)
    salvar()
    return espera(novo)
  },

  atualizarMedicamento: (m: Medicamento): Promise<Medicamento> => {
    if (!MODO_DEMO) return http(`/api/medicamentos/${m.id}`, { method: 'PUT', body: body(m) })
    db().medicamentos = db().medicamentos.map((x) => (x.id === m.id ? m : x))
    salvar()
    return espera(m)
  },

  excluirMedicamento: (id: number): Promise<void> => {
    if (!MODO_DEMO) return http(`/api/medicamentos/${id}`, { method: 'DELETE' })
    db().medicamentos = db().medicamentos.filter((x) => x.id !== id)
    salvar()
    return espera(undefined)
  },

  // Carteirinha
  getCarteirinha: (): Promise<Carteirinha> =>
    MODO_DEMO ? espera(db().carteirinha) : http(`/api/usuarios/${USUARIO_ID}/carteirinha`),

  atualizarCampos: (campos: CampoCarteirinha[]): Promise<Carteirinha> => {
    if (!MODO_DEMO)
      return http(`/api/usuarios/${USUARIO_ID}/carteirinha`, { method: 'PUT', body: body({ camposAutorizados: campos }) })
    const c = db().carteirinha
    c.camposAutorizados = campos
    c.atualizadaEm = new Date().toISOString()
    salvar()
    return espera(c)
  },

  /** Gera um novo código: o QR Code antigo deixa de funcionar. */
  gerarNovoToken: (): Promise<Carteirinha> => {
    if (!MODO_DEMO) return http(`/api/usuarios/${USUARIO_ID}/carteirinha/token`, { method: 'POST' })
    const c = db().carteirinha
    c.token = novoToken()
    c.ativa = true
    c.atualizadaEm = new Date().toISOString()
    salvar()
    return espera(c)
  },

  /** Liga ou desliga o compartilhamento (revogação). */
  definirAtiva: (ativa: boolean): Promise<Carteirinha> => {
    if (!MODO_DEMO)
      return http(`/api/usuarios/${USUARIO_ID}/carteirinha/${ativa ? 'ativar' : 'revogar'}`, { method: 'POST' })
    const c = db().carteirinha
    c.ativa = ativa
    c.atualizadaEm = new Date().toISOString()
    salvar()
    return espera(c)
  },

  /** Página aberta pelo QR Code. Retorna null se o token não existe ou foi revogado. */
  getCarteirinhaPublica: async (token: string): Promise<CarteirinhaPublica | null> => {
    if (!MODO_DEMO) {
      try {
        return await http<CarteirinhaPublica>(`/api/public/carteirinha/${encodeURIComponent(token)}`)
      } catch {
        return null
      }
    }
    const d = db()
    const c = d.carteirinha
    if (!c.ativa || c.token !== token) return espera(null)
    const u = d.usuario
    const tem = (k: CampoCarteirinha) => c.camposAutorizados.includes(k)
    return espera<CarteirinhaPublica>({
      nome: u.nome,
      idade: idade(u.dataNascimento),
      tipoSanguineo: tem('tipoSanguineo') ? u.tipoSanguineo : undefined,
      alergias: tem('alergias') ? u.alergias : undefined,
      condicoes: tem('condicoes') ? u.condicoes : undefined,
      necessidadesAcessibilidade: tem('necessidadesAcessibilidade') ? u.necessidadesAcessibilidade : undefined,
      contatoEmergencia: tem('contatoEmergencia')
        ? { nome: u.contatoEmergenciaNome, telefone: u.contatoEmergenciaTelefone }
        : undefined,
      medicamentos: tem('medicamentos')
        ? d.medicamentos.filter((m) => m.ativo).map(({ nome, dosagem }) => ({ nome, dosagem }))
        : undefined,
      atualizadaEm: c.atualizadaEm,
    })
  },

  // Estatísticas (no back-end real, calculadas com consultas SQL / JPQL)
  getEstatisticas: (): Promise<Estatisticas> =>
    MODO_DEMO ? espera(calcularEstatisticas(db())) : http(`/api/usuarios/${USUARIO_ID}/estatisticas`),

  /** Apenas no modo demonstração: volta aos dados fictícios iniciais. */
  restaurarDemo: () => {
    memoria = seed()
    salvar()
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
