import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Janela sobreposta acessível: role="dialog", foco preso dentro, Esc fecha
 * e o foco volta para o botão que abriu.
 */
export function Modal({ titulo, aberto, onFechar, children, largura = 'max-w-lg' }: { titulo: string; aberto: boolean; onFechar: () => void; children: ReactNode; largura?: string }) {
  const caixa = useRef<HTMLDivElement>(null)
  const origem = useRef<HTMLElement | null>(null)
  const id = useId()
  const fecharRef = useRef(onFechar)
  fecharRef.current = onFechar

  useEffect(() => {
    if (!aberto) return
    origem.current = document.activeElement as HTMLElement | null
    const focaveis = () =>
      Array.from(caixa.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]') ?? [])
    setTimeout(() => (focaveis()[1] ?? focaveis()[0])?.focus(), 0)
    const html = document.documentElement
    const antes = html.style.overflow
    html.style.overflow = 'hidden'
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        fecharRef.current()
      }
      if (e.key === 'Tab') {
        const f = focaveis()
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault()
          f[f.length - 1].focus()
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault()
          f[0].focus()
        }
      }
    }
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('keydown', tecla)
      html.style.overflow = antes
      setTimeout(() => origem.current?.focus?.(), 0)
    }
  }, [aberto])

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#0b2238]/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div ref={caixa} role="dialog" aria-modal="true" aria-labelledby={id} className={`card my-auto w-full ${largura} rounded-3xl border border-line bg-card p-6 shadow-2xl`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={id} className="text-2xl font-extrabold text-ink">{titulo}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-soft hover:text-ink">
            <X size={22} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
