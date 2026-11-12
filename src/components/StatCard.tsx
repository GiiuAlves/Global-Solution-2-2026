import type { ReactNode } from 'react'
import { Card } from './ui'

export function StatCard({ valor, rotulo, detalhe, icone }: { valor: number | string; rotulo: string; detalhe?: string; icone: ReactNode }) {
  return (
    <Card className="flex items-start gap-4 p-4 sm:p-5">
      <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-soft text-brand sm:grid" aria-hidden>
        {icone}
      </span>
      <div className="min-w-0">
        <p className="text-3xl font-extrabold leading-none text-ink">{valor}</p>
        <p className="mt-1.5 font-bold text-ink">{rotulo}</p>
        {detalhe && <p className="text-sm text-muted">{detalhe}</p>}
      </div>
    </Card>
  )
}
