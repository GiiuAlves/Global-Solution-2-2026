import type { Consulta, Medicamento } from '../types'

/**
 * Lembretes no celular.
 * O navegador não pode criar um alarme direto no relógio do celular, então usamos a AGENDA:
 *  - Google Agenda: abre o evento pronto para salvar (Android e qualquer celular com conta Google).
 *  - Arquivo .ics: abre na agenda do iPhone, Samsung, Outlook… com aviso sonoro na hora (VALARM).
 * Remédios viram eventos diários repetidos; consultas avisam 1 dia antes e 2 horas antes.
 */

const pad = (n: number) => String(n).padStart(2, '0')
/** Data/hora "flutuante" (sem fuso): o celular usa o horário local da pessoa. */
const dt = (data: string, hhmm: string) => `${data.replace(/-/g, '')}T${hhmm.replace(':', '')}00`
function somarMinutos(data: string, hhmm: string, min: number) {
  const d = new Date(`${data}T${hhmm}:00`)
  d.setMinutes(d.getMinutes() + min)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}
function hojeISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
/** Linhas do .ics têm no máximo 75 caracteres. */
const dobrar = (linha: string) => linha.match(/.{1,73}/g)!.join('\r\n ')
const carimbo = () => new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'

interface Evento {
  uid: string
  titulo: string
  inicio: string
  fim: string
  descricao: string
  local?: string
  diario?: boolean
  alarmes: string[] // ex.: '-PT0M', '-P1D'
}

function ics(eventos: Evento[]) {
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Saude Facil//GS2 FIAP//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const e of eventos) {
    linhas.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@saudefacil`,
      `DTSTAMP:${carimbo()}`,
      `DTSTART:${e.inicio}`,
      `DTEND:${e.fim}`,
      ...(e.diario ? ['RRULE:FREQ=DAILY'] : []),
      `SUMMARY:${esc(e.titulo)}`,
      `DESCRIPTION:${esc(e.descricao)}`,
      ...(e.local ? [`LOCATION:${esc(e.local)}`] : []),
    )
    for (const a of e.alarmes) linhas.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.titulo)}`, `TRIGGER:${a}`, 'END:VALARM')
    linhas.push('END:VEVENT')
  }
  linhas.push('END:VCALENDAR')
  return linhas.map(dobrar).join('\r\n')
}

function eventosRemedio(m: Medicamento): Evento[] {
  const data = hojeISO()
  return m.horarios.map((h) => ({
    uid: `remedio-${m.id}-${h.replace(':', '')}`,
    titulo: `💊 Tomar ${m.nome}`,
    inicio: dt(data, h),
    fim: somarMinutos(data, h, 10),
    descricao: [`${m.nome}: ${m.dosagem}`, m.observacoes, m.prescritoPor && `Prescrito por ${m.prescritoPor}`, 'Depois de tomar, confirme no Saúde Fácil.'].filter(Boolean).join('\n'),
    diario: true,
    alarmes: ['-PT0M'],
  }))
}

function eventoConsulta(c: Consulta): Evento {
  return {
    uid: `consulta-${c.id}`,
    titulo: `🩺 Consulta: ${c.especialidade}`,
    inicio: dt(c.data, c.horario),
    fim: somarMinutos(c.data, c.horario, 60),
    descricao: [c.profissional && `Com ${c.profissional}`, c.observacoes, 'Leve sua carteirinha do Saúde Fácil.'].filter(Boolean).join('\n'),
    local: c.local,
    alarmes: ['-P1D', '-PT2H'],
  }
}

/* ---------- Google Agenda ---------- */

function linkGoogle(e: Evento) {
  const p = new URLSearchParams({ action: 'TEMPLATE', text: e.titulo, dates: `${e.inicio}/${e.fim}`, details: e.descricao, ctz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo' })
  if (e.local) p.set('location', e.local)
  if (e.diario) p.set('recur', 'RRULE:FREQ=DAILY')
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export const linksGoogleRemedio = (m: Medicamento) => m.horarios.map((h, i) => ({ horario: h, url: linkGoogle(eventosRemedio(m)[i]) }))
export const linkGoogleConsulta = (c: Consulta) => linkGoogle(eventoConsulta(c))

/* ---------- Arquivo .ics ---------- */

function baixar(nome: string, conteudo: string) {
  const blob = new Blob([conteudo], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
const arquivo = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()

export const baixarIcsRemedios = (meds: Medicamento[], nome = 'meus-remedios') =>
  baixar(`${arquivo(nome)}.ics`, ics(meds.filter((m) => m.ativo).flatMap(eventosRemedio)))
export const baixarIcsConsulta = (c: Consulta) => baixar(`consulta-${arquivo(c.especialidade)}-${c.data}.ics`, ics([eventoConsulta(c)]))
export const baixarIcsConsultas = (cs: Consulta[]) => baixar('minhas-consultas.ics', ics(cs.map(eventoConsulta)))
