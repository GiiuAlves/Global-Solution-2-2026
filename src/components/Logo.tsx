/** Marca do Saúde Fácil: cartão digital + cruz arredondada (não usa o emblema da Cruz Vermelha). */
export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="2" y="6" width="36" height="28" rx="9" fill="var(--color-brand)" />
      <rect x="9" y="17.5" width="15" height="5.5" rx="2.75" fill="#fff" />
      <rect x="13.75" y="12.75" width="5.5" height="15" rx="2.75" fill="#fff" />
      <rect x="27" y="13" width="5" height="5" rx="1.4" fill="#BFEDE3" />
      <rect x="27" y="22" width="5" height="5" rx="1.4" fill="#BFEDE3" />
    </svg>
  )
}

export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      {!compacto && (
        <span className="text-xl font-extrabold tracking-tight text-ink">
          Saúde <span className="text-brand">Fácil</span>
        </span>
      )}
    </span>
  )
}
