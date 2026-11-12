import { Lightbulb } from 'lucide-react'
import type { Estatisticas } from '../types'
import { Badge, Card, hojeISO } from './ui'

export const META_ADESAO = 80 // % de referência para boa adesão ao tratamento

export function leituraAdesao(p: number | null) {
  if (p === null) return { texto: 'Sem dados ainda', tom: 'muted' as const }
  if (p >= META_ADESAO) return { texto: 'Boa adesão', tom: 'brand' as const }
  if (p >= 50) return { texto: 'Precisa de atenção', tom: 'warn' as const }
  return { texto: 'Adesão baixa', tom: 'danger' as const }
}

const corBarra = (p: number | null) => (p === null ? 'bg-line' : p >= META_ADESAO ? 'bg-brand' : p >= 50 ? 'bg-[#d79b1c]' : 'bg-danger')

/** Gráfico de adesão dos últimos 7 dias, com linha de meta. */
export function GraficoAdesao({ stats }: { stats: Estatisticas }) {
  const adesao = leituraAdesao(stats.adesaoPercentual7Dias)
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-ink">Adesão ao tratamento — últimos 7 dias</h2>
          <p className="text-muted">Doses confirmadas em relação às previstas. Meta de referência: {META_ADESAO}%.</p>
        </div>
        <Badge tom={adesao.tom}>{stats.adesaoPercentual7Dias !== null && `${stats.adesaoPercentual7Dias}% · `}{adesao.texto}</Badge>
      </div>
      {stats.dosesPorDia === 0 || stats.adesaoPercentual7Dias === null ? (
        <p className="mt-6 text-muted">{stats.dosesPorDia === 0 ? 'Sem remédios em uso, não há doses para acompanhar.' : 'O acompanhamento começa a partir do primeiro horário depois da prescrição.'}</p>
      ) : (
        <div className="relative mt-6 h-52 pl-9 pr-16">
          {[0, 50, 100].map((v) => (
            <div key={v} className="absolute left-9 right-16 border-t border-line" style={{ bottom: `calc(${v}% * 0.7 + 2.25rem)` }} aria-hidden>
              <span className="absolute -left-9 -top-2.5 w-8 text-right text-xs font-bold tabular-nums text-muted">{v}%</span>
            </div>
          ))}
          <div className="absolute left-9 right-16 border-t-2 border-dashed border-warn" style={{ bottom: `calc(${META_ADESAO}% * 0.7 + 2.25rem)` }} aria-hidden>
            <span className="absolute -right-16 -top-2.5 w-14 text-xs font-extrabold text-warn">meta {META_ADESAO}%</span>
          </div>
          <ul className="relative flex h-full items-end gap-2 sm:gap-4" aria-label="Adesão por dia">
            {stats.adesao7Dias.map((d, i) => {
              const pct = d.previstas ? Math.round((Math.min(d.tomadas, d.previstas) / d.previstas) * 100) : null
              const ehHoje = i === 6
              return (
                <li key={d.data} className="flex h-full flex-1 flex-col items-center justify-end">
                  <span className="sr-only">{ehHoje ? 'Hoje' : d.dia}: {pct === null ? 'sem doses previstas ainda' : `${pct}%, ${Math.min(d.tomadas, d.previstas)} de ${d.previstas} doses`}</span>
                  <span className="mb-1 text-sm font-extrabold tabular-nums text-ink" aria-hidden>{pct === null ? '—' : `${pct}%`}</span>
                  <div className={`w-full max-w-12 rounded-t-lg ${corBarra(pct)}`} style={{ height: `calc(${pct ?? 2}% * 0.7)`, minHeight: 4 }} aria-hidden />
                  <span className={`mt-2 h-7 text-sm font-bold capitalize ${ehHoje ? 'text-ink' : 'text-muted'}`} aria-hidden>{ehHoje ? 'hoje' : d.dia}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Card>
  )
}

/** Consultas por mês e por especialidade. */
export function GraficosConsultas({ stats }: { stats: Estatisticas }) {
  const maxMes = Math.max(1, ...stats.consultasPorMes.map((m) => m.total))
  const maxEsp = Math.max(1, ...stats.consultasPorEspecialidade.map((e) => e.total))
  const totalMeses = stats.consultasPorMes.reduce((s, m) => s + m.total, 0)
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="p-6">
        <h2 className="text-xl font-extrabold text-ink">Consultas nos últimos 6 meses</h2>
        <p className="text-muted">Agendadas e realizadas (sem canceladas).</p>
        {totalMeses === 0 ? (
          <p className="mt-6 text-muted">Ainda não há consultas neste período.</p>
        ) : (
          <ul className="mt-6 flex h-48 items-end gap-3" aria-label="Consultas por mês">
            {stats.consultasPorMes.map((m) => (
              <li key={m.mes} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="sr-only">{m.mes}: {m.total} consulta{m.total === 1 ? '' : 's'}</span>
                <span className="text-sm font-extrabold tabular-nums text-ink" aria-hidden>{m.total}</span>
                <div className="w-full max-w-14 rounded-t-lg bg-brand" style={{ height: `${Math.max(3, (m.total / maxMes) * 80)}%`, opacity: m.total ? 1 : 0.2 }} aria-hidden />
                <span className="text-sm font-bold capitalize text-muted" aria-hidden>{m.mes}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-extrabold text-ink">Consultas por especialidade</h2>
        <p className="text-muted">Onde o atendimento tem sido buscado.</p>
        {stats.consultasPorEspecialidade.length === 0 ? (
          <p className="mt-6 text-muted">Sem consultas registradas.</p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {stats.consultasPorEspecialidade.map((e) => (
              <li key={e.especialidade}>
                <div className="flex justify-between gap-3 font-bold text-ink"><span className="min-w-0 truncate">{e.especialidade}</span><span className="tabular-nums">{e.total}</span></div>
                <div className="mt-1 h-3 rounded-full bg-page" aria-hidden>
                  <div className="h-3 rounded-full bg-brand" style={{ width: `${(e.total / maxEsp) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

/** Texto que interpreta os números (critério de análise estatística da GS2). */
export function Interpretacao({ stats, pessoa = 'voce' }: { stats: Estatisticas; pessoa?: 'voce' | 'paciente' }) {
  const voce = pessoa === 'voce'
  const hoje = hojeISO()
  const totalMeses = stats.consultasPorMes.reduce((s, m) => s + m.total, 0)
  const mediaMes = (totalMeses / stats.consultasPorMes.length).toFixed(1).replace('.', ',')
  const passadas = stats.consultasRealizadas + stats.consultasCanceladas
  const taxa = passadas ? Math.round((stats.consultasRealizadas / passadas) * 100) : null
  const piorDia = stats.adesao7Dias.filter((d) => d.previstas).sort((a, b) => a.tomadas / a.previstas - b.tomadas / b.previstas)[0]
  const p = stats.adesaoPercentual7Dias

  return (
    <Card className="flex gap-4 border-brand/30 bg-soft p-6">
      <Lightbulb size={28} className="shrink-0 text-brand-strong" aria-hidden />
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold text-ink">O que esses números mostram</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink">
          {p !== null && (
            <li>
              {voce ? 'Você confirmou' : 'O paciente confirmou'} <strong>{p}% das doses</strong> na última semana —{' '}
              {p >= META_ADESAO
                ? 'acima da meta de referência.'
                : voce
                  ? `abaixo da meta de ${META_ADESAO}%. Os alarmes no celular podem ajudar.`
                  : `abaixo da meta de ${META_ADESAO}%. Vale conversar sobre a rotina, os alarmes no celular e o apoio do familiar.`}
              {piorDia && piorDia.tomadas < piorDia.previstas && <> O dia com mais doses esquecidas foi <strong>{piorDia.data === hoje ? 'hoje' : piorDia.dia}</strong>.</>}
            </li>
          )}
          {totalMeses > 0 && <li>Média de <strong>{mediaMes} consultas por mês</strong> nos últimos 6 meses.</li>}
          {taxa !== null && <li><strong>{taxa}%</strong> das consultas passadas foram realizadas ({stats.consultasCanceladas} cancelada{stats.consultasCanceladas === 1 ? '' : 's'}).</li>}
          {stats.consultasPorEspecialidade[0] && <li>A especialidade mais frequente é <strong>{stats.consultasPorEspecialidade[0].especialidade}</strong>.</li>}
          {stats.dosesPorDia > 0 && <li>{stats.dosesPorDia === 1 ? 'É' : 'São'} <strong>{stats.dosesPorDia} dose{stats.dosesPorDia === 1 ? '' : 's'} por dia</strong> de {stats.medicamentosAtivos} remédio{stats.medicamentosAtivos === 1 ? '' : 's'}.</li>}
          {stats.totalConsultas === 0 && stats.dosesPorDia === 0 && <li>Ainda não há consultas nem remédios cadastrados.</li>}
        </ul>
      </div>
    </Card>
  )
}
