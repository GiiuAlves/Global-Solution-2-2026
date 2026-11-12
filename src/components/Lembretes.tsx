import { useState } from 'react'
import { AlarmClock, CalendarPlus, Download, ExternalLink, BellRing } from 'lucide-react'
import type { Consulta, Medicamento } from '../types'
import { Button, btnClass } from './ui'
import { Modal } from './Modal'
import { baixarIcsConsulta, baixarIcsRemedios, linkGoogleConsulta, linksGoogleRemedio } from '../services/calendario'

/** Na prévia publicada o navegador bloqueia downloads; lá mostramos só o Google Agenda. */
export const PREVIA = import.meta.env.MODE === 'artifact'

function ComoFunciona({ tipo }: { tipo: 'remedio' | 'consulta' }) {
  return (
    <p className="mt-4 flex gap-2 rounded-xl bg-page p-3 text-sm text-muted">
      <BellRing size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden />
      {tipo === 'remedio'
        ? 'O lembrete se repete todo dia e o celular toca no horário, como um alarme. Depois de tomar, aperte "Tomei" aqui no Saúde Fácil.'
        : 'O celular avisa 1 dia antes e 2 horas antes da consulta.'}
    </p>
  )
}

function OpcaoIcs({ onBaixar, texto }: { onBaixar: () => void; texto: string }) {
  if (PREVIA) return null
  return (
    <Button variant="secondary" className="w-full !justify-start" onClick={onBaixar}>
      <Download size={20} aria-hidden /> {texto}
    </Button>
  )
}

/** Botão "Lembrete no celular" de um remédio. */
export function LembreteRemedio({ m, compacto }: { m: Medicamento; compacto?: boolean }) {
  const [aberto, setAberto] = useState(false)
  if (!m.ativo) return null
  return (
    <>
      <Button variant="secondary" className="!min-h-10" onClick={() => setAberto(true)} aria-label={`${compacto ? "Alarme" : "Alarme no celular"} para ${m.nome}`}>
        <AlarmClock size={18} aria-hidden /> {compacto ? 'Alarme' : 'Alarme no celular'}
      </Button>
      <Modal titulo={`Alarme para ${m.nome}`} aberto={aberto} onFechar={() => setAberto(false)}>
        <p className="text-lg text-muted">Escolha a agenda do seu celular. Um lembrete para cada horário:</p>
        <ul className="mt-4 flex flex-col gap-2">
          {linksGoogleRemedio(m).map(({ horario, url }) => (
            <li key={horario}>
              <a href={url} target="_blank" rel="noreferrer" className={btnClass('primary', 'w-full !justify-between')}>
                <span className="inline-flex items-center gap-2"><CalendarPlus size={20} aria-hidden /> Google Agenda — {horario}</span>
                <ExternalLink size={18} aria-hidden />
              </a>
            </li>
          ))}
          <li>
            <OpcaoIcs texto="iPhone, Samsung e outras agendas (todos os horários)" onBaixar={() => baixarIcsRemedios([m], m.nome)} />
          </li>
        </ul>
        <ComoFunciona tipo="remedio" />
      </Modal>
    </>
  )
}

/** Botão para mandar TODOS os remédios em uso para a agenda de uma vez. */
export function LembreteTodosRemedios({ meds }: { meds: Medicamento[] }) {
  const [aberto, setAberto] = useState(false)
  const ativos = meds.filter((m) => m.ativo)
  if (!ativos.length) return null
  const total = ativos.reduce((s, m) => s + m.horarios.length, 0)
  return (
    <>
      <Button onClick={() => setAberto(true)}>
        <AlarmClock size={20} aria-hidden /> Colocar todos no alarme
      </Button>
      <Modal titulo="Alarmes de todos os remédios" aberto={aberto} onFechar={() => setAberto(false)} largura="max-w-xl">
        <p className="text-lg text-muted">{total} lembretes diários de {ativos.length} remédio{ativos.length > 1 ? 's' : ''}.</p>
        {!PREVIA && (
          <div className="mt-4">
            <Button className="w-full" onClick={() => baixarIcsRemedios(ativos)}>
              <Download size={20} aria-hidden /> Baixar todos para a agenda do celular
            </Button>
            <p className="mt-2 text-sm text-muted">Funciona no iPhone, Samsung, Outlook e Google Agenda.</p>
          </div>
        )}
        <p className="mt-5 font-bold text-ink">{PREVIA ? 'Adicione cada horário ao Google Agenda:' : 'Ou um por um no Google Agenda:'}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {ativos.flatMap((m) =>
            linksGoogleRemedio(m).map(({ horario, url }) => (
              <li key={m.id + horario}>
                <a href={url} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 border-line px-4 font-bold text-ink hover:border-brand">
                  <span><span className="tabular-nums text-brand">{horario}</span> · {m.nome}</span>
                  <ExternalLink size={18} className="shrink-0 text-muted" aria-hidden />
                </a>
              </li>
            )),
          )}
        </ul>
        <ComoFunciona tipo="remedio" />
      </Modal>
    </>
  )
}

/** Botão "Pôr na agenda" de uma consulta. */
export function LembreteConsulta({ c }: { c: Consulta }) {
  const [aberto, setAberto] = useState(false)
  if (c.status !== 'AGENDADA') return null
  return (
    <>
      <Button variant="secondary" className="!min-h-10" onClick={() => setAberto(true)} aria-label={`Pôr na agenda: consulta de ${c.especialidade}`}>
        <CalendarPlus size={18} aria-hidden /> Pôr na agenda
      </Button>
      <Modal titulo={`Consulta de ${c.especialidade}`} aberto={aberto} onFechar={() => setAberto(false)}>
        <p className="text-lg text-muted">Salvar na agenda do celular:</p>
        <ul className="mt-4 flex flex-col gap-2">
          <li>
            <a href={linkGoogleConsulta(c)} target="_blank" rel="noreferrer" className={btnClass('primary', 'w-full !justify-between')}>
              <span className="inline-flex items-center gap-2"><CalendarPlus size={20} aria-hidden /> Google Agenda</span>
              <ExternalLink size={18} aria-hidden />
            </a>
          </li>
          <li>
            <OpcaoIcs texto="iPhone, Samsung e outras agendas" onBaixar={() => baixarIcsConsulta(c)} />
          </li>
        </ul>
        <ComoFunciona tipo="consulta" />
      </Modal>
    </>
  )
}
