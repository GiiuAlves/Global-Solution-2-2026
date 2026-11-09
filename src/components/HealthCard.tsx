import { QRCodeSVG } from 'qrcode.react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { LogoMark } from './Logo'

interface Props {
  nome: string
  tipoSanguineo?: string
  contato?: string
  url?: string // link público com o token; sem url = carteirinha demonstrativa
  ativa?: boolean
}

/** Visual da Carteirinha Digital. O QR Code contém só o link com o token, nunca dados médicos. */
export function HealthCard({ nome, tipoSanguineo, contato, url, ativa = true }: Props) {
  return (
    <div
      className="relative w-full max-w-md overflow-hidden rounded-3xl p-6 text-white shadow-xl"
      style={{ background: 'linear-gradient(135deg, var(--color-brand) 0%, #0b5f7a 100%)' }}
      aria-label={`Carteirinha digital de ${nome}`}
      role="img"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/5" />
      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-extrabold">
          <span className="rounded-lg bg-white p-0.5"><LogoMark size={26} /></span>
          Saúde Fácil
        </span>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">Carteirinha digital</span>
      </div>

      <div className="relative mt-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Titular</p>
          <p className="truncate text-xl font-extrabold">{nome}</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-white/75">Tipo sanguíneo</dt>
              <dd className="text-lg font-extrabold">{tipoSanguineo || '—'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-white/75">Emergência</dt>
              <dd className="truncate font-bold">{contato || '—'}</dd>
            </div>
          </dl>
        </div>
        <div className={`shrink-0 rounded-2xl bg-white p-2.5 ${ativa ? '' : 'opacity-30'}`}>
          {url ? (
            <QRCodeSVG value={url} size={104} level="M" fgColor="#123B5D" />
          ) : (
            <div className="grid h-[104px] w-[104px] place-items-center text-center text-xs font-bold text-ink">QR Code</div>
          )}
        </div>
      </div>

      <p className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90">
        {ativa ? <ShieldCheck size={16} aria-hidden /> : <ShieldOff size={16} aria-hidden />}
        {ativa ? 'Compartilhamento controlado pelo titular' : 'Compartilhamento revogado'}
      </p>
    </div>
  )
}
